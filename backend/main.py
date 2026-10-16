from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('models/gemini-3.8-flash')

# Configure PayPal
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"

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

# --- HELPER FUNCTIONS ---
def get_paypal_access_token():
    """Authenticates with PayPal and retrieves a secure session token."""
    url = f"{PAYPAL_BASE_URL}/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    data = {"grant_type": "client_credentials"}
    
    response = requests.post(
        url,
        auth=HTTPBasicAuth(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
        headers=headers,
        data=data
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception(f"PayPal Auth Failed: {response.text}")

# --- API ROUTES ---
@app.get("/")
def read_root():
    return {"message": "The Python Invisible Assistant API is active."}

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    try:
        response = model.generate_content(request.user_prompt)
        return {
            "status": "success", 
            "received_prompt": request.user_prompt, 
            "ai_response": response.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

@app.post("/api/checkout")
def create_checkout(request: CheckoutRequest):
    """Generates a secure PayPal checkout session for the Assistant's cart."""
    try:
        token = get_paypal_access_token()
        url = f"{PAYPAL_BASE_URL}/v2/checkout/orders"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        # Build the exact order payload PayPal requires
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": "USD",
                    "value": str(request.cart_total)
                },
                "description": request.item_name
            }]
        }
        
        response = requests.post(url, headers=headers, json=payload)
        order_data = response.json()
        
        # Extract the URL the user needs to click to approve the payment
        approval_link = next(link["href"] for link in order_data["links"] if link["rel"] == "approve")
        
        return {
            "status": "success", 
            "received_amount": request.cart_total, 
            "payment_link": approval_link,
            "order_id": order_data["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal Error: {str(e)}")