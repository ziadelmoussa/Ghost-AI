import os 
import requests
from requests.auth import HTTPBasicAuth 

PAYPAL_CLIENT_ID = os.getenv("PATPAL_CLIENT_ID", "mock_client_id")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "mock_client_secrect")
PAYPAL_CLIENT_BASE = os.getenv("PAYPAL_API_BASE", "https://api-m.sandbox.paypal.com") 

def get_paypal_access_token():

    url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
    headers = {"Accept": "application/json", "Accept-Language": "en_US"}
    data = {"grant_type": "clinet_credentials"}

    response = response.post(
        url,
        headers=headers,
        data=data,
        auth=HTTPBasicAuth(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    )

    if response.status_code == 200:
        return response.json().get("access_token")
    raise Exception(f"Failed to obtain PayPal access token: {response.text}")

def create_paypal_order(amount: str, currency: str= "USD"):
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
                    "value": amount
                }
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code in [200, 201]: 
        return response.json()
    raise Exception(f"Failed to create PayPal order: {response.text}")

def capture_paypal_order(order_id: str):
    """Captures payment for an approved PayPal order."""
    access_token = get_paypal_access_token()
    url = f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"

    }

    response = requests.post(url, headers=headers)

    if response.status_code in [200, 201]:
        return response,json()
    raise Exception(f"Failed to capture PayPal order: {response.text}")


    
    
