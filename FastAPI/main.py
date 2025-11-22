from fastapi import FastAPI
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
import httpx
import os

# ==========================
# LOAD ENV VARIABLES
# ==========================
load_dotenv()

IBM_API_KEY = os.getenv("IBM_API_KEY")
BEARER_TOKEN = os.getenv("BEARER_TOKEN")
INSTANCE_URL = os.getenv("INSTANCE_URL")
IBM_IAM_URL = os.getenv("IBM_IAM_URL", "https://iam.cloud.ibm.com/identity/token")

# Validate required items
missing = [k for k, v in {
    "IBM_API_KEY": IBM_API_KEY,
    "BEARER_TOKEN": BEARER_TOKEN,
    "INSTANCE_URL": INSTANCE_URL
}.items() if not v]

if missing:
    print("❌ Missing environment variables:", missing)

# ==========================
# FASTAPI APP
# ==========================
app = FastAPI()


# ==========================
# REQUEST MODEL
# ==========================
class RunRequest(BaseModel):
    message: str
    agent_id: str
    thread_id: str | None = None

    @field_validator("thread_id", mode="before")
    def empty_string_to_none(cls, v):
        return None if v in ("", None) else v


# ==========================
# POST /get-token
# ==========================
@app.post("/get-token")
async def get_token():

    data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": IBM_API_KEY
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(IBM_IAM_URL, data=data, headers=headers)

    if response.status_code != 200:
        return {
            "error": "Failed to retrieve token",
            "status_code": response.status_code,
            "response": response.text
        }

    token = response.json().get("access_token")
    print("Access Token:", token)

    return {"access_token": token}


# ==========================
# GET /orchestrate-agents
# ==========================
@app.get("/orchestrate-agents")
async def get_orchestrate_agents():
    url = f"{INSTANCE_URL}/v1/orchestrate/agents"

    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
    except Exception as e:
        return {"error": f"HTTP error: {str(e)}"}

    try:
        data = response.json()
    except Exception:
        data = response.text

    return {
        "status_code": response.status_code,
        "response": data
    }


# ==========================
# POST /orchestrate-run
# ==========================
@app.post("/orchestrate-run")
async def orchestrate_run(req: RunRequest):

    url = (
        f"{INSTANCE_URL}/v1/orchestrate/runs"
        "?stream=true&stream_timeout=120000&multiple_content=true"
    )

    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "IAM-API_KEY": IBM_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    payload = {
        "message": {
            "role": "user",
            "content": req.message
        },
        "agent_id": req.agent_id,
        "thread_id": req.thread_id   # may be None on first call
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(url, headers=headers, json=payload)
    except Exception as e:
        return {"error": f"Run error: {str(e)}"}

    # handle streaming-style JSON or plain text
    try:
        data = response.json()
    except Exception:
        data = response.text

    return {
        "status_code": response.status_code,
        "response": data
    }
