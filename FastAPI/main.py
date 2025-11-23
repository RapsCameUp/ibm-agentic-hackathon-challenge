from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime, timedelta
import httpx
import os
import json
import asyncio

# ==========================
# LOAD ENV VARIABLES
# ==========================
load_dotenv()

IBM_API_KEY = os.getenv("IBM_API_KEY")
INSTANCE_URL = os.getenv("INSTANCE_URL")
IBM_IAM_URL = os.getenv("IBM_IAM_URL", "https://iam.cloud.ibm.com/identity/token")
ANALYSIS_AGENT_ID = os.getenv("ANALYSIS_AGENT_ID")
WHATSAPP_AGENT_ID = os.getenv("WHATSAPP_AGENT_ID")
CALENDAR_AGENT_ID = os.getenv("CALENDAR_AGENT_ID")

# Validate required items
missing = []
for k, v in {
    "IBM_API_KEY": IBM_API_KEY,
    "INSTANCE_URL": INSTANCE_URL,
    "ANALYSIS_AGENT_ID": ANALYSIS_AGENT_ID
}.items():
    if not v:
        missing.append(k)

if missing:
    print("⚠️ Missing environment variables:", missing)
    print("⚠️ Application may not work correctly!")

# ==========================
# TOKEN MANAGEMENT
# ==========================
class TokenManager:
    def __init__(self):
        self.token: Optional[str] = None
        self.expires_at: Optional[datetime] = None
        self.lock = asyncio.Lock()
    
    async def get_token(self) -> str:
        """Get valid bearer token, refresh if needed"""
        async with self.lock:
            # Check if we have a valid token
            if self.token and self.expires_at and datetime.now() < self.expires_at:
                return self.token
            
            # Generate new token
            print("🔄 Generating new bearer token...")
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
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to get token: {response.text}"
                    )
                
                token_data = response.json()
                self.token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)  # Default 1 hour
                
                # Set expiry 5 minutes before actual expiry for safety
                self.expires_at = datetime.now() + timedelta(seconds=expires_in - 300)
                
                print(f"✅ Token generated, expires at {self.expires_at}")
                return self.token

# Global token manager
token_manager = TokenManager()

# ==========================
# FASTAPI APP
# ==========================
app = FastAPI(title="Multi-Agent Health Orchestrator API")

# ==========================
# HELPER FUNCTIONS
# ==========================
def extract_thread_id(response_text: str) -> Optional[str]:
    """Extract thread_id from streaming response"""
    lines = response_text.strip().split('\n')
    for line in lines:
        try:
            data = json.loads(line)
            if 'data' in data and 'thread_id' in data['data']:
                return data['data']['thread_id']
        except:
            continue
    return None

def extract_run_id(response_text: str) -> Optional[str]:
    """Extract run_id from streaming response"""
    lines = response_text.strip().split('\n')
    for line in lines:
        try:
            data = json.loads(line)
            if 'data' in data and 'run_id' in data['data']:
                return data['data']['run_id']
        except:
            continue
    return None

def extract_content(response_text: str) -> str:
    """Extract actual message content from streaming response"""
    content_parts = []
    lines = response_text.strip().split('\n')
    
    for line in lines:
        try:
            data = json.loads(line)
            
            # Look for message.delta events with content
            if data.get('event') == 'message.delta':
                if 'data' in data:
                    content = (
                        data['data'].get('content') or
                        data['data'].get('delta', {}).get('content') or
                        data['data'].get('text', '')
                    )
                    if content:
                        content_parts.append(str(content))
            
            # Also check for message.completed events
            elif data.get('event') == 'message.completed':
                if 'data' in data and 'content' in data['data']:
                    return data['data']['content']
        except:
            continue
    
    return ''.join(content_parts) if content_parts else response_text

async def run_orchestrator_agent(
    message: str,
    agent_id: str,
    thread_id: Optional[str] = None
) -> dict:
    """Generic function to run any agent through orchestrator"""
    
    # Get valid bearer token
    bearer_token = await token_manager.get_token()
    
    url = (
        f"{INSTANCE_URL}/v1/orchestrate/runs"
        "?stream=true&stream_timeout=120000&multiple_content=true"
    )
    
    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "IAM-API_KEY": IBM_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    payload = {
        "message": {
            "role": "user",
            "content": message
        },
        "agent_id": agent_id,
        "thread_id": thread_id
    }
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(url, headers=headers, json=payload)
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "response": response.text
                }
            
            response_text = response.text
            
            return {
                "success": True,
                "status_code": response.status_code,
                "thread_id": extract_thread_id(response_text),
                "run_id": extract_run_id(response_text),
                "content": extract_content(response_text),
                "raw_response": response_text
            }
    
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception: {str(e)}"
        }

# ==========================
# REQUEST MODELS
# ==========================
class HealthFormData(BaseModel):
    name: str
    age: int
    weight: float  # kg
    height: float  # cm
    health_conditions: List[str] = []
    dietary_preferences: List[str] = []
    activity_level: str  # sedentary, light, moderate, active, very_active
    goals: List[str] = []

class ThreadRequest(BaseModel):
    thread_id: str

class RunRequest(BaseModel):
    message: str
    agent_id: str
    thread_id: Optional[str] = None
    
    @field_validator("thread_id", mode="before")
    def empty_string_to_none(cls, v):
        return None if v in ("", None) else v

# ==========================
# POST /get-token
# ==========================
@app.post("/get-token")
async def get_token():
    """Manually generate a new token (for testing)"""
    try:
        token = await token_manager.get_token()
        return {
            "access_token": token,
            "expires_at": token_manager.expires_at.isoformat() if token_manager.expires_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================
# GET /orchestrate-agents
# ==========================
@app.get("/orchestrate-agents")
async def get_orchestrate_agents():
    """List all available orchestrate agents"""
    bearer_token = await token_manager.get_token()
    
    url = f"{INSTANCE_URL}/v1/orchestrate/agents"
    headers = {
        "Authorization": f"Bearer {bearer_token}",
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

@app.post("/orchestrate-run")
async def orchestrate_run(req: RunRequest):
    """Run any agent manually (generic endpoint)"""
    result = await run_orchestrator_agent(
        message=req.message,
        agent_id=req.agent_id,
        thread_id=req.thread_id
    )
    return result

# ==========================
# WORKFLOW-SPECIFIC ENDPOINTS
# ==========================
@app.post("/submit-health-form")
async def submit_health_form(form: HealthFormData):
    """
    Step 1: User submits health form
    - Runs the Analysis Agent
    - Returns thread_id for subsequent calls
    """
    if not ANALYSIS_AGENT_ID:
        raise HTTPException(
            status_code=500,
            detail="ANALYSIS_AGENT_ID not configured in environment"
        )
    
    # Create detailed message for analysis agent
    message = f"""
Please analyze the following health profile and provide:
1. A personalized diet plan based on their conditions and preferences
2. Health and lifestyle recommendations
3. Suggested calendar events (workout times, meal reminders, medication schedules)

Health Profile:
- Name: {form.name}
- Age: {form.age} years
- Weight: {form.weight} kg
- Height: {form.height} cm
- BMI: {round(form.weight / ((form.height/100) ** 2), 1)}
- Health Conditions: {', '.join(form.health_conditions) if form.health_conditions else 'None reported'}
- Dietary Preferences: {', '.join(form.dietary_preferences) if form.dietary_preferences else 'No restrictions'}
- Activity Level: {form.activity_level}
- Health Goals: {', '.join(form.goals) if form.goals else 'General health improvement'}

Please provide a comprehensive analysis with actionable recommendations.
"""
    
    result = await run_orchestrator_agent(
        message=message,
        agent_id=ANALYSIS_AGENT_ID,
        thread_id=None  # First call, no thread yet
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Analysis agent failed: {result.get('error')}"
        )
    
    thread_id = result.get("thread_id")
    if not thread_id:
        print("⚠️ Warning: Could not extract thread_id from response")
    
    return {
        "success": True,
        "thread_id": thread_id,
        "run_id": result.get("run_id"),
        "analysis": result.get("content"),
        "message": "Health analysis completed successfully",
        "raw_response": result.get("raw_response")  # For debugging
    }

@app.post("/send-whatsapp")
async def send_whatsapp_messages(req: ThreadRequest):
    """
    Step 2: Send WhatsApp messages
    - Uses thread_id from health form submission
    - WhatsApp agent has context of the health analysis
    """
    if not WHATSAPP_AGENT_ID:
        raise HTTPException(
            status_code=500,
            detail="WHATSAPP_AGENT_ID not configured. Please add it to .env file"
        )
    
    message = """
Based on the health analysis we just completed, please send WhatsApp messages to the user with:
1. A summary of their personalized diet plan
2. Daily health reminders
3. Motivational messages for their health goals
4. Medication reminders if applicable

Format the messages in a friendly, encouraging tone.
"""
    
    result = await run_orchestrator_agent(
        message=message,
        agent_id=WHATSAPP_AGENT_ID,
        thread_id=req.thread_id  # Use existing thread for context
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"WhatsApp agent failed: {result.get('error')}"
        )
    
    return {
        "success": True,
        "message": "WhatsApp messages sent successfully",
        "content": result.get("content"),
        "thread_id": result.get("thread_id")
    }

@app.post("/add-calendar-events")
async def add_calendar_events(req: ThreadRequest):
    """
    Step 3: Add calendar events
    - Uses thread_id from health form submission
    - Calendar agent has context of the health analysis
    """
    if not CALENDAR_AGENT_ID:
        raise HTTPException(
            status_code=500,
            detail="CALENDAR_AGENT_ID not configured. Please add it to .env file"
        )
    
    message = """
Based on the health recommendations from the analysis, please add the following calendar events:
1. Workout/exercise reminders based on their activity level
2. Meal time reminders aligned with their diet plan
3. Medication reminders if they have health conditions
4. Health checkup reminders
5. Sleep schedule reminders

Create recurring events where appropriate and set reasonable times.
"""
    
    result = await run_orchestrator_agent(
        message=message,
        agent_id=CALENDAR_AGENT_ID,
        thread_id=req.thread_id  # Use existing thread for context
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Calendar agent failed: {result.get('error')}"
        )
    
    return {
        "success": True,
        "message": "Calendar events added successfully",
        "content": result.get("content"),
        "thread_id": result.get("thread_id")
    }

# ==========================
# INFO ENDPOINT
# ==========================
@app.get("/")
async def root():
    """API information and health check"""
    return {
        "name": "Multi-Agent Health Orchestrator API",
        "version": "1.0.0",
        "status": "running",
        "token_status": {
            "has_token": token_manager.token is not None,
            "expires_at": token_manager.expires_at.isoformat() if token_manager.expires_at else None
        },
        "endpoints": {
            "health_workflow": {
                "1_submit_form": "POST /submit-health-form",
                "2_send_whatsapp": "POST /send-whatsapp",
                "3_add_calendar": "POST /add-calendar-events"
            },
            "utilities": {
                "get_token": "POST /get-token",
                "list_agents": "GET /orchestrate-agents",
                "run_agent": "POST /orchestrate-run"
            }
        },
        "configured_agents": {
            "analysis": ANALYSIS_AGENT_ID is not None,
            "whatsapp": WHATSAPP_AGENT_ID is not None,
            "calendar": CALENDAR_AGENT_ID is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)