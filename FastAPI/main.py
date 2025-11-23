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
RECOMMENDATION_AGENT_ID = os.getenv("RECOMMENDATION_AGENT_ID")
APPOINTMENT_AUTOMATION_ID = os.getenv("APPOINTMENT_AUTOMATION_ID")
ALERT_AGENT_ID = os.getenv("ALERT_AGENT_ID")
HEALTH_ASSISTANT_AGENT_ID = os.getenv("HEALTH_ASSISTANT_AGENT_ID")
WORK_AGENT_ID = os.getenv("WORK_AGENT_ID")
BODYHEALTHAGENT_ID = os.getenv("BODYHEALTHAGENT_ID")
POSTURE_AGENT_ID = os.getenv("POSTURE_AGENT_ID")
SLEEPAGENT_ID = os.getenv("SLEEPAGENT_ID")
EXERCISEAGENT_ID = os.getenv("EXERCISEAGENT_ID")
DIETAGENT_ID = os.getenv("DIETAGENT_ID")
HEALTHYDIET_ID = os.getenv("HEALTHYDIET_ID")
PA_ALLOCATION_AGENT_ID = os.getenv("PA_ALLOCATION_AGENT_ID")
PA_MANAGER_ID = os.getenv("PA_MANAGER_ID")
ASKORCHESTRATE_ID = os.getenv("ASKORCHESTRATE_ID")


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
    print(" Missing environment variables:", missing)
    print(" Application may not work correctly!")

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
            print(" Generating new bearer token...")
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
                
                print(f" Token generated, expires at {self.expires_at}")
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

# 1. ANALYSIS AGENT
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
        print(" Warning: Could not extract thread_id from response")
    
    return {
        "success": True,
        "thread_id": thread_id,
        "run_id": result.get("run_id"),
        "analysis": result.get("content"),
        "message": "Health analysis completed successfully",
        "raw_response": result.get("raw_response")
    }

# 2. WHATSAPP AGENT
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
        thread_id=req.thread_id
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

# 3. CALENDAR AGENT
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

# =========================
# Recommendation Agent
# =========================
@app.post("/run-recommendation-agent")
async def run_recommendation_agent(req: ThreadRequest):
    if not RECOMMENDATION_AGENT_ID:
        raise HTTPException(status_code=500, detail="RECOMMENDATION_AGENT_ID not configured.")
    
    message = """
Based on the user's health data and previous analysis, generate personalized recommendations for:
1. Diet adjustments
2. Exercise routines
3. Sleep and wellness tips
4. Preventive health actions
Format recommendations clearly and friendly.
"""
    result = await run_orchestrator_agent(message=message, agent_id=RECOMMENDATION_AGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Recommendation agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Appointment Automation Agent
# =========================
@app.post("/run-appointment-automation-agent")
async def run_appointment_automation_agent(req: ThreadRequest):
    if not APPOINTMENT_AUTOMATION_ID:
        raise HTTPException(status_code=500, detail="APPOINTMENT_AUTOMATION_ID not configured.")
    
    message = """
Automate scheduling appointments for the user based on their health plan:
1. Doctor visits
2. Therapy sessions
3. Lab tests
4. Reminders for appointments
Use available calendar info and optimize schedule.
"""
    result = await run_orchestrator_agent(message=message, agent_id=APPOINTMENT_AUTOMATION_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Appointment automation agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Alert Agent
# =========================
@app.post("/run-alert-agent")
async def run_alert_agent(req: ThreadRequest):
    if not ALERT_AGENT_ID:
        raise HTTPException(status_code=500, detail="ALERT_AGENT_ID not configured.")
    
    message = """
Monitor user health data and generate alerts for:
1. Abnormal readings
2. Missed medication
3. Urgent health conditions
Format alerts clearly and concisely.
"""
    result = await run_orchestrator_agent(message=message, agent_id=ALERT_AGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Alert agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Health Assistant Agent
# =========================
@app.post("/run-health-assistant-agent")
async def run_health_assistant_agent(req: ThreadRequest):
    if not HEALTH_ASSISTANT_AGENT_ID:
        raise HTTPException(status_code=500, detail="HEALTH_ASSISTANT_AGENT_ID not configured.")
    
    message = """
Assist the user in daily health tasks:
1. Provide health tips
2. Answer health questions
3. Give reminders for diet, exercise, and sleep
Format responses in a friendly, encouraging tone.
"""
    result = await run_orchestrator_agent(message=message, agent_id=HEALTH_ASSISTANT_AGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Health assistant agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Work Agent
# =========================
@app.post("/run-work-agent")
async def run_work_agent(req: ThreadRequest):
    if not WORK_AGENT_ID:
        raise HTTPException(status_code=500, detail="WORK_AGENT_ID not configured.")
    
    message = """
Manage user's work-health balance:
1. Suggest optimal break times
2. Recommend desk exercises
3. Provide reminders for posture and hydration
"""
    result = await run_orchestrator_agent(message=message, agent_id=WORK_AGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Work agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# BodyHealth Agent
# =========================
@app.post("/run-bodyhealth-agent")
async def run_bodyhealth_agent(req: ThreadRequest):
    if not BODYHEALTHAGENT_ID:
        raise HTTPException(status_code=500, detail="BODYHEALTHAGENT_ID not configured.")
    
    message = """
Provide insights on body health metrics:
1. Analyze posture, BMI, weight
2. Suggest corrective exercises
3. Track improvements
"""
    result = await run_orchestrator_agent(message=message, agent_id=BODYHEALTHAGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"BodyHealth agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Posture Agent
# =========================
@app.post("/run-posture-agent")
async def run_posture_agent(req: ThreadRequest):
    if not POSTURE_AGENT_ID:
        raise HTTPException(status_code=500, detail="POSTURE_AGENT_ID not configured.")
    
    message = """
Monitor and correct user's posture:
1. Provide posture exercises
2. Give reminders for sitting/standing correctly
3. Track posture improvements
"""
    result = await run_orchestrator_agent(message=message, agent_id=POSTURE_AGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Posture agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Sleep Agent
# =========================
@app.post("/run-sleep-agent")
async def run_sleep_agent(req: ThreadRequest):
    if not SLEEPAGENT_ID:
        raise HTTPException(status_code=500, detail="SLEEPAGENT_ID not configured.")
    
    message = """
Analyze user's sleep patterns and give recommendations:
1. Ideal sleep schedule
2. Tips to improve sleep quality
3. Track sleep progress
"""
    result = await run_orchestrator_agent(message=message, agent_id=SLEEPAGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Sleep agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Exercise Agent
# =========================
@app.post("/run-exercise-agent")
async def run_exercise_agent(req: ThreadRequest):
    if not EXERCISEAGENT_ID:
        raise HTTPException(status_code=500, detail="EXERCISEAGENT_ID not configured.")
    
    message = """
Generate personalized exercise plans for the user:
1. Daily workouts
2. Targeted muscle groups
3. Adjust intensity based on user profile
"""
    result = await run_orchestrator_agent(message=message, agent_id=EXERCISEAGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Exercise agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Diet Agent
# =========================
@app.post("/run-diet-agent")
async def run_diet_agent(req: ThreadRequest):
    if not DIETAGENT_ID:
        raise HTTPException(status_code=500, detail="DIETAGENT_ID not configured.")
    
    message = """
Create a personalized diet plan for the user:
1. Daily meals
2. Snacks
3. Nutritional targets
4. Adjust based on user's health data
"""
    result = await run_orchestrator_agent(message=message, agent_id=DIETAGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Diet agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Healthy Diet Agent
# =========================
@app.post("/run-healthy-diet-agent")
async def run_healthy_diet_agent(req: ThreadRequest):
    if not HEALTHYDIET_ID:
        raise HTTPException(status_code=500, detail="HEALTHYDIET_ID not configured.")
    
    message = """
Generate a healthy diet plan considering user's preferences and restrictions:
1. Balanced meals
2. Vitamins and minerals
3. Avoid allergens
"""
    result = await run_orchestrator_agent(message=message, agent_id=HEALTHYDIET_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Healthy diet agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# PA Allocation Agent
# =========================
@app.post("/run-pa-allocation-agent")
async def run_pa_allocation_agent(req: ThreadRequest):
    if not PA_ALLOCATION_AGENT_ID:
        raise HTTPException(status_code=500, detail="PA_ALLOCATION_AGENT_ID not configured.")
    
    message = """
Allocate health assistants (PA) to users based on their needs and availability:
1. Match users to the best suited PA
2. Ensure workload balance
3. Track allocations
"""
    result = await run_orchestrator_agent(message=message, agent_id=PA_ALLOCATION_AGENT_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"PA allocation agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# PA Manager Agent
# =========================
@app.post("/run-pa-manager-agent")
async def run_pa_manager_agent(req: ThreadRequest):
    if not PA_MANAGER_ID:
        raise HTTPException(status_code=500, detail="PA_MANAGER_ID not configured.")
    
    message = """
Manage personal assistants:
1. Monitor performance
2. Handle task delegation
3. Optimize PA assignments
"""
    result = await run_orchestrator_agent(message=message, agent_id=PA_MANAGER_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"PA manager agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

# =========================
# Ask Orchestrate Agent
# =========================
@app.post("/run-ask-orchestrate-agent")
async def run_ask_orchestrate_agent(req: ThreadRequest):
    if not ASKORCHESTRATE_ID:
        raise HTTPException(status_code=500, detail="ASKORCHESTRATE_ID not configured.")
    
    message = """
Answer general queries using orchestration:
1. Provide health advice
2. Handle user questions
3. Direct questions to appropriate agents if needed
"""
    result = await run_orchestrator_agent(message=message, agent_id=ASKORCHESTRATE_ID, thread_id=req.thread_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Ask Orchestrate agent failed: {result.get('error')}")
    return {"success": True, "response": result.get("raw_response"), "thread_id": result.get("thread_id")}

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
                "1_submit_form": "POST /submit-health-form"
            },
            "run_agents": {
                "ask_orchestrate": "POST /run-ask-orchestrate-agent",
                "pa_manager": "POST /run-pa-manager-agent",
                "pa_allocation": "POST /run-pa-allocation-agent",
                "healthy_diet": "POST /run-healthy-diet-agent",
                "diet": "POST /run-diet-agent",
                "exercise": "POST /run-exercise-agent",
                "sleep": "POST /run-sleep-agent",
                "posture": "POST /run-posture-agent",
                "bodyhealth": "POST /run-bodyhealth-agent",
                "work": "POST /run-work-agent",
                "health_assistant": "POST /run-health-assistant-agent",
                "alert": "POST /run-alert-agent",
                "appointment_automation": "POST /run-appointment-automation-agent",
                "recommendation": "POST /run-recommendation-agent",
                "whatsapp": "POST /send-whatsapp",
                "calendar_events": "POST /add-calendar-events",
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
            "calendar": CALENDAR_AGENT_ID is not None,
            "recommendation": RECOMMENDATION_AGENT_ID is not None,
            "appointment_automation": APPOINTMENT_AUTOMATION_ID is not None,
            "alert": ALERT_AGENT_ID is not None,
            "health_assistant": HEALTH_ASSISTANT_AGENT_ID is not None,
            "bodyhealth": BODYHEALTHAGENT_ID is not None,
            "posture": POSTURE_AGENT_ID is not None,
            "sleep": SLEEPAGENT_ID is not None,
            "exercise": EXERCISEAGENT_ID is not None,
            "diet": DIETAGENT_ID is not None,
            "healthy_diet": HEALTHYDIET_ID is not None,
            "pa_allocation": PA_ALLOCATION_AGENT_ID is not None,
            "pa_manager": PA_MANAGER_ID is not None,
            "ask_orchestrate": ASKORCHESTRATE_ID is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)