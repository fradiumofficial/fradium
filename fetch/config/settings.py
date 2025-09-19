import os

# ASI1 API settings
ASI1_API_KEY = os.getenv("ASI1_API_KEY")
ASI1_BASE_URL = "https://api.asi1.ai/v1"
ASI1_HEADERS = {
    "Authorization": f"Bearer {ASI1_API_KEY}",
    "Content-Type": "application/json"
}

# Stripe API settings
STRIPE_API_URL = "https://api.stripe.com/v1"
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
STRIPE_WEBHOOK_URL = os.getenv("STRIPE_WEBHOOK_URL")
