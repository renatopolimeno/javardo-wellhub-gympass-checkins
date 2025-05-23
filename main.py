import os
import hmac
import hashlib
import json
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# Use Sandbox credentials for now
GYMPASS_API_KEY = os.getenv("GYMPASS_API_KEY") # Your Gympass API Key (Sandbox or Production)
GYMPASS_WEBHOOK_SECRET = os.getenv("GYMPASS_WEBHOOK_SECRET") # Your Gympass Webhook Secret
GYMPASS_GYM_ID = os.getenv("GYMPASS_GYM_ID") # Your Gympass Gym ID (Sandbox: 174, Production: Your ID)
GYMPASS_API_BASE_URL = "https://api.gympass.com/v1"
SANDBOX_GYM_ID = "174" # Sandbox Gym ID for testing

# --- FastAPI App ---
app = FastAPI()

# --- In-memory storage for pending check-ins ---
# In a real production app, this should be a persistent store (database)
# Key: Gympass User ID, Value: Check-in data from webhook
pending_checkins: Dict[str, Dict[str, Any]] = {}

# --- Dependency to get Gym ID ---
def get_gym_id():
    # For now, use the configured GYMPASS_GYM_ID
    # In a production scenario, you might want to handle multiple gyms
    return GYMPASS_GYM_ID or SANDBOX_GYM_ID # Fallback to sandbox if not set


# --- Helper Functions ---
def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verifies the signature of the Gympass webhook payload."""
    if not secret:
        # In production, you should always have a secret configured
        print("Warning: GYMPASS_WEBHOOK_SECRET is not set. Skipping signature verification.")
        return True # Allow for testing without signature

    try:
        # Gympass uses SHA256 hash of the payload and the secret
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        # Compare securely
        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        print(f"Error verifying signature: {e}")
        return False

def validate_checkin_with_gympass(user_id: str, gym_id: str) -> Dict[str, Any]:
    """Calls the Gympass validate endpoint."""
    if not GYMPASS_API_KEY:
        raise HTTPException(status_code=500, detail="GYMPASS_API_KEY not set")

    url = f"{GYMPASS_API_BASE_URL}/access-control/validate"
    headers = {
        "Authorization": f"Bearer {GYMPASS_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "user_id": user_id,
        "gym_id": gym_id
    }

    print(f"Calling Gympass validate endpoint for user {user_id} at gym {gym_id}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling Gympass validate endpoint: {e}")
        raise HTTPException(status_code=response.status_code if response else 500, detail=f"Failed to validate check-in with Gympass: {e}")


# --- Endpoints ---

@app.get("/")
async def read_root():
    """Root endpoint for testing."""
    return {"message": "FastAPI Gympass Check-in Automation is running!"}

@app.post("/gympass-webhook")
async def handle_gympass_webhook(
    request: Request,
    x_api_signature: Optional[str] = Header(None),
    gym_id: str = Depends(get_gym_id) # Use the configured gym_id
):
    """Handles incoming webhooks from Gympass."""
    print("Webhook received!")

    # Read the raw body for signature verification
    body = await request.body()

    # Verify signature (if secret is set)
    if GYMPASS_WEBHOOK_SECRET and (x_api_signature is None or not verify_signature(body, x_api_signature, GYMPASS_WEBHOOK_SECRET)):
         print("Signature verification failed or signature missing.")
         raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        data = json.loads(body)
        print(f"Webhook data: {data}")

        # Check if the webhook event is a check-in
        # The event structure might vary, adjust based on actual Gympass webhook data
        # Based on documentation, 'checkin.created' or similar event type might be used
        # The documentation points to a POST to /webhooks, receiving check-in data directly.
        # Let's assume the webhook sends the check-in data directly in the body.
        # The body should contain information like user_id, gym_id, etc.

        # Example processing based on anticipated check-in data structure:
        user_id = data.get("user", {}).get("id")
        checkin_id = data.get("checkin", {}).get("id") # Assuming checkin ID is provided
        webhook_gym_id = data.get("gym", {}).get("id") # Gym ID from the webhook

        if user_id and webhook_gym_id == int(gym_id): # Ensure webhook is for our configured gym
            print(f"Received check-in webhook for user: {user_id}, checkin_id: {checkin_id}")
            # Store the pending check-in data.
            # We store the whole payload or relevant parts needed for validation later.
            # For simplicity, storing the whole data received.
            pending_checkins[user_id] = data
            print(f"Stored pending check-in for user: {user_id}")
            # Gympass expects a 200 OK response if the webhook is received successfully
            return JSONResponse(content={"message": "Webhook received and processed"}, status_code=200)
        elif webhook_gym_id != int(gym_id):
             print(f"Webhook received for incorrect gym ID: {webhook_gym_id}. Configured gym ID is {gym_id}.")
             return JSONResponse(content={"message": "Webhook received for incorrect gym ID"}, status_code=200) # Still return 200 to not cause retries
        else:
            print("Webhook data does not contain expected user ID or gym ID.")
            # Still return 200 to not cause retries, but log the unexpected data
            print(f"Unexpected webhook data structure: {data}")
            return JSONResponse(content={"message": "Webhook data missing required fields"}, status_code=200)

    except json.JSONDecodeError:
        print("Failed to decode JSON body.")
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    except Exception as e:
        print(f"An error occurred while processing webhook: {e}")
        # Return 500 for internal errors that prevent processing, Gympass might retry
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@app.get("/check-in-qr/{user_identifier}")
async def handle_qr_scan(user_identifier: str, gym_id: str = Depends(get_gym_id)):
    """Endpoint hit when a user scans the QR code."""
    # The QR code link could contain the Gympass user ID or device ID, or something else.
    # Let's assume for simplicity the QR code encodes the Gympass User ID directly.
    # A more robust approach might involve generating a temporary token/UUID linked to a pending check-in.
    # For now, we'll try to match the scanned user_identifier with a pending check-in user_id.

    scanned_user_id = user_identifier # Assuming QR encodes user_id

    print(f"QR Code scanned for identifier: {scanned_user_id}")

    if scanned_user_id in pending_checkins:
        print(f"Matching pending check-in found for user: {scanned_user_id}. Proceeding to validate.")
        try:
            # Call Gympass validate endpoint
            validation_result = validate_checkin_with_gympass(scanned_user_id, gym_id)

            # Remove the pending check-in after successful validation attempt
            # In a real system, you might want to keep it for a short period or log the event
            del pending_checkins[scanned_user_id]
            print(f"Pending check-in removed for user: {scanned_user_id}")

            # Gympass validate endpoint response structure:
            # Success: {"id": "...", "status": "validated", ...}
            # Failure: {"message": "...", ...}

            if validation_result and validation_result.get("status") == "validated":
                 print(f"Check-in successfully validated for user: {scanned_user_id}")
                 return {"status": "success", "message": "Check-in validado com sucesso!"}
            else:
                 print(f"Check-in validation failed for user {scanned_user_id}. Result: {validation_result}")
                 # Return a user-friendly message based on Gympass response if possible
                 return {"status": "failure", "message": "Falha na validação. Check-in inválido ou expirado.", "details": validation_result}

        except HTTPException as e:
            print(f"HTTP Exception during validation for user {scanned_user_id}: {e.detail}")
            return {"status": "error", "message": f"Erro ao validar check-in: {e.detail}"}
        except Exception as e:
            print(f"An unexpected error occurred during QR scan handling for user {scanned_user_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Internal server error during validation: {e}")

    else:
        print(f"No pending check-in found for identifier: {scanned_user_id}")
        # No matching pending check-in found (e.g., user didn't check-in on Gympass app first,
        # or webhook wasn't received/processed yet)
        return JSONResponse(content={"status": "failure", "message": "Nenhum check-in pendente encontrado ou correspondência não encontrada. Por favor, faça o check-in no app Gympass primeiro."}, status_code=404)


# --- How to run locally ---
# Save this file as main.py
# Create a .env file in the same directory:
# GYMPASS_API_KEY="your_api_key" # Use the sandbox key for testing
# GYMPASS_WEBHOOK_SECRET="your_webhook_secret" # Set a secret string
# GYMPASS_GYM_ID="your_gym_id" # Use "174" for sandbox testing
#
# Install dependencies: pip install fastapi uvicorn requests python-dotenv
# Run: uvicorn main:app --reload
#
# For testing webhook locally, you might need a tool like ngrok to expose your local server to the internet
# so Gympass can send webhooks to your machine.
#
# The QR code link would point to: YOUR_RENDER_APP_URL/check-in-qr/USER_ID_FROM_QR
