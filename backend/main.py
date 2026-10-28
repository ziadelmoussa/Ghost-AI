import os
import json
import asyncio
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse 

load_dotenv()
from payments import create_paypal_order

app = FastAPI(title="The Invisible Assistant API (Stateful Demo Engine)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class TaskRequest(BaseModel):
    user_prompt: str
    session_id: str

class CheckoutRequest(BaseModel):
    cart_total: float
    item_name: str
    session_id: str

# In-memory session and payment storage
sessions_db = {}
payment_statuses = {}

# --- HELPER PARSERS ---
def clean_city_string(city_str: str) -> str:
    """Strips out temporal and filler words from city names."""
    return re.sub(
        r'\s+(for|next|this|on|tomorrow|weekend|today|next week|next month|cheap|flights|flight|ticket).*$', 
        '', 
        city_str, 
        flags=re.IGNORECASE
    ).strip()

def get_or_create_session(session_id: str) -> dict:
    if session_id not in sessions_db:
        sessions_db[session_id] = {
            "history": [],
            "active_scenario": None, # 'grocery', 'flight', 'plumber', 'bill'
            "grocery_items": ["Almarai Milk", "Eggs", "Bread", "Arabic Coffee"],
            "grocery_total": 28.50,
            "flight_origin": "Dammam",
            "flight_destination": "New York"
        }
    return sessions_db[session_id]

# --- STATEFUL SCENARIO ENGINE ---
def process_stateful_prompt(prompt: str, session: dict) -> dict:
    prompt_raw = prompt.strip()
    prompt_lower = prompt_raw.lower()
    clean_alpha = re.sub(r'[^a-zA-Z0-9\s]', '', prompt_lower).strip()

    # -------------------------------------------------------------
    # 0. NOISE & SHORT INPUT CHECK
    # -------------------------------------------------------------
    if len(clean_alpha) < 2 and clean_alpha not in ["hi"]:
        return {
            "ai_response": "I didn't quite catch that. Could you please specify how I can assist with your errand?",
            "options": []
        }

    # -------------------------------------------------------------
    # 1. GREETINGS & IDENTITY
    # -------------------------------------------------------------
    if any(k in prompt_lower for k in ["your name", "who are you", "what is your name", "whats your name"]):
        return {
            "ai_response": "My name is Ghost. I am your autonomous AI proxy designed to handle real-world errands, bookings, and payments directly.",
            "options": []
        }

    greetings = ["hi", "hello", "hey", "good morning", "good evening"]
    if any(clean_alpha == g or clean_alpha.startswith(g + " ") for g in greetings):
        return {
            "ai_response": "Hello Ziad! I'm ready to assist. What errand or task would you like me to handle for you today?",
            "options": []
        }

    if any(k in prompt_lower for k in ["thanks", "thank you", "great", "awesome", "perfect"]):
        return {
            "ai_response": "You're very welcome, Ziad! Let me know whenever you need me to take care of another errand.",
            "options": []
        }

    # -------------------------------------------------------------
    # SCENARIO 1: GROCERIES (Handles initial order & adding items)
    # -------------------------------------------------------------
    grocery_triggers = ["grocery", "groceries", "order", "food", "milk", "bread", "pantry", "basket", "add to the list", "add to list", "add cheese", "chocolate"]
    is_grocery_action = any(k in prompt_lower for k in grocery_triggers) or (session["active_scenario"] == "grocery" and any(k in prompt_lower for k in ["add", "item", "more", "also", "include", "cheese", "chocolate"]))

    if is_grocery_action:
        session["active_scenario"] = "grocery"

        # Check if user is trying to add new items to the basket
        if any(k in prompt_lower for k in ["add", "include", "put", "also"]):
            new_additions = []
            if "cheese" in prompt_lower and "Cheddar Cheese" not in session["grocery_items"]:
                session["grocery_items"].append("Cheddar Cheese")
                session["grocery_total"] += 3.50
                new_additions.append("Cheddar Cheese ($3.50)")
            if any(c in prompt_lower for c in ["choclate", "chocolate"]) and "Dark Chocolate" not in session["grocery_items"]:
                session["grocery_items"].append("Dark Chocolate")
                session["grocery_total"] += 2.50
                new_additions.append("Dark Chocolate ($2.50)")

            items_str = ", ".join(session["grocery_items"])
            added_text = f" Added {', '.join(new_additions)}." if new_additions else ""

            return {
                "ai_response": f"Updated your grocery basket.{added_text} Current list: {items_str}.",
                "options": [
                    {
                        "id": 1,
                        "name": f"GreenThumb Express Basket ({len(session['grocery_items'])} Items)",
                        "rate": round(session["grocery_total"], 2),
                        "time": "Delivery in 30 mins"
                    },
                    {
                        "id": 2,
                        "name": f"Panda Supermarket Direct ({len(session['grocery_items'])} Items)",
                        "rate": round(session["grocery_total"] - 2.50, 2),
                        "time": "Delivery in 55 mins"
                    }
                ]
            }
        else:
            items_str = ", ".join(session["grocery_items"])
            return {
                "ai_response": f"I've compiled your weekly grocery basket ({items_str}). Here are the delivery options.",
                "options": [
                    {
                        "id": 1,
                        "name": "GreenThumb Express Delivery",
                        "rate": round(session["grocery_total"], 2),
                        "time": "Delivery in 35 mins"
                    },
                    {
                        "id": 2,
                        "name": "Panda Supermarket Direct",
                        "rate": round(session["grocery_total"] - 2.50, 2),
                        "time": "Delivery in 60 mins"
                    }
                ]
            }

    # -------------------------------------------------------------
    # SCENARIO 2: FLIGHTS & TRAVEL (Origin/Destination Parsing & Route Logic)
    # -------------------------------------------------------------
    flight_triggers = ["flight", "fly", "trip", "travel", "plane", "ticket", "airline", "dubai", "new york"]
    is_flight_action = any(k in prompt_lower for k in flight_triggers) or (session["active_scenario"] == "flight" and any(k in prompt_lower for k in ["cheaper", "business", "first class", "change", "date"]))

    if is_flight_action:
        session["active_scenario"] = "flight"

        from_to_match = re.search(r'from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)', prompt_raw, re.IGNORECASE)
        to_from_match = re.search(r'to\s+([a-zA-Z\s]+?)\s+from\s+([a-zA-Z\s]+)', prompt_raw, re.IGNORECASE)

        if from_to_match:
            session["flight_origin"] = clean_city_string(from_to_match.group(1)).title()
            session["flight_destination"] = clean_city_string(from_to_match.group(2)).title()
        elif to_from_match:
            session["flight_destination"] = clean_city_string(to_from_match.group(1)).title()
            session["flight_origin"] = clean_city_string(to_from_match.group(2)).title()
        else:
            to_match = re.search(r'(?:to|in)\s+([a-zA-Z\s]+)', prompt_raw, re.IGNORECASE)
            if to_match:
                session["flight_destination"] = clean_city_string(to_match.group(1)).title()

        origin = session["flight_origin"]
        destination = session["flight_destination"]

        long_haul_cities = ["new york", "ny", "jfk", "london", "paris", "tokyo", "los angeles", "chicago", "toronto", "sydney"]
        is_long_haul = any(c in origin.lower() for c in long_haul_cities) or any(c in destination.lower() for c in long_haul_cities)

        if "business" in prompt_lower:
            rate_1, rate_2 = 3200.00, 2850.00
            class_label = "Business Class"
        elif is_long_haul:
            rate_1, rate_2 = 1150.00, 890.00
            class_label = "Economy"
        else:
            rate_1, rate_2 = 380.00, 295.00
            class_label = "Economy"

        return {
            "ai_response": f"I found available {class_label} routes for {origin} to {destination}. Here are the top available bookings.",
            "options": [
                {
                    "id": 1,
                    "name": f"Emirates Direct ({origin} to {destination})",
                    "rate": rate_1,
                    "time": "Departs Sat at 11:30 AM"
                },
                {
                    "id": 2,
                    "name": f"Saudia Express ({origin} to {destination})",
                    "rate": rate_2,
                    "time": "Departs Sat at 04:15 PM"
                }
            ]
        }

    # -------------------------------------------------------------
    # SCENARIO 3: PLUMBING & HOME REPAIRS
    # -------------------------------------------------------------
    plumbing_triggers = ["plumber", "plumbing", "sink", "fix", "leak", "repair", "pipe", "handyman", "ac", "electrician"]
    is_plumbing_action = any(k in prompt_lower for k in plumbing_triggers) or (session["active_scenario"] == "plumber" and any(k in prompt_lower for k in ["cheaper", "later", "evening", "morning", "slot"]))

    if is_plumbing_action:
        session["active_scenario"] = "plumber"

        time_slot_1 = "Tomorrow at 06:00 PM" if "evening" in prompt_lower else "Tomorrow at 10:00 AM"
        time_slot_2 = "Tomorrow at 08:00 PM" if "evening" in prompt_lower else "Tomorrow at 02:00 PM"

        return {
            "ai_response": "I contacted licensed plumbers in Dammam for your kitchen sink repair. Here are the confirmed time slots.",
            "options": [
                {
                    "id": 1,
                    "name": "QuickFix Emergency Plumbing",
                    "rate": 45.00,
                    "time": time_slot_1
                },
                {
                    "id": 2,
                    "name": "Elite Pro Repair Masters",
                    "rate": 65.00,
                    "time": time_slot_2
                }
            ]
        }

    # -------------------------------------------------------------
    # SCENARIO 4: BILL PAYMENTS
    # -------------------------------------------------------------
    bill_triggers = ["bill", "internet", "stc", "mobily", "utility", "pay", "electric", "electricity", "water", "phone"]
    if any(k in prompt_lower for k in bill_triggers):
        session["active_scenario"] = "bill"
        provider = "STC Fiber Internet" if ("stc" in prompt_lower or "internet" in prompt_lower or "phone" in prompt_lower) else "Saudi Electricity Company" if "electric" in prompt_lower else "National Water Company"
        amount = 75.00 if ("internet" in prompt_lower or "stc" in prompt_lower or "phone" in prompt_lower) else 145.20 if "electric" in prompt_lower else 42.50

        return {
            "ai_response": f"I've fetched your verified account statement for {provider}. Here is your total outstanding balance.",
            "options": [
                {
                    "id": 1,
                    "name": f"{provider} Balance Settlement",
                    "rate": amount,
                    "time": "Instant Processing"
                }
            ]
        }

    # -------------------------------------------------------------
    # GENERAL CONVERSATIONAL QUESTIONS (No cards)
    # -------------------------------------------------------------
    if any(prompt_lower.startswith(q) for q in ["how much", "why", "can you", "where is", "what is"]):
        return {
            "ai_response": "I can certainly look into that for you. What specific provider, city, or service details should I check?",
            "options": []
        }

    # -------------------------------------------------------------
    # GENERAL ACTIONABLE FALLBACK
    # -------------------------------------------------------------
    clean_task = prompt_raw[:30] + "..." if len(prompt_raw) > 30 else prompt_raw
    return {
        "ai_response": f"I've processed your errand request for '{clean_task}' and prepared options.",
        "options": [
            {"id": 1, "name": "Priority Concierge Dispatch", "rate": 35.00, "time": "Completion within 1 hour"},
            {"id": 2, "name": "Standard Delivery Service", "rate": 20.00, "time": "Completion within 3 hours"}
        ]
    }

# --- ENDPOINTS ---

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    session = get_or_create_session(request.session_id)
    session["history"].append({"role": "user", "content": request.user_prompt})

    ai_data = process_stateful_prompt(request.user_prompt, session)
    session["history"].append({"role": "ai", "content": ai_data["ai_response"]})

    return {
        "status": "success", 
        "session_id": request.session_id,
        "ai_response": ai_data["ai_response"],
        "options": ai_data["options"]
    }

@app.get("/api/stream-task")
async def stream_task(user_prompt: str, session_id: str):
    session = get_or_create_session(session_id)
    session["history"].append({"role": "user", "content": user_prompt})

    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'thinking', 'message': 'Analyzing prompt and checking active session context...'})}\n\n"
            await asyncio.sleep(1.2)
            
            yield f"data: {json.dumps({'status': 'evaluating', 'message': 'Querying regional suppliers and verified APIs...'})}\n\n"
            await asyncio.sleep(1.5)

            yield f"data: {json.dumps({'status': 'optimizing', 'message': 'Updating basket pricing and booking constraints...'})}\n\n"
            await asyncio.sleep(0.8)
            
            ai_data = process_stateful_prompt(user_prompt, session)
            session["history"].append({"role": "ai", "content": ai_data["ai_response"]})

            yield f"data: {json.dumps({'status': 'complete', 'ai_response': ai_data['ai_response'], 'options': ai_data['options']})}\n\n"

        except Exception as e:
            print(f"Streaming Error: {e}")
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/voice-task")
async def process_voice_task(
    audio_file: UploadFile = File(...), 
    session_id: str = Form(...) 
):
    await asyncio.sleep(2.0)
    session = get_or_create_session(session_id)
    mock_transcription = "Book a plumber to fix my kitchen sink tomorrow"
    ai_data = process_stateful_prompt(mock_transcription, session)

    session["history"].append({"role": "user", "content": f"🎤 {mock_transcription}"})
    session["history"].append({"role": "ai", "content": ai_data['ai_response']})

    return {
        "status": "success", 
        "session_id": session_id,
        "transcription": mock_transcription,
        "ai_response": ai_data["ai_response"],
        "options": ai_data["options"]
    }

@app.post("/api/checkout")
async def process_checkout(request: CheckoutRequest):
    try:
        paypal_response = create_paypal_order(request.cart_total)
        order_id = paypal_response["order_data"]["id"]
        approval_link = paypal_response["approval_link"]
        
        payment_statuses[order_id] = "pending"
            
        return {
            "item": request.item_name,
            "received_amount": request.cart_total,
            "payment_link": approval_link,
            "order_id": order_id
        }
    except Exception as e:
        print(f"Checkout Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize PayPal checkout.")

@app.get("/payment/status/{order_id}")
async def check_payment_status(order_id: str):
    status = payment_statuses.get(order_id, "pending")
    return {"status": status}