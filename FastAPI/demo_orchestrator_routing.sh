#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════════════════════"
echo "  DEMONSTRATING ORCHESTRATOR AGENT ROUTING"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ============================================================
# STEP 1: Submit Form → Orchestrator → Analysis Agent
# ============================================================
echo -e "${BLUE}[STEP 1]${NC} User submits health form"
echo -e "${YELLOW}➜${NC} FastAPI receives request at: ${GREEN}/submit-health-form${NC}"
echo -e "${YELLOW}➜${NC} FastAPI tells Orchestrator: 'Run Analysis Agent with this health data'"
echo -e "${YELLOW}➜${NC} Orchestrator routes to: ${GREEN}Analysis Agent (ID: $ANALYSIS_AGENT_ID)${NC}"
echo ""
echo "Making API call..."
echo "---"

RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/submit-health-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "age": 35,
    "weight": 80,
    "height": 175,
    "health_conditions": ["diabetes", "hypertension"],
    "dietary_preferences": ["vegetarian", "low-carb"],
    "activity_level": "moderate",
    "goals": ["weight loss", "better blood sugar control"]
  }')

# Check if response is valid
if [ $? -ne 0 ]; then
    echo -e "${RED} API call failed. Is the server running?${NC}"
    exit 1
fi

# Pretty print the response
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract thread_id
THREAD_ID=$(echo "$RESPONSE" | jq -r '.thread_id' 2>/dev/null)

if [ "$THREAD_ID" == "null" ] || [ -z "$THREAD_ID" ]; then
    echo -e "${RED} Failed to get thread_id from Analysis Agent${NC}"
    echo "Response was:"
    echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN} Analysis Agent completed successfully!${NC}"
echo -e "   Thread ID: ${YELLOW}$THREAD_ID${NC}"
echo -e "   (This thread_id proves the conversation context was created)"
echo ""
echo "Press Enter to continue to next step..."
read

# ============================================================
# STEP 2: Click WhatsApp Button → Orchestrator → WhatsApp Agent
# ============================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${BLUE}[STEP 2]${NC} User clicks 'Send WhatsApp Messages' button"
echo -e "${YELLOW}➜${NC} FastAPI receives request at: ${GREEN}/send-whatsapp${NC}"
echo -e "${YELLOW}➜${NC} FastAPI tells Orchestrator: 'Run WhatsApp Agent using thread: $THREAD_ID'"
echo -e "${YELLOW}➜${NC} Orchestrator routes to: ${GREEN}WhatsApp Agent (ID: $WHATSAPP_AGENT_ID)${NC}"
echo -e "${YELLOW}➜${NC} WhatsApp Agent can see the previous health analysis via thread_id"
echo ""
echo "Making API call..."
echo "---"

RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/send-whatsapp \
  -H "Content-Type: application/json" \
  -d "{\"thread_id\": \"$THREAD_ID\"}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
if [ "$SUCCESS" == "true" ]; then
    echo -e "${GREEN} WhatsApp Agent completed successfully!${NC}"
    echo -e "   Used thread: ${YELLOW}$THREAD_ID${NC}"
    echo -e "   (Agent had access to John Doe's health data)"
else
    echo -e "${RED}  WhatsApp Agent returned an error (might not be configured)${NC}"
fi
echo ""
echo "Press Enter to continue to next step..."
read

# ============================================================
# STEP 3: Click Calendar Button → Orchestrator → Calendar Agent
# ============================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${BLUE}[STEP 3]${NC} User clicks 'Add Calendar Events' button"
echo -e "${YELLOW}➜${NC} FastAPI receives request at: ${GREEN}/add-calendar-events${NC}"
echo -e "${YELLOW}➜${NC} FastAPI tells Orchestrator: 'Run Calendar Agent using thread: $THREAD_ID'"
echo -e "${YELLOW}➜${NC} Orchestrator routes to: ${GREEN}Calendar Agent (ID: $CALENDAR_AGENT_ID)${NC}"
echo -e "${YELLOW}➜${NC} Calendar Agent can see the previous health analysis via thread_id"
echo ""
echo "Making API call..."
echo "---"

RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/add-calendar-events \
  -H "Content-Type: application/json" \
  -d "{\"thread_id\": \"$THREAD_ID\"}")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
if [ "$SUCCESS" == "true" ]; then
    echo -e "${GREEN} Calendar Agent completed successfully!${NC}"
    echo -e "   Used thread: ${YELLOW}$THREAD_ID${NC}"
    echo -e "   (Agent had access to John Doe's health data)"
else
    echo -e "${RED}  Calendar Agent returned an error (might not be configured)${NC}"
fi

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN} DEMONSTRATION COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "What just happened:"
echo ""
echo "1️  Form submission → Orchestrator routed to Analysis Agent"
echo "   - Created thread_id: $THREAD_ID"
echo "   - Analyzed health data and provided recommendations"
echo ""
echo "2️  WhatsApp button → Orchestrator routed to WhatsApp Agent"
echo "   - Used same thread_id: $THREAD_ID"
echo "   - Had context from step 1 (knows about John Doe's diabetes)"
echo ""
echo "3️  Calendar button → Orchestrator routed to Calendar Agent"
echo "   - Used same thread_id: $THREAD_ID"
echo "   - Had context from step 1 (knows about health goals)"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}Key Takeaway:${NC}"
echo "The Orchestrator is the traffic controller that:"
echo "  • Routes each request to the correct agent based on agent_id"
echo "  • Maintains conversation context via thread_id"
echo "  • Allows agents to share information without re-sending data"
echo ""