from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os
from supabase_db import (
    supabase_db,
    fetch_one,
    fetch_all,
    fetch_val, #added new
    execute
)
from pydantic import BaseModel
import base64
import requests
from datetime import datetime, timedelta, timezone



# Load environment variables
load_dotenv()

app = FastAPI()

async def refresh_google_token(
    refresh_token: str
):
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
    )

    return response.json()

@app.on_event("startup")
async def startup():
    await supabase_db.connect()


@app.on_event("shutdown")
async def shutdown():
    await supabase_db.disconnect()

# Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY"),
    max_age=86400,
    same_site="none",
    https_only=True,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth Configuration
oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
    "scope": (
        "openid "
        "email "
        "profile "
        "https://www.googleapis.com/auth/gmail.readonly "
        "https://www.googleapis.com/auth/gmail.send"
    )
}
)

# Home Route
@app.get("/")
def home():
    return {"message": "Backend Running"}


# Google Login
@app.get("/auth/google/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth_callback")

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        access_type="offline",
        prompt="consent"
    )


# Google Callback
# Google Callback
@app.get("/auth/google/callback")
async def auth_callback(request: Request):

    token = await oauth.google.authorize_access_token(request)

    user = token.get("userinfo", {})

    # Store OAuth data in Supabase
    query = """
    INSERT INTO recruiting_saved.gmail_connections
    (
        google_user_id,
        email,
        access_token,
        refresh_token,
        token_type,
        expires_at,
        is_active,
        created_at,
        update_at
    )
    VALUES
    (
        :google_user_id,
        :email,
        :access_token,
        :refresh_token,
        :token_type,
        :expires_at,
        :is_active,
        NOW(),
        NOW()
    )
    ON CONFLICT (email)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_type = EXCLUDED.token_type,
        expires_at = EXCLUDED.expires_at,
        is_active = TRUE,
        update_at = NOW()
    """

    await execute(
        query,
        {
            "google_user_id": user.get("sub"),
            "email": user.get("email"),
            "access_token": token.get("access_token"),
            "refresh_token": token.get("refresh_token"),
            "token_type": token.get("token_type"),
            "expires_at": str(token.get("expires_at")),
            "is_active": True,
        }
    )

    # Get gmail connection id
    connection = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.gmail_connections
        WHERE email = :email
        """,
        {
            "email": user.get("email")
        }
    )

    # Check if mailbox settings already exist
    settings_exists = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.gmail_mailbox_settings
        WHERE gmail_connection_id = :gmail_connection_id
        """,
        {
            "gmail_connection_id": connection["id"]
        }
    )

    # Create default mailbox settings if missing
    if not settings_exists:

        await execute(
            """
            INSERT INTO recruiting_saved.gmail_mailbox_settings
            (
                gmail_connection_id,
                sender_name,
                max_emails_per_day,
                signature_name,
                created_at,
                updated_at
            )
            VALUES
            (
                :gmail_connection_id,
                :sender_name,
                :max_emails_per_day,
                :signature_name,
                NOW(),
                NOW()
            )
            """,
            {
                "gmail_connection_id": connection["id"],
                "sender_name": user.get("name"),
                "max_emails_per_day": 100,
                "signature_name": "Default Signature",
            }
        )

    # Save user in session
    request.session["user"] = {
        "email": user.get("email"),
        "name": user.get("name"),
    }

    return RedirectResponse(
        url="http://localhost:3000/integrations"
    )


# Connection Status
@app.get("/auth/google/status")
def google_status(request: Request):

    user = request.session.get("user")

    if user:
        return {
            "connected": True,
            "user": user
        }

    return {
        "connected": False
    }


# Logout
@app.get("/auth/google/logout")
def logout(request: Request):
    request.session.clear()

    return {
        "message": "Logged out successfully"
    }
    
#get email connections  
@app.get("/gmail/connections")
async def get_connections(request: Request):
    
    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    SELECT
    gc.id,
    gc.email,
    gc.google_user_id,
    gc.is_active,
    gc.created_at,

    gms.sender_name,
    gms.max_emails_per_day,
    gms.signature_name

FROM recruiting_saved.gmail_connections gc

LEFT JOIN recruiting_saved.gmail_mailbox_settings gms
    ON gc.id = gms.gmail_connection_id

WHERE gc.email = :email
    """

    data = await fetch_all(
    query,
    {
        "email": user["email"]
    }
)

    return {
        "success": True,
        "data": [dict(row) for row in data]
    }
    
    
#gmail connections mail box settings 
@app.get("/gmail/mailbox-settings")
async def get_mailbox_settings(request: Request):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    SELECT
    gms.id,
    gc.id as gmail_connection_id,

    gc.email,
    gc.google_user_id,
    gc.is_active,
    gc.created_at,

    gms.sender_name,
    gms.max_emails_per_day,
    gms.signature_name

FROM recruiting_saved.gmail_connections gc

LEFT JOIN recruiting_saved.gmail_mailbox_settings gms
    ON gc.id = gms.gmail_connection_id

WHERE gc.email = :email
    """

    data = await fetch_all(
        query,
        {
            "email": user["email"]
        }
    )

    return {
        "success": True,
        "data": [dict(row) for row in data]
    }
    
#to save endpont 
@app.patch("/gmail/mailbox-settings/{setting_id}")
async def update_mailbox_settings(
    setting_id: int,
    payload: dict
):

    query = """
    UPDATE recruiting_saved.gmail_mailbox_settings
    SET
        sender_name = :sender_name,
        max_emails_per_day = :max_emails_per_day,
        signature_name = :signature_name,
        updated_at = NOW()
    WHERE id = :setting_id
    """

    await execute(
        query,
        {
            "sender_name": payload["sender_name"],
            "max_emails_per_day": payload["max_emails_per_day"],
            "signature_name": payload["signature_name"],
            "setting_id": setting_id,
        }
    )

    return {
        "success": True
    }
    
    
#delete disconnect endpoint 
@app.delete("/gmail/connections/{connection_id}")
async def disconnect_gmail(
    connection_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    DELETE FROM recruiting_saved.gmail_connections
    WHERE id = :connection_id
    AND email = :email
    """

    await execute(
        query,
        {
            "connection_id": connection_id,
            "email": user["email"]
        }
    )

    return {
        "success": True
    }
    
    
#get signatures api 
@app.get("/gmail/signatures")
async def get_signatures(request: Request):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    SELECT
        gs.id,
        gs.name,
        gs.content,
        gs.is_default,
        gs.created_at
    FROM recruiting_saved.gmail_signatures gs
    JOIN recruiting_saved.gmail_connections gc
        ON gs.gmail_connection_id = gc.id
    WHERE gc.email = :email
    ORDER BY gs.id DESC
    """

    data = await fetch_all(
        query,
        {
            "email": user["email"]
        }
    )

    return {
        "success": True,
        "data": [dict(row) for row in data]
    }
    
#create signature 
@app.post("/gmail/signatures")
async def create_signature(
    request: Request,
    payload: dict
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    connection = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.gmail_connections
        WHERE email = :email
        """,
        {
            "email": user["email"]
        }
    )

    if not connection:
        return {
            "success": False,
            "message": "No mailbox connected"
        }

    await execute(
        """
        INSERT INTO recruiting_saved.gmail_signatures
        (
            gmail_connection_id,
            name,
            content,
            is_default,
            created_at,
            updated_at
        )
        VALUES
        (
            :gmail_connection_id,
            :name,
            :content,
            :is_default,
            NOW(),
            NOW()
        )
        """,
        {
            "gmail_connection_id": connection["id"],
            "name": payload["name"],
            "content": payload["content"],
            "is_default": False,
        }
    )

    return {
        "success": True
    }


#delete signatures 
@app.delete("/gmail/signatures/{signature_id}")
async def delete_signature(
    signature_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    DELETE FROM recruiting_saved.gmail_signatures
    WHERE id = :signature_id
    AND gmail_connection_id IN (
        SELECT id
        FROM recruiting_saved.gmail_connections
        WHERE email = :email
    )
    """

    await execute(
        query,
        {
            "signature_id": signature_id,
            "email": user["email"]
        }
    )

    return {
        "success": True
    }
    
    
#email template
class EmailTemplateCreate(BaseModel):
    template_name: str
    subject: str
    body: str

class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    
class SendBulkEmailRequest(BaseModel):
    mailbox_id: int
    template_id: int
    signature_id: int
    candidates: list
#------------------new addition --------------  
#sequence build 
class CreateSequenceRequest(BaseModel):
    name: str
    mailbox_id: int
    
class CreateSequenceStepRequest(BaseModel):
    sequence_id: int
    template_id: int
    delay_value: int
    delay_unit: str
    


class CandidateEnrollment(BaseModel):
    name: str
    email: str

class EnrollCandidatesRequest(BaseModel):
    sequence_id: int
    candidates: list[CandidateEnrollment]
    
    
# Create Email Sequence-----------------------
@app.post("/email-sequences")
async def create_email_sequence(
    data: CreateSequenceRequest,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    connection = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.gmail_connections
        WHERE id = :mailbox_id
        AND email = :email
        """,
        {
            "mailbox_id": data.mailbox_id,
            "email": user["email"]
        }
    )

    if not connection:
        return {
            "success": False,
            "message": "Mailbox not found"
        }

    await execute(
        """
        INSERT INTO recruiting_saved.email_sequences
        (
            name,
            mailbox_id,
            created_by,
            status,
            created_at,
            updated_at
        )
        VALUES
        (  
            :name,
            :mailbox_id,
            :created_by,
            'draft',
            NOW(),
            NOW()
        )
        """,
        {
            "name": data.name,
            "mailbox_id": data.mailbox_id,
            "created_by": user["email"]
        }
    )

    return {
        "success": True,
        "message": "Sequence created successfully"
    }
    
# Get Email Sequences -------------------
@app.get("/email-sequences")
async def get_email_sequences(request: Request):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
SELECT
    es.id,
    es.name,
    es.status,
    es.created_at,
    gc.email AS mailbox_email,

    COUNT(DISTINCT ess.id) AS step_count,
    COUNT(DISTINCT se.id) AS candidate_count

FROM recruiting_saved.email_sequences es

JOIN recruiting_saved.gmail_connections gc
    ON es.mailbox_id = gc.id

LEFT JOIN recruiting_saved.email_sequence_steps ess
    ON ess.sequence_id = es.id

LEFT JOIN recruiting_saved.sequence_enrollments se
    ON se.sequence_id = es.id

WHERE es.created_by = :email

GROUP BY
    es.id,
    es.name,
    es.status,
    es.created_at,
    gc.email

ORDER BY es.id DESC
"""

    data = await fetch_all(
        query,
        {
            "email": user["email"]
        }
    )

    return {
        "success": True,
        "data": [dict(row) for row in data]
    }
    
    
# Get Single Email Sequence
@app.get("/email-sequences/{sequence_id}")
async def get_email_sequence(
    sequence_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    sequence = await fetch_one(
        """
        SELECT
            es.id,
            es.name,
            es.status,
            es.created_at,
            gc.email AS mailbox_email,
            gc.id AS mailbox_id

        FROM recruiting_saved.email_sequences es

        JOIN recruiting_saved.gmail_connections gc
            ON es.mailbox_id = gc.id

        WHERE es.id = :sequence_id
        AND es.created_by = :email
        """,
        {
            "sequence_id": sequence_id,
            "email": user["email"]
        }
    )

    if not sequence:
        return {
            "success": False,
            "message": "Sequence not found"
        }

    return {
        "success": True,
        "data": dict(sequence)
    }
    
    
# Create Sequence Step------------------
@app.post("/email-sequence-steps")
async def create_sequence_step(
    data: CreateSequenceStepRequest,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    sequence = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.email_sequences
        WHERE id = :sequence_id
        AND created_by = :email
        """,
        {
            "sequence_id": data.sequence_id,
            "email": user["email"]
        }
    )

    if not sequence:
        return {
            "success": False,
            "message": "Sequence not found"
        }
    step_count = await fetch_val(
        """
           SELECT COUNT(*)
           FROM recruiting_saved.email_sequence_steps
           WHERE sequence_id = :sequence_id
           """,
          {
        "sequence_id": data.sequence_id
         }
        )

    step_number = step_count + 1
    display_order = step_number * 100

    await execute(
        """
        INSERT INTO recruiting_saved.email_sequence_steps
        (
          sequence_id,
step_number,
display_order,
step_type,
template_id,
delay_value,
delay_unit,
created_at
        )
        VALUES
        (
            
              :sequence_id,
:step_number,
:display_order,
'email',
:template_id,
:delay_value,
:delay_unit,
NOW()

        )
        """,
        
{
    "sequence_id": data.sequence_id,
    "step_number": step_number,
    "display_order": display_order,
    "template_id": data.template_id,
    "delay_value": data.delay_value,
    "delay_unit": data.delay_unit
}

    )

    return {
        "success": True,
        "message": "Sequence step created successfully"
    }
    
# Get Sequence Steps--------------------------
@app.get("/email-sequence-steps/{sequence_id}")
async def get_sequence_steps(
    sequence_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    SELECT
    ess.id,
    ess.step_number,
    ess.display_order,
    ess.step_type,
    ess.template_id,
    et.template_name,
    ess.delay_value,
    ess.delay_unit

    FROM recruiting_saved.email_sequence_steps ess

    JOIN recruiting_saved.email_sequences es
        ON ess.sequence_id = es.id

    JOIN recruiting_saved.email_templates et
        ON ess.template_id = et.id

    WHERE ess.sequence_id = :sequence_id
    AND es.created_by = :email

   ORDER BY ess.display_order
    """

    data = await fetch_all(
        query,
        {
            "sequence_id": sequence_id,
            "email": user["email"]
        }
    )

    return {
        "success": True,
        "data": [dict(row) for row in data]
    }
    
    
# Sequence Builder
@app.get("/sequence-builder/{sequence_id}")
async def get_sequence_builder(
    sequence_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    sequence = await fetch_one(
        """
        SELECT
            es.id,
            es.name,
            es.status,
            gc.id AS mailbox_id,
            gc.email AS mailbox_email

        FROM recruiting_saved.email_sequences es

        JOIN recruiting_saved.gmail_connections gc
            ON es.mailbox_id = gc.id

        WHERE
            es.id = :sequence_id
            AND es.created_by = :email
        """,
        {
            "sequence_id": sequence_id,
            "email": user["email"]
        }
    )

    if not sequence:
        return {
            "success": False,
            "message": "Sequence not found"
        }

    steps = await fetch_all(
        """
        SELECT
            ess.id,
            ess.step_number,
            ess.display_order,
            ess.step_type,
            ess.template_id,
            et.template_name,
            ess.delay_value,
            ess.delay_unit

        FROM recruiting_saved.email_sequence_steps ess

        JOIN recruiting_saved.email_templates et
            ON ess.template_id = et.id

        WHERE ess.sequence_id = :sequence_id

        ORDER BY ess.display_order
        """,
        {
            "sequence_id": sequence_id
        }
    )

    return {
        "success": True,
        "data": {
            "sequence": dict(sequence),
            "steps": [dict(row) for row in steps]
        }
    }
    
    
@app.get("/candidates")
async def get_candidates():

    return {
        "success": True,
        "data": [
            {
                "name": "Pushti Nirma",
                "email": "23bce272@nirmauni.ac.in"
            },
            {
                "name": "Shreni Shah",
                "email": "shreni1499@gmail.com"
            },
            {
                "name": "Hirak Patel",
                "email": "hirakpatidar@gmail.com"
            },
            {
                "name": "Anjali Agrawal",
                "email": "anjaliagrawal3097@gmail.com"
            },
            {
                "name": "IEEE WIE NU",
                "email": "ieeewienu@gmail.com"
            }
        ]
    }
    
# Start Sequence
@app.post("/email-sequences/{sequence_id}/start")
async def start_sequence(
    sequence_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    sequence = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.email_sequences
        WHERE id = :sequence_id
        AND created_by = :email
        """,
        {
            "sequence_id": sequence_id,
            "email": user["email"]
        }
    )

    if not sequence:
        return {
            "success": False,
            "message": "Sequence not found"
        }

    # Make sure candidates are enrolled
    enrollment_count = await fetch_one(
        """
        SELECT COUNT(*) AS total
        FROM recruiting_saved.sequence_enrollments
        WHERE sequence_id = :sequence_id
        """,
        {
            "sequence_id": sequence_id
        }
    )

    if enrollment_count["total"] == 0:
        return {
            "success": False,
            "message": "Please enroll candidates before starting the sequence."
        }

    # Update sequence status
    await execute(
        """
        UPDATE recruiting_saved.email_sequences
        SET
            status = 'running',
            updated_at = NOW()
        WHERE id = :sequence_id
        """,
        {
            "sequence_id": sequence_id
        }
    )

    # Activate enrolled candidates
    await execute(
        """
        UPDATE recruiting_saved.sequence_enrollments
        SET
            status = 'running',
            next_send_at = NOW()
        WHERE sequence_id = :sequence_id
        """,
        {
            "sequence_id": sequence_id
        }
    )

    return {
        "success": True,
        "message": "Sequence started successfully"
    }
    
@app.post("/sequence-enrollments")
async def enroll_candidates(
    payload: EnrollCandidatesRequest,
    request: Request,
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized",
        }

    # Remove existing enrollments for this sequence
    await execute(
        """
        DELETE FROM recruiting_saved.sequence_enrollments
        WHERE sequence_id = :sequence_id
        """,
        {
            "sequence_id": payload.sequence_id,
        },
    )

    # Insert selected candidates
    for candidate in payload.candidates:

        await execute(
            """
            INSERT INTO recruiting_saved.sequence_enrollments
            (
                sequence_id,
                candidate_name,
                candidate_email,
                current_step,
                status,
                next_send_at,
                created_at
            )
            VALUES
            (
                :sequence_id,
                :candidate_name,
                :candidate_email,
                1,
                'pending',
                NOW(),
                NOW()
            )
            """,
            {
                "sequence_id": payload.sequence_id,
                "candidate_name": candidate.name,
                "candidate_email": candidate.email,
            },
        )

    return {
        "success": True,
        "message": "Candidates enrolled successfully",
    }
    
# Scheduler
@app.post("/scheduler/run")
async def run_scheduler():

    enrollments = await fetch_all(
        """
        SELECT *
        FROM recruiting_saved.sequence_enrollments
        WHERE status = 'running'
        AND next_send_at <= NOW()
        """
    )

    for enrollment in enrollments:

        print("Processing:", enrollment["candidate_email"])

        step = await fetch_one(
            """
            SELECT *
            FROM recruiting_saved.email_sequence_steps
            WHERE sequence_id = :sequence_id
            AND step_number = :step
            """,
            {
                "sequence_id": enrollment["sequence_id"],
                "step": enrollment["current_step"],
            },
        )

        if not step:
            continue

        template = await fetch_one(
            """
            SELECT subject, body
            FROM recruiting_saved.email_templates
            WHERE id = :template_id
            """,
            {
                "template_id": step["template_id"],
            },
        )

        if not template:
            continue

        sequence = await fetch_one(
            """
            SELECT mailbox_id
            FROM recruiting_saved.email_sequences
            WHERE id = :id
            """,
            {
                "id": enrollment["sequence_id"],
            },
        )

        if not sequence:
            continue

        mailbox = await fetch_one(
            """
            SELECT *
            FROM recruiting_saved.gmail_connections
            WHERE id = :id
            """,
            {
                "id": sequence["mailbox_id"],
            },
        )

        if not mailbox:
            continue

        gmail_response = await send_sequence_email(
            mailbox,
            template,
            enrollment["candidate_name"],
            enrollment["candidate_email"],
        )

        print("GMAIL STATUS:", gmail_response.status_code)

        if gmail_response.status_code != 200:
            print(gmail_response.text)
            continue

        next_step = await fetch_one(
            """
            SELECT *
            FROM recruiting_saved.email_sequence_steps
            WHERE sequence_id = :sequence_id
            AND step_number = :step
            """,
            {
                "sequence_id": enrollment["sequence_id"],
                "step": enrollment["current_step"] + 1,
            },
        )

        if next_step:

            next_send = datetime.now(timezone.utc) + timedelta(
                days=next_step["delay_value"]
            )

            await execute(
                """
                UPDATE recruiting_saved.sequence_enrollments
                SET
                    current_step = :step_number,
                    last_sent_at = NOW(),
                    next_send_at = :next_send
                WHERE id = :id
                """,
                {
                    "step_number": next_step["step_number"],
                    "next_send": next_send,
                    "id": enrollment["id"],
                },
            )

            print(f"Moved to Step {next_step['step_number']}")

        else:

            await execute(
                """
                UPDATE recruiting_saved.sequence_enrollments
                SET
                    status = 'completed',
                    completed_at = NOW(),
                    last_sent_at = NOW()
                WHERE id = :id
                """,
                {
                    "id": enrollment["id"],
                },
            )

            remaining = await fetch_one(
                """
                SELECT COUNT(*) AS count
                FROM recruiting_saved.sequence_enrollments
                WHERE sequence_id = :sequence_id
                AND status <> 'completed'
                """,
                {
                    "sequence_id": enrollment["sequence_id"],
                },
            )

            if remaining["count"] == 0:

                await execute(
                    """
                    UPDATE recruiting_saved.email_sequences
                    SET
                        status = 'completed',
                        updated_at = NOW()
                    WHERE id = :sequence_id
                    """,
                    {
                        "sequence_id": enrollment["sequence_id"],
                    },
                )

                print("Sequence completed")

    return {
        "success": True,
        "count": len(enrollments),
    }
#email template ------old-------------
@app.post("/email-template")
async def create_email_template(
    data: EmailTemplateCreate,
    request: Request
):
    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Not authenticated"
        }

    connection = await fetch_one(
        """
        SELECT id
        FROM recruiting_saved.gmail_connections
        WHERE email = :email
        """,
        {
            "email": user["email"]
        }
    )

    if not connection:
        return {
            "success": False,
            "message": "No Gmail connection found"
        }

    await execute(
        """
        INSERT INTO recruiting_saved.email_templates
        (
            gmail_connection_id,
            template_name,
            subject,
            body,
            created_at,
            updated_at
        )
        VALUES
        (
            :gmail_connection_id,
            :template_name,
            :subject,
            :body,
            NOW(),
            NOW()
        )
        """,
        {
            "gmail_connection_id": connection["id"],
            "template_name": data.template_name,
            "subject": data.subject,
            "body": data.body,
        }
    )

    return {
        "success": True
    }
    
    
#load email template 
@app.get("/email-template")
async def get_email_templates(request: Request):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    query = """
    SELECT
        et.id,
        et.template_name,
        et.subject,
        et.body,
        et.created_at

    FROM recruiting_saved.email_templates et

    JOIN recruiting_saved.gmail_connections gc
        ON et.gmail_connection_id = gc.id

    WHERE gc.email = :email

    ORDER BY et.id DESC
    """

    data = await fetch_all(
        query,
        {
            "email": user["email"]
        }
    )

    return {
        "success": True,
        "data": [dict(row) for row in data]
    }
    
#delete template email 
@app.delete("/email-template/{template_id}")
async def delete_email_template(
    template_id: int,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    await execute(
        """
        DELETE FROM recruiting_saved.email_templates
        WHERE id = :template_id
        AND gmail_connection_id IN (
            SELECT id
            FROM recruiting_saved.gmail_connections
            WHERE email = :email
        )
        """,
        {
            "template_id": template_id,
            "email": user["email"]
        }
    )

    return {
        "success": True
    }
    
    
#send email 
@app.post("/gmail/send-test")
async def send_test_email(
    data: SendEmailRequest,
    request: Request
):

    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    connection = await fetch_one(
        """
        SELECT access_token
        FROM recruiting_saved.gmail_connections
        WHERE email = :email
        """,
        {
            "email": user["email"]
        }
    )

    if not connection:
        return {
            "success": False,
            "message": "No Gmail connection found"
        }

    access_token = connection["access_token"]

    message = f"""To: {data.to_email}
Subject: {data.subject}

{data.body}
"""

    encoded_message = base64.urlsafe_b64encode(
        message.encode("utf-8")
    ).decode("utf-8")
    

    gmail_response = requests.post(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json={
            "raw": encoded_message
        }
    )
   


    return {
        "success": gmail_response.status_code == 200,
        "gmail_status": gmail_response.status_code,
        "gmail_response": gmail_response.json()
    }
    

#helper function
async def send_sequence_email(
    connection,
    template,
    candidate_name,
    candidate_email,
):

    access_token = connection["access_token"]

    body = (
        template["body"]
        .replace("{{name}}", candidate_name)
        .replace("{{email}}", candidate_email)
    )

    message = f"""To: {candidate_email}
Subject: {template["subject"]}

{body}
"""

    encoded_message = base64.urlsafe_b64encode(
        message.encode("utf-8")
    ).decode("utf-8")

    def send_request(token):
        return requests.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "raw": encoded_message
            },
        )

    gmail_response = send_request(access_token)

    # Token expired
    if gmail_response.status_code == 401:

        print("Access token expired. Refreshing...")

        refreshed = await refresh_google_token(
            connection["refresh_token"]
        )

        if "access_token" not in refreshed:

            print("Refresh failed:", refreshed)

            return gmail_response

        access_token = refreshed["access_token"]

        # Save new token in DB
        await execute(
            """
            UPDATE recruiting_saved.gmail_connections
            SET
                access_token = :token,
                update_at = NOW()
            WHERE id = :id
            """,
            {
                "token": access_token,
                "id": connection["id"],
            },
        )

        # Retry
        gmail_response = send_request(access_token)

    return gmail_response


#bulk email 
@app.post("/gmail/send-bulk")
async def send_bulk_email(
    data: SendBulkEmailRequest,
    request: Request
):
    user = request.session.get("user")

    if not user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    connection = await fetch_one(
        """
        SELECT id, email, access_token, refresh_token
        FROM recruiting_saved.gmail_connections
        WHERE id = :mailbox_id
        """,
        {
            "mailbox_id": data.mailbox_id
        }
    )

    if not connection:
        return {
            "success": False,
            "message": "No Gmail connection found"
        }

    access_token = connection["access_token"]

    settings = await fetch_one(
        """
        SELECT max_emails_per_day
        FROM recruiting_saved.gmail_mailbox_settings
        WHERE gmail_connection_id = :id
        """,
        {
            "id": data.mailbox_id
        }
    )

    if settings:
        if len(data.candidates) > settings["max_emails_per_day"]:
            return {
                "success": False,
                "message": (
                    f"Daily limit exceeded. "
                    f"Maximum allowed: "
                    f"{settings['max_emails_per_day']}"
                )
            }

    template = await fetch_one(
        """
        SELECT subject, body
        FROM recruiting_saved.email_templates
        WHERE id = :id
        """,
        {
            "id": data.template_id
        }
    )

    if not template:
        return {
            "success": False,
            "message": "Template not found"
        }

    signature = await fetch_one(
        """
        SELECT content
        FROM recruiting_saved.gmail_signatures
        WHERE id = :id
        """,
        {
            "id": data.signature_id
        }
    )

    if not signature:
        return {
            "success": False,
            "message": "Signature not found"
        }

    sent_count = 0
    last_response = None

    for candidate in data.candidates:
        body = template["body"]

        body = body.replace(
            "{{name}}",
            candidate["name"]
        )

        body = body.replace(
            "{{email}}",
            candidate["email"]
        )

        final_body = (
            body
            + "\n\n"
            + signature["content"]
        )

        message = f"""To: {candidate["email"]}
Subject: {template["subject"]}

{final_body}
"""

        encoded_message = base64.urlsafe_b64encode(
            message.encode("utf-8")
        ).decode("utf-8")

        gmail_response = requests.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={
                "raw": encoded_message
            }
        )

        if gmail_response.status_code == 401:
            refreshed = await refresh_google_token(
                connection["refresh_token"]
            )

            if "access_token" not in refreshed:
                return {
                    "success": False,
                    "reauthorize": True,
                    "message": "Google authorization expired"
                }

            access_token = refreshed["access_token"]

            await execute(
                """
                UPDATE recruiting_saved.gmail_connections
                SET access_token = :token
                WHERE id = :id
                """,
                {
                    "token": access_token,
                    "id": data.mailbox_id
                }
            )

            gmail_response = requests.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "raw": encoded_message
                }
            )

        if gmail_response.status_code == 200:
            sent_count += 1

        last_response = gmail_response

    return {
        "success": True,
        "sent": sent_count,
        "gmail_status": (
            last_response.status_code
            if last_response
            else None
        ),
        "gmail_response": (
            last_response.json()
            if last_response
            else None
        )
    }