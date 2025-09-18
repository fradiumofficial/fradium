import os
import hmac
import hashlib
import time
import json
from typing import Any, Dict

import requests

from config.settings import STRIPE_API_KEY, STRIPE_API_URL, STRIPE_WEBHOOK_URL


def create_checkout_session(*, order_id: str, coin_type: str, amount_minor: int, destination_address: str, success_path: str = "/order/success", cancel_path: str = "/cancel") -> Dict[str, Any]:
    """Create a Stripe Checkout Session (one-time payment) in USD.

    amount_minor: integer amount in minor currency unit (e.g. cents)
    coin_type: e.g. BTC/ETH/SOL/ICP
    destination_address: the address to receive the tokens after payment (metadata)
    """
    headers = {
        "Authorization": f"Bearer {STRIPE_API_KEY}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    success_url = f"{STRIPE_WEBHOOK_URL}{success_path}?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{STRIPE_WEBHOOK_URL}{cancel_path}"

    # Send both session-level metadata and payment_intent metadata for redundancy
    payload = {
        "mode": "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        # Stripe requires at least 30 minutes from creation
        "expires_at": str(int(time.time()) + 1800),
        # Session-level metadata
        "metadata[order_id]": order_id,
        "metadata[coin_type]": coin_type,
        "metadata[destination_address]": destination_address,
        "metadata[amount_minor]": str(amount_minor),
        # PaymentIntent metadata
        "payment_intent_data[metadata][order_id]": order_id,
        "payment_intent_data[metadata][coin_type]": coin_type,
        "payment_intent_data[metadata][destination_address]": destination_address,
        "payment_intent_data[metadata][amount_minor]": str(amount_minor),
        # Line item
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": f"Buy {coin_type.upper()} with the amount of {amount_minor}",
        "line_items[0][price_data][unit_amount]": str(amount_minor),
        "line_items[0][quantity]": "1",
    }

    print(f"[Stripe] Payload: {payload}")

    try:
        resp = requests.post(f"{STRIPE_API_URL}/checkout/sessions", headers=headers, data=payload)
    except Exception as e:
        print(f"[Stripe] Exception while creating checkout session: {e}")
        print(f"[Stripe] Payload (sanitized): {{'mode': '{payload.get('mode')}', 'amount_minor': '{payload.get('line_items[0][price_data][unit_amount]')}', 'coin_type': '{coin_type}', 'destination': '{destination_address[:12]}...'}}")
        raise

    if resp.status_code != 200:
        body_text = None
        try:
            body_text = resp.text
        except Exception:
            body_text = "<unreadable response body>"
        print("[Stripe] Checkout creation failed")
        print(f"[Stripe] Status: {resp.status_code}")
        print(f"[Stripe] Body: {body_text}")
        print(f"[Stripe] Payload (sanitized): {{'mode': '{payload.get('mode')}', 'amount_minor': '{payload.get('line_items[0][price_data][unit_amount]')}', 'coin_type': '{coin_type}', 'destination': '{destination_address[:12]}...'}}")
        # Raise an HTTPError similar to raise_for_status but with context
        raise requests.HTTPError(f"Stripe checkout creation failed: {resp.status_code} {body_text}", response=resp)

    return resp.json()


def _compute_signature(secret: str, payload: bytes, timestamp: str) -> str:
    signed_payload = f"{timestamp}.".encode("utf-8") + payload
    mac = hmac.new(secret.encode("utf-8"), msg=signed_payload, digestmod=hashlib.sha256)
    return mac.hexdigest()


def verify_webhook_signature(payload: bytes, sig_header: str, secret: str, tolerance: int = 300) -> bool:
    """Verify Stripe webhook signature without using stripe SDK.

    Stripe-Signature header format: t=timestamp,v1=signature[,v1=...]
    """
    try:
        items = dict(item.split("=", 1) for item in sig_header.split(","))
        timestamp = items.get("t")
        signatures = [v for k, v in items.items() if k == "v1"]
        if not timestamp or not signatures:
            return False
        expected_sig = _compute_signature(secret, payload, timestamp)
        if not any(hmac.compare_digest(s, expected_sig) for s in signatures):
            return False
        # Optional: timestamp tolerance
        if abs(int(time.time()) - int(timestamp)) > tolerance:
            return False
        return True
    except Exception:
        return False


def extract_checkout_metadata(event: Dict[str, Any]) -> Dict[str, Any]:
    """Extract metadata from checkout.session.completed event object.

    Returns dict with keys: order_id, coin_type, destination_address, amount_minor
    """
    obj = event.get("data", {}).get("object", {})
    metadata = obj.get("metadata", {}) or {}
    # Fallback to payment_intent metadata if present
    pi = obj.get("payment_intent")
    if isinstance(pi, dict):
        metadata = {**pi.get("metadata", {}), **metadata}
    return {
        "order_id": metadata.get("order_id"),
        "coin_type": metadata.get("coin_type"),
        "destination_address": metadata.get("destination_address"),
        "amount_minor": metadata.get("amount_minor"),
    }


