from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
# from ai_engine import process_user_errand
from payments import create_paypal_order

app = FastAPI(title="The Invisible Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Add session_id to your data models
class TaskRequest(BaseModel):
    user_prompt: str
    session_id: str

class CheckoutRequest(BaseModel):
    cart_total: float
    item_name: str
    session_id: str

# 2. In-memory dictionary to act as our mock database for active sessions
sessions_db = {}

MOCK_SUPPLIERS = [
    {"id": "sup_01", "name": "QuickFix Plumbing", "rate": 75.00, "time": "Tomorrow at 10:00 AM"},
    {"id": "sup_02", "name": "Pro Handyman Services", "rate": 90.00, "time": "Tomorrow at 2:00 PM"}
]

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    # Register session if it doesn't exist
    if request.session_id not in sessions_db:
        sessions_db[request.session_id] = {"history": []}
    
    # Log the user's prompt into their specific session history
    sessions_db[request.session_id]["history"].append({"role": "user", "content": request.user_prompt})

    return {
        "status": "success", 
        "session_id": request.session_id,
        "ai_response": f"I found a few options to help you with: '{request.user_prompt}'. Which one would you like to book?",
        "options": MOCK_SUPPLIERS
    }

@app.post("/api/voice-task")
async def process_voice_task(
    audio_file: UploadFile = File(...), 
    session_id: str = Form(...) # Form data extraction for session_id
):
    if session_id not in sessions_db:
        sessions_db[session_id] = {"history": []}
        
    mock_transcription = "I need a plumber for tomorrow."
    sessions_db[session_id]["history"].append({"role": "user", "content": mock_transcription})
    
    return {
        "status": "success", 
        "session_id": session_id,
        "transcription": mock_transcription,
        "ai_response": f"I heard you say: '{mock_transcription}'. Here are your options:",
        "options": MOCK_SUPPLIERS
    }

@app.post("/api/checkout")
def create_checkout(request: CheckoutRequest):
    try:
        payment_info = create_paypal_order(amount=str(request.cart_total))
        
        # Log the checkout action to the user's session
        if request.session_id in sessions_db:
            sessions_db[request.session_id]["history"].append({"role": "system", "content": f"Checkout initiated for {request.item_name}"})

        return {
            "status": "success", 
            "item": request.item_name,
            "session_id": request.session_id,
            "received_amount": request.cart_total, 
            "payment_link": payment_info["approval_link"],
            "order_id": payment_info["order_data"]["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal Error: {str(e)}")