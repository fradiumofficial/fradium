import os
import json
import time
import logging
import traceback
from flask import Flask, request, jsonify

from utils.stripe import verify_webhook_signature, extract_checkout_metadata
from utils.canister import make_canister
from utils.candid import unwrap_candid
from utils.coin import to_smallest
from utils.pricing import get_price_usd_number
from config.settings import STRIPE_API_KEY


app = Flask(__name__)

# Configure logging (console)
if not app.logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)


@app.before_request
def _log_request_info():
    try:
        app.logger.info(
            f"[Webhook] {request.method} {request.path} qs={dict(request.args)} len={request.content_length}"
        )
    except Exception:
        pass


def _load_controller_private_key() -> str:
    """Load controller private key from principal/private.pem file.

    Priority:
    1) principal/private.pem (alongside project root)
    2) fetch/principal/private.pem (if present)
    3) CONTROLLER_PRIVATE_KEY env (fallback; hex/PEM allowed)
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))  # .../fetch
    candidates = [
        os.path.abspath(os.path.join(base_dir, "..", "principal", "private.pem")),
        os.path.abspath(os.path.join(base_dir, "principal", "private.pem")),
    ]
    for path in candidates:
        try:
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as f:
                    pem = f.read().strip()
                    if pem:
                        print(f"[Webhook] Using controller key from {path}")
                        return pem
        except Exception:
            pass

    raise RuntimeError(
        "Controller private key not found. Place your PEM at principal/private.pem."
    )

@app.route("/health", methods=["GET"])
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


@app.route("/order/success", methods=["GET"])
def order_success() -> tuple:
    session_id = request.args.get("session_id", "-")
    html = f"""
    <!doctype html>
    <html lang=\"en\">
      <head>
        <meta charset=\"utf-8\">
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
        <title>Order Success</title>
        <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css\" rel=\"stylesheet\" integrity=\"sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH\" crossorigin=\"anonymous\">
      </head>
      <body class=\"bg-light\">
        <div class=\"container py-5\">
          <div class=\"row justify-content-center\">
            <div class=\"col-lg-8\">
              <div class=\"card shadow-sm border-0\">
                <div class=\"card-body p-4 p-md-5\">
                  <div class=\"d-flex align-items-center mb-3\">
                    <span class=\"badge rounded-pill text-bg-success me-2\">Success</span>
                    <h4 class=\"m-0\">Payment Completed</h4>
                  </div>
                  <p class=\"text-muted\">Thank you! Your payment has been received. Your order is being processed.</p>

                  <div class=\"alert alert-secondary\" role=\"alert\">
                    <div class=\"fw-semibold\">Session ID</div>
                    <code>{session_id}</code>
                  </div>

                  <ul class=\"list-unstyled small text-muted mb-4\">
                    <li>• Tokens will be sent after we receive payment confirmation from Stripe.</li>
                    <li>• Please save this page or your Session ID for support purposes.</li>
                  </ul>

                  <a href=\"/\" class=\"btn btn-primary\">Back to Home</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz\" crossorigin=\"anonymous\"></script>
      </body>
    </html>
    """
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/cancel", methods=["GET"])
def order_cancel() -> tuple:
    return jsonify({
        "status": "cancelled",
        "message": "Payment was cancelled. No charges were made."
    }), 200


@app.route("/stripe/webhook", methods=["POST"])
def stripe_webhook() -> tuple:
    try:
        secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
        sig_header = request.headers.get("Stripe-Signature", "")
        payload = request.get_data()
        app.logger.info(
            f"[Webhook] Received Stripe webhook: len={len(payload)} sig_present={'yes' if bool(sig_header) else 'no'} secret_set={'yes' if bool(secret) else 'no'}"
        )

        # Verify signature (skip if no secret configured)
        if secret:
            if not verify_webhook_signature(payload, sig_header, secret):
                app.logger.warning("[Webhook] Invalid Stripe signature")
                return jsonify({"error": "invalid signature"}), 400
        else:
            app.logger.warning("[Webhook] No STRIPE_WEBHOOK_SECRET configured, skipping signature verification")

        event = request.get_json(force=True, silent=True) or {}
        event_type = event.get("type")
        event_id = event.get("id")
        app.logger.info(f"[Webhook] Event type={event_type}, id={event_id}")

        if event_type == "checkout.session.completed":
            metadata = extract_checkout_metadata(event)
            coin_type = (metadata.get("coin_type") or "").lower()
            destination = metadata.get("destination_address") or ""
            amount_minor_str = metadata.get("amount_minor") or "0"
            app.logger.info(f"[Webhook] Metadata: coin={coin_type} dest={destination} cents={amount_minor_str}")

            if not coin_type or not destination:
                app.logger.warning("[Webhook] Missing coin_type or destination in metadata")
                return jsonify({"status": "ignored", "reason": "missing metadata"}), 200

            # Enforce 5-minute validity window based on session creation time
            obj = event.get("data", {}).get("object", {})
            created_ts = obj.get("created")  # seconds since epoch
            try:
                created_ts = int(created_ts) if created_ts is not None else None
            except Exception:
                created_ts = None
            now = int(time.time())
            if created_ts is not None and (now - created_ts) > 300:
                app.logger.info("[Webhook] Session expired (>5 minutes)")
                return jsonify({"status": "expired", "message": "Payment link expired (over 5 minutes)."}), 200

            # Determine token amount based on paid USD amount
            try:
                usd_cents = int(amount_minor_str)
            except Exception:
                usd_cents = 0
            usd_amount = usd_cents / 100.0
            price_usd = get_price_usd_number(coin_type)
            app.logger.info(f"[Webhook] USD paid={usd_amount}, price_usd={price_usd}")
            if not price_usd or price_usd <= 0:
                app.logger.error("[Webhook] Unable to fetch token price")
                return jsonify({"status": "error", "message": "Unable to fetch token price"}), 500
            # token_amount = USD / price_per_token
            from decimal import Decimal
            token_amount = Decimal(str(usd_amount)) / price_usd
            # Convert to smallest unit for blockchain send
            smallest = to_smallest(coin_type.upper(), token_amount)
            app.logger.info(f"[Webhook] token_amount={token_amount} smallest={smallest}")

            try:
                controller_priv = _load_controller_private_key()
                wallet = make_canister("wallet", controller_priv)
                app.logger.info(f"[Webhook] Sending token via canister: coin={coin_type} to={destination} amt={smallest}")
                if coin_type in {"btc", "eth", "sol"}:
                    # Use canister_send_token for chain tokens
                    res_raw = wallet.canister_send_token(destination, smallest, coin_type)
                    res = unwrap_candid(res_raw)
                elif coin_type == "icp":
                    # ICP transfer via canister_send_token (amount in e8s)
                    res_raw = wallet.canister_send_token(destination, smallest, "icp")
                    res = unwrap_candid(res_raw)
                else:
                    app.logger.warning(f"[Webhook] Unsupported coin: {coin_type}")
                    return jsonify({"status": "ignored", "reason": "unsupported coin"}), 200

                app.logger.info(f"[Webhook] Transfer OK: {res}")
                return jsonify({"status": "ok", "tx": res}), 200
            except Exception as e:
                app.logger.exception("[Webhook] Error during token send")
                return jsonify({"status": "error", "message": str(e)}), 500

        # Acknowledge other events
        app.logger.info("[Webhook] Event ignored")
        return jsonify({"status": "ignored"}), 200

    except Exception as e:
        app.logger.exception("[Webhook] Unhandled exception in /stripe/webhook")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("WEBHOOK_PORT", 8080)))


