import os
import requests
from requests.auth import HTTPBasicAuth

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "mock_client_id")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "mock_client_secret")
PAYPAL_API_BASE = os.getenv("PAYPAL_API_BASE", "https://api-m.sandbox.paypal.com")

def get_paypal_access_token() -> str:
    """Authenticates with PayPal REST API to retrieve a short-lived bearer token."""
    url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    data = {"grant_type": "client_credentials"}

    response = requests.post(
        url,
        headers=headers,
        data=data,
        auth=HTTPBasicAuth(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    )

    if response.status_code == 200:
        return response.json().get("access_token")
    raise Exception(f"Failed to obtain PayPal access token: {response.text}")

def create_paypal_order(amount: str, currency: str = "USD") -> dict:
    """Generates a secure checkout order and returns the approval routing URLs."""
    access_token = get_paypal_access_token()
    url = f"{PAYPAL_API_BASE}/v2/checkout/orders"

    headers = { 
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": currency,
                    "value": str(amount)
                }
            }
        ],
        "application_context": {
            "locale": "en-US",
            "return_url": "http://localhost:8000/payment/success",
            "cancel_url": "http://localhost:8000/payment/cancel"
        }
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code in [200, 201]: 
        order_data = response.json()
        approval_link = next((link["href"] for link in order_data.get("links", []) if link["rel"] == "approve"), None)
        
        # The ultimate override: force English via the URL parameter
        if approval_link:
            approval_link += "&locale.x=en_US"
            
        return {"order_data": order_data, "approval_link": approval_link}
    raise Exception(f"Failed to create PayPal order: {response.text}")