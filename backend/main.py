from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 1. LOAD ENVIRONMENT VARIABLES
load_dotenv()

# 2. IMPORT MODULES (Gemini is commented out for now to save tokens)
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

class TaskRequest(BaseModel):
    user_prompt: str

class CheckoutRequest(BaseModel):
    cart_total: float
    item_name: str # Added this so PayPal knows what is being bought

# --- MOCK DATA FOR TESTING ---
MOCK_SUPPLIERS = [
    {"id": "sup_01", "name": "QuickFix Plumbing", "rate": 75.00, "time": "Tomorrow at 10:00 AM"},
    {"id": "sup_02", "name": "Pro Handyman Services", "rate": 90.00, "time": "Tomorrow at 2:00 PM"}
]

@app.get("/")
def read_root():
    return {"message": "The Python Invisible Assistant API is active."}

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    """Mocks processing a text errand and returning dynamic options."""
    # TODO for Role B: Replace this mock return with actual Gemini JSON output
    return {
        "status": "success", 
        "received_prompt": request.user_prompt, 
        "ai_response": f"I found a few options to help you with: '{request.user_prompt}'. Which one would you like to book?",
        "options": MOCK_SUPPLIERS
    }

@app.post("/api/voice-task")
async def process_voice_task(audio_file: UploadFile = File(...)):
    """Mocks receiving a voice file, 'transcribing' it, and returning options."""
    # TODO for Role B: Add Whisper/Gemini audio transcription here
    mock_transcription = "I need a plumber for tomorrow."
    
    return {
        "status": "success", 
        "received_audio_filename": audio_file.filename,
        "transcription": mock_transcription,
        "ai_response": f"I heard you say: '{mock_transcription}'. Here are your options:",
        "options": MOCK_SUPPLIERS
    }

@app.post("/api/checkout")
def create_checkout(request: CheckoutRequest):
    """Generates a PayPal link for the specific item chosen by the user."""
    try:
        # Now passing the specific amount from the clicked option
        payment_info = create_paypal_order(amount=str(request.cart_total))
        return {
            "status": "success", 
            "item": request.item_name,
            "received_amount": request.cart_total, 
            "payment_link": payment_info["approval_link"],
            "order_id": payment_info["order_data"]["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal Error: {str(e)}")