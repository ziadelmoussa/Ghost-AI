import os
import json
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()
# from ai_engine import process_user_errand
from payments import create_paypal_order

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="The Invisible Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Frontend Requests ---
class TaskRequest(BaseModel):
    user_prompt: str
    session_id: str

class CheckoutRequest(BaseModel):
    cart_total: float
    item_name: str
    session_id: str

# --- Pydantic Models for Gemini Structured Output ---
class TaskOption(BaseModel):
    id: int = Field(description="A unique integer ID for this option (e.g., 1, 2, 3)")
    name: str = Field(description="Name of the service provider, store, or option.")
    rate: float = Field(description="Estimated cost in USD as a number.")
    time: str = Field(description="Estimated timeframe, e.g., 'Tomorrow at 10 AM' or '2-3 days'.")

class AIResponseSchema(BaseModel):
    ai_response: str = Field(description="The conversational text response to the user.")
    options: list[TaskOption] = Field(description="Up to 3 selectable options for the user to purchase or book.")

class VoiceAIResponseSchema(BaseModel):
    transcription: str = Field(description="The exact text transcription of the user's spoken audio.")
    ai_response: str = Field(description="The conversational text response to the user.")
    options: list[TaskOption] = Field(description="Up to 3 selectable options for the user to purchase or book.")

# In-memory dictionary to act as our mock database for active sessions
sessions_db = {}


@app.post("/api/process-task")
def process_task(request: TaskRequest):
    # Register session if it doesn't exist
    if request.session_id not in sessions_db:
        sessions_db[request.session_id] = {"history": []}
    
    # Log the user's prompt into their specific session history
    sessions_db[request.session_id]["history"].append({"role": "user", "content": request.user_prompt})

    try:
        # Initialize Gemini Model with System Instructions
        model = genai.GenerativeModel(
            model_name="gemini-3.8-flash",
            system_instruction=(
                "You are 'The Invisible Assistant', an ultra-efficient, autonomous AI concierge. "
                "The user will give you an errand (e.g., 'book a plumber', 'order groceries'). "
                "Analyze the request, generate a brief, professional confirmation, and provide 2 to 3 realistic options "
                "that fulfill their request with estimated prices and timeframes."
            )
        )

        # Call Gemini and enforce the JSON schema
        response = model.generate_content(
            request.user_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AIResponseSchema,
                temperature=0.4 # Lower temperature for more factual, structured outputs
            )
        )

        # Parse the JSON string returned by Gemini into a Python dictionary
        ai_data = json.loads(response.text)

        # Log AI response to history
        sessions_db[request.session_id]["history"].append({"role": "ai", "content": ai_data["ai_response"]})

        return {
            "status": "success", 
            "session_id": request.session_id,
            "ai_response": ai_data["ai_response"],
            "options": ai_data["options"]
        }

    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process task via AI.")


@app.post("/api/voice-task")
async def process_voice_task(
    audio_file: UploadFile = File(...), 
    session_id: str = Form(...) 
):
    try:
        # 1. Read the audio bytes directly into memory (No temp files needed!)
        audio_bytes = await audio_file.read()

        # 2. Package the raw audio inline for Gemini
        audio_part = {
            "mime_type": "audio/webm",
            "data": audio_bytes
        }

        # 3. Set up the model
        model = genai.GenerativeModel(
            model_name="gemini-3.8-flash",
            system_instruction=(
                "You are 'The Invisible Assistant', an autonomous AI concierge. "
                "The user is speaking an errand to you. "
                "First, transcribe their audio accurately. "
                "Second, analyze the request, generate a brief, professional confirmation, "
                "and provide 2 to 3 realistic options that fulfill their request with estimated prices and timeframes."
            )
        )

        # 4. Pass the inline audio directly to the prompt
        response = model.generate_content(
            [audio_part, "Transcribe this audio and process the errand."],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=VoiceAIResponseSchema,
                temperature=0.4
            )
        )

        # 5. Parse and return the real data to the React UI
        ai_data = json.loads(response.text)

        if session_id not in sessions_db:
            sessions_db[session_id] = {"history": []}
            
        sessions_db[session_id]["history"].append({"role": "user", "content": f"🎤 {ai_data['transcription']}"})
        sessions_db[session_id]["history"].append({"role": "ai", "content": ai_data['ai_response']})

        return {
            "status": "success", 
            "session_id": session_id,
            "transcription": ai_data["transcription"],
            "ai_response": ai_data["ai_response"],
            "options": ai_data["options"]
        }

    except Exception as e:
        print(f"Voice Processing Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice task.")


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