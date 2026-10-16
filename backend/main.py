from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Gemini API
# This securely pulls the key from your .env file
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('models/gemini-3.8-flash')

app = FastAPI(title="The Invisible Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---

class TaskRequest(BaseModel):
    user_prompt: str

class CheckoutRequest(BaseModel):
    cart_total: float
    item_name: str

# --- API ROUTES ---

@app.get("/")
def read_root():
    return {"message": "The Python Invisible Assistant API is active."}

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    """Receives natural language, sends it to Gemini, and returns the AI's response."""
    try:
        # Send the user's prompt to Gemini
        response = model.generate_content(request.user_prompt)
        
        return {
            "status": "success", 
            "received_prompt": request.user_prompt, 
            "ai_response": response.text
        }
    except Exception as e:
        # Standard professional error handling
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

@app.post("/api/checkout")
def create_checkout(request: CheckoutRequest):
    """Receives cart totals and generates a PayPal checkout link."""
    return {
        "status": "success", 
        "received_amount": request.cart_total, 
        "payment_link": "Pending PayPal Integration"
    }