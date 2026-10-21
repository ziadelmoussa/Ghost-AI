import json
import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SUPPLIER_DB = { 
    "suppliers": [ 
        { 
            "id": "sup_01",
            "name": "QuickFix Plumbing & Errands",
            "service": "Home Repair / Installation", 
            "available_slots": ["2026-04-20T10:00:00", "2026-04-20T14:00:00", "2026-04-21T09:00:00"],
            "rate": 75.00
        },
        { 
            "id": "sup_02",
            "name": "GreenThumb Groceries & Delivery",
            "service": "Grocery Shopping",
            "available_slots": ["2026-04-20T11:00:00", "2026-04-20T16:00:00"],
            "rate": 45.00 
        }
    ]
}

def get_supplier_availability(service_query: str):
    """Checks the mock supplier database for available services, time slots, and rates."""
    results = []
    for supplier in SUPPLIER_DB["suppliers"]:
        if service_query.lower() in supplier["service"].lower() or service_query.lower() in supplier["name"].lower():
            results.append(supplier)
    
    return results if results else SUPPLIER_DB["suppliers"]

# Initialize model with the function tool
model = genai.GenerativeModel(
    model_name='models/gemini-3.8-flash',
    tools=[get_supplier_availability],
    system_instruction=(
        "You are 'The Invisible Assistant', an autonomous AI proxy. "
        "Interpret user errands, query supplier availability using tools, "
        "negotiate time slots, and write humanized text. Always be polite, natural, and concise."
    )
)

def process_user_errand(user_prompt: str):
    chat = model.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(user_prompt)
    return response.text

            
