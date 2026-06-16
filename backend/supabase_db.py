import databases
import ssl
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

supabase_db = databases.Database(
    SUPABASE_DATABASE_URL,
    min_size=5,
    max_size=20,
    ssl=ssl_context,
    statement_cache_size=0
)

async def fetch_one(query, values=None):
    return await supabase_db.fetch_one(query=query, values=values)

async def fetch_all(query, values=None):
    return await supabase_db.fetch_all(query=query, values=values)

async def execute(query, values=None):
    return await supabase_db.execute(query=query, values=values)