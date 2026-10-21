from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from ai_engine import process_user_errand
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

@app.get("/")
def read_root():
    return {"message": "The Python Invisible Assistant API is active."}

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    try:
        ai_response = process_user_errand(request.user_prompt)
        return {
            "status": "success", 
            "received_prompt": request.user_prompt, 
            "ai_response": ai_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

@app.post("/api/checkout")
def create_checkout(request: CheckoutRequest):
    try:
        payment_info = create_paypal_order(amount=str(request.cart_total))
        return {
            "status": "success", 
            "received_amount": request.cart_total, 
            "payment_link": payment_info["approval_link"],
            "order_id": payment_info["order_data"]["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal Error: {str(e)}")