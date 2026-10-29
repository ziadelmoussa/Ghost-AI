import os
import json
import asyncio
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables prior to local module imports
load_dotenv()
from payments import create_paypal_order

app = FastAPI(title="Ghost AI - Stateful Core Engine")

# Configure Cross-Origin Resource Sharing (CORS) for decoupled frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---

class TaskRequest(BaseModel):
    user_prompt: str
    session_id: str

class CheckoutRequest(BaseModel):
    cart_total: float
    item_name: str
    session_id: str

# --- In-Memory State Management ---
# For production, migrate to Redis or PostgreSQL. Maintained in-memory for hackathon zero-latency demonstration.
sessions_db = {}
payment_statuses = {}

# --- Utility Parsers ---

def clean_city_string(city_str: str) -> str:
    """Sanitizes extracted location data from natural language prompts."""
    return re.sub(
        r'\s+(for|next|this|on|tomorrow|weekend|today|next week|next month|cheap|flights|flight|ticket).*$', 
        '', 
        city_str, 
        flags=re.IGNORECASE
    ).strip()

def get_or_create_session(session_id: str) -> dict:
    """Retrieves or initializes a user session with default mock inventory parameters."""
    if session_id not in sessions_db:
        sessions_db[session_id] = {
            "history": [],
            "active_scenario": None, 
            "grocery_items": ["Almarai Milk", "Eggs", "Bread", "Arabic Coffee"],
            "grocery_total": 28.50,
            "flight_origin": "Dammam",
            "flight_destination": "New York"
        }
    return sessions_db[session_id]

# --- Core Stateful Scenario Engine ---

def process_stateful_prompt(prompt: str, session: dict) -> dict:
    """
    Parses natural language input and routes it through contextual scenario pipelines.
    Returns a standardized dictionary containing the AI response and dynamic checkout options.
    """
    prompt_raw = prompt.strip()
    prompt_lower = prompt_raw.lower()
    clean_alpha = re.sub(r'[^a-zA-Z0-9\s]', '', prompt_lower).strip()

    # 1. Base Conversational Handlers
    if len(clean_alpha) < 2 and clean_alpha not in ["hi"]:
        return {
            "ai_response": "I didn't quite catch that. Could you please specify how I can assist with your errand?",
            "options": []
        }

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

    # 2. Active Scenario Checkout Confirmation
    confirm_keywords = [
        "pay", "checkout", "book", "confirm", "take it", "buy", "proceed", 
        "select", "yes", "let me pay", "first", "second", "option", "i like", 
        "go with", "this one", "that one", "sounds good", "perfect", "do it", "sure", "ok", "okay"
    ]
    is_bill_explicit = any(b in prompt_lower for b in ["water", "electric", "electricity", "stc", "utility", "bill"])

    if session["active_scenario"] and any(k in prompt_lower for k in confirm_keywords) and not is_bill_explicit:
        scenario = session["active_scenario"]
        
        if scenario == "flight":
            origin = session.get("flight_origin", "Dammam")
            destination = session.get("flight_destination", "New York")
            selected_rate = 890.00 if "second" in prompt_lower else 1150.00
            
            return {
                "ai_response": f"Excellent choice. I've prepared the secure checkout for your flight from {origin} to {destination}.",
                "options": [
                    {
                        "id": 1,
                        "name": f"Flight Booking ({origin} to {destination})",
                        "rate": selected_rate,
                        "time": "Instant E-Ticket Issue"
                    }
                ]
            }
        elif scenario == "grocery":
            return {
                "ai_response": "Great. I've finalized your basket and prepared the checkout.",
                "options": [
                    {
                        "id": 1,
                        "name": f"GreenThumb Express Basket ({len(session['grocery_items'])} Items)",
                        "rate": round(session["grocery_total"], 2),
                        "time": "Delivery in 30 mins"
                    }
                ]
            }
        elif scenario == "plumber":
            selected_time = "02:00 PM" if "second" in prompt_lower else "10:00 AM"
            return {
                "ai_response": f"Confirmed for {selected_time}. I've prepared the dispatch deposit for your technician.",
                "options": [
                    {
                        "id": 1,
                        "name": "QuickFix Emergency Plumbing Dispatch",
                        "rate": 45.00,
                        "time": f"Tomorrow at {selected_time}"
                    }
                ]
            }

    # 3. Scenario Pipeline: Groceries
    grocery_triggers = ["grocery", "groceries", "order", "food", "milk", "bread", "pantry", "basket", "add to the list", "add to list"]
    is_grocery_action = any(k in prompt_lower for k in grocery_triggers) or (session["active_scenario"] == "grocery" and any(k in prompt_lower for k in ["add", "item", "more", "also", "include"]))

    if is_grocery_action:
        session["active_scenario"] = "grocery"

        if any(k in prompt_lower for k in ["add", "include", "put", "also"]):
            new_additions = []
            common_items = {
                "cheese": 3.50, "chocolate": 2.50, "apples": 4.00, "water": 1.50, 
                "chicken": 8.00, "rice": 5.00, "tomatoes": 3.00, "sugar": 2.00, 
                "coffee": 6.00, "tea": 4.50, "bananas": 2.00, "beef": 12.00
            }
            
            for item, price in common_items.items():
                if item in prompt_lower:
                    formatted_item = item.title()
                    if not any(formatted_item in existing for existing in session["grocery_items"]):
                        session["grocery_items"].append(formatted_item)
                        session["grocery_total"] += price
                        new_additions.append(f"{formatted_item} (${price:.2f})")
            
            if not new_additions:
                match = re.search(r'(?:add|include)\s+([a-zA-Z\s]+)', prompt_lower)
                if match:
                    custom_item = match.group(1).split()[0].title()
                    if custom_item and len(custom_item) > 2 and custom_item not in session["grocery_items"]:
                        session["grocery_items"].append(custom_item)
                        session["grocery_total"] += 5.00
                        new_additions.append(f"{custom_item} ($5.00)")

            items_str = ", ".join(session["grocery_items"])
            added_text = f" Added {', '.join(new_additions)}." if new_additions else ""

            return {
                "ai_response": f"Updated your grocery basket.{added_text} Current list: {items_str}.",
                "options": [
                    {"id": 1, "name": f"GreenThumb Express Basket ({len(session['grocery_items'])} Items)", "rate": round(session["grocery_total"], 2), "time": "Delivery in 30 mins"},
                    {"id": 2, "name": f"Panda Supermarket Direct ({len(session['grocery_items'])} Items)", "rate": round(session["grocery_total"] - 2.50, 2), "time": "Delivery in 55 mins"}
                ]
            }
        else:
            items_str = ", ".join(session["grocery_items"])
            return {
                "ai_response": f"I've compiled your weekly grocery basket ({items_str}). Here are the delivery options.",
                "options": [
                    {"id": 1, "name": "GreenThumb Express Delivery", "rate": round(session["grocery_total"], 2), "time": "Delivery in 35 mins"},
                    {"id": 2, "name": "Panda Supermarket Direct", "rate": round(session["grocery_total"] - 2.50, 2), "time": "Delivery in 60 mins"}
                ]
            }

    # 4. Scenario Pipeline: Flights & Travel
    flight_triggers = ["flight", "fly", "trip", "travel", "plane", "ticket", "airline", "dubai", "new york", "london"]
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
            rate_1, rate_2, class_label = 3200.00, 2850.00, "Business Class"
        elif is_long_haul:
            rate_1, rate_2, class_label = 1150.00, 890.00, "Economy"
        else:
            rate_1, rate_2, class_label = 380.00, 295.00, "Economy"

        return {
            "ai_response": f"I found available {class_label} routes for {origin} to {destination}. Here are the top available bookings.",
            "options": [
                {"id": 1, "name": f"Emirates Direct ({origin} to {destination})", "rate": rate_1, "time": "Departs Sat at 11:30 AM"},
                {"id": 2, "name": f"Saudia Express ({origin} to {destination})", "rate": rate_2, "time": "Departs Sat at 04:15 PM"}
            ]
        }

    # 5. Scenario Pipeline: Plumbing & Home Repairs
    plumbing_triggers = ["plumber", "plumbing", "sink", "fix", "leak", "repair", "pipe", "handyman", "ac", "electrician"]
    is_plumbing_action = any(k in prompt_lower for k in plumbing_triggers) or (session["active_scenario"] == "plumber" and any(k in prompt_lower for k in ["cheaper", "later", "evening", "morning", "slot"]))

    if is_plumbing_action:
        session["active_scenario"] = "plumber"
        time_slot_1 = "Tomorrow at 06:00 PM" if "evening" in prompt_lower else "Tomorrow at 10:00 AM"
        time_slot_2 = "Tomorrow at 08:00 PM" if "evening" in prompt_lower else "Tomorrow at 02:00 PM"

        repair_type = "kitchen sink repair"
        repair_match = re.search(r'(?:fix|repair)\s+([a-zA-Z\s]+)', prompt_lower)
        if repair_match:
            repair_type = repair_match.group(1).split()[0] + " repair"

        return {
            "ai_response": f"I contacted licensed technicians in Dammam for your {repair_type}. Here are the confirmed time slots.",
            "options": [
                {"id": 1, "name": "QuickFix Emergency Services", "rate": 45.00, "time": time_slot_1},
                {"id": 2, "name": "Elite Pro Repair Masters", "rate": 65.00, "time": time_slot_2}
            ]
        }

    # 6. Scenario Pipeline: Bill Payments
    bill_triggers = ["bill", "internet bill", "utility bill", "electric bill", "water bill", "stc", "mobily", "electricity"]
    if any(k in prompt_lower for k in bill_triggers):
        session["active_scenario"] = "bill"
        provider = "STC Fiber Internet" if ("stc" in prompt_lower or "internet" in prompt_lower or "phone" in prompt_lower) else "Saudi Electricity Company" if "electric" in prompt_lower else "National Water Company"
        amount = 75.00 if ("internet" in prompt_lower or "stc" in prompt_lower or "phone" in prompt_lower) else 145.20 if "electric" in prompt_lower else 42.50

        return {
            "ai_response": f"I've fetched your verified account statement for {provider}. Here is your total outstanding balance.",
            "options": [
                {"id": 1, "name": f"{provider} Balance Settlement", "rate": amount, "time": "Instant Processing"}
            ]
        }

    # 7. General Inquiry Routing
    if any(prompt_lower.startswith(q) for q in ["how much", "why", "can you", "where is", "what is"]):
        return {
            "ai_response": "I can certainly look into that for you. What specific provider, city, or service details should I check?",
            "options": []
        }

    # 8. Intelligent Actionable Fallback
    clean_task = prompt_raw.capitalize() if len(prompt_raw) < 35 else prompt_raw[:32] + "..."
    return {
        "ai_response": f"I analyzed your request for '{clean_task}'. Here are verified providers available to execute this task immediately.",
        "options": [
            {"id": 1, "name": f"Priority Dispatch: {clean_task}", "rate": 35.00, "time": "Fulfill within 1 hour"},
            {"id": 2, "name": f"Standard Dispatch: {clean_task}", "rate": 20.00, "time": "Fulfill within 24 hours"}
        ]
    }

# --- REST API Endpoints ---

@app.post("/api/process-task")
def process_task(request: TaskRequest):
    """Synchronous endpoint for processing standard text inputs."""
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
    """Asynchronous Server-Sent Events (SSE) endpoint for simulating real-time processing states."""
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
async def process_voice_task(audio_file: UploadFile = File(...), session_id: str = Form(...)):
    """Handles multipart/form-data for voice transcriptions."""
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

# --- Payment & Checkout Routes ---

@app.post("/api/checkout")
async def process_checkout(request: CheckoutRequest):
    """Initializes a secure PayPal checkout session."""
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
    """Frontend polling endpoint to verify transaction state."""
    status = payment_statuses.get(order_id, "pending")
    return {"status": status}

@app.get("/payment/success")
async def payment_success(token: str):
    """Callback URL triggered by PayPal upon successful authorization."""
    payment_statuses[token] = "paid"
    
    return HTMLResponse("""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #fff; margin: 0;">
                <div style="text-align: center;">
                    <div style="display: flex; justify-content: center; margin-bottom: 24px;">
                        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style="width: 72px; height: 72px; border-radius: 50%; display: block; stroke-width: 3; stroke: #34c759; stroke-miterlimit: 10; box-shadow: inset 0px 0px 0px #34c759; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;">
                            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" style="stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 3; stroke-miterlimit: 10; stroke: #34c759; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;"/>
                            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" style="transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;"/>
                        </svg>
                    </div>
                    <style>
                        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
                        @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
                        @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 30px rgba(52, 199, 89, 0.1); } }
                    </style>
                    <h2 style="font-size: 28px; font-weight: 600; margin-bottom: 8px;">Payment Successful</h2>
                    <p style="color: #86868b; margin-bottom: 24px;">Your receipt has been securely verified.</p>
                    <p style="font-size: 14px; color: #86868b;">Closing window automatically...</p>
                </div>
                <script>
                    setTimeout(() => window.close(), 2000);
                </script>
            </body>
        </html>
    """)

@app.get("/payment/cancel")
async def payment_cancel(token: str):
    """Callback URL triggered by PayPal if the user aborts checkout."""
    payment_statuses[token] = "cancelled"
    return HTMLResponse("""
        <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #000; color: #fff; margin: 0;">
                <div style="text-align: center;">
                    <h2 style="font-size: 24px; font-weight: 600; color: #ff3b30; margin-bottom: 8px;">Payment Cancelled</h2>
                    <p style="color: #86868b;">You can safely close this window.</p>
                </div>
            </body>
        </html>
    """)