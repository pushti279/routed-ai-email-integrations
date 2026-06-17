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
    execute
)
from pydantic import BaseModel
import base64
import requests



# Load environment variables
load_dotenv()

app = FastAPI()

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
    max_age=86400
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

    print("Connection ID:", connection["id"])

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
    id,
    email,
    google_user_id,
    is_active,
    created_at,
    email as sender_name,
    100 as max_emails_per_day,
    'No signature' as signature
    FROM recruiting_saved.gmail_connections
    WHERE email = :email
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
        gc.id as gmail_connection_id,
        gc.email,

        gms.id,
        gms.sender_name,
        gms.max_emails_per_day,
        gms.signature_name

    FROM recruiting_saved.gmail_connections gc

    JOIN recruiting_saved.gmail_mailbox_settings gms
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


