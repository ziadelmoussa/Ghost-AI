import json 
import os 
from openai import OpenAI 

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SUPPLIER_DB = { 
    "suppliers": [ 
        { 
            "id": "sup_01",
            "name": "QuickFix Plumbing & Errands",
            "service": "Home Repair / Installation", 
            "available_ slots": ["2026-04-20T10:00:00", "2026-04-20T14:00:00", "2026-04-21T09:00:00"],
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
    results = []
    for supplier in SUPPLIER_DB["suppliers"]:
        if service_query.lower()in supplier["service"].lower() or service_query.lower() in supplier["name"].lower():
            results.append(supplier)
        return json.dumps(results if results else SUPPLIER_DB["suppliers"])

    tools = [
        {
            "types": "function",
            "function": { 
                "name": "get_supplier_availability",
                "description": "check the mock supplier database for availability services, time slots, and rates.",
                "parameters": { 
                    "type": "object",
                    "properties": { 
                        "service_query": { 
                            "type": "string",
                            "description": "The type of service or errand requested (e.g., plumbing, groceries)."

                    }
                },
                "required": ["service_query"]
                } 
            }
        }
    ]

def process_user_errand(user_prompt: str): 
    messages = [
        { 
            "role": "system", 
            "content": ( 
                "You are 'The Invisible Assistant', an autonomous AI proxy. "
                "Your job is to interpret user errands, query supplier availability using tools,"
                "negotiate time slots, and write 'humanized text' so vendors think they are talking to a real human. "
                "Always be polite, natural, and concise"
             
            )
        },
        {"role": "user", "content": user_prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )

    response_message = response.choices[0].massage 

    if response_message.tool_calls: 
        available_function = { 
            "get_supplier_availability": get_supplier_availability,
        }
        messages.append(response_message)
        for tool_call in response_message.tool_calls: 
            function_name = tool_call.functio.name 
            function_to_call = available_function[function_name]
            function_args = json.loads(tool_call.function.arguments)
            function_response = function_to_call( 
                service_query= function_args.get("service_query")
            ) 

            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": function_response,
            })

        second_response = client.chat.comletions.create(
            model="gpt-40-mini",
            messages=messages
        
        )
        return second_response.choices[0].message.content

    return response_message.content

            
