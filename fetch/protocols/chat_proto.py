import json
import requests
from datetime import datetime, timezone
from uuid import uuid4
from decimal import Decimal
from uagents_core.contrib.protocols.chat import (
    chat_protocol_spec,
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    StartSessionContent,
)
from uagents import Context, Protocol

# Utils
from utils.canister import make_canister
from utils.coin import to_amount, to_smallest
from utils.pricing import get_price_usd, get_price_usd_number
from utils.identity import generate_ed25519_identity
from utils.candid import unwrap_candid
from utils.context import get_private_key_for_sender, get_principal_for_sender
from utils.stripe import create_checkout_session
from utils.text import is_greeting

# Config
from config.messages import help_message, welcome_message
from config.tools import tools
from config.settings import ASI1_BASE_URL, ASI1_HEADERS

async def get_crypto_price(ctx: Context, coin_type: str, amount_in_token: float):
    return get_price_usd(coin_type, amount_in_token, logger=ctx.logger)

def _explorer_address_url(coin: str, network: str, address: str) -> str | None:
    c = (coin or "").upper()
    n = (network or "").lower()
    addr = address or ""
    if c == "BTC":
        if n == "mainnet":
            return f"https://mempool.space/address/{addr}"
        if "testnet" in n:
            return f"https://mempool.space/testnet/address/{addr}"
        if "regtest" in n:
            return None
        return None
    if c == "ETH":
        if "sepolia" in n:
            return f"https://sepolia.etherscan.io/address/{addr}"
        if "goerli" in n:
            return f"https://goerli.etherscan.io/address/{addr}"
        if "mainnet" in n:
            return f"https://etherscan.io/address/{addr}"
        return None
    if c == "SOL":
        if "devnet" in n:
            return f"https://explorer.solana.com/address/{addr}?cluster=devnet"
        if "testnet" in n:
            return f"https://explorer.solana.com/address/{addr}?cluster=testnet"
        if "mainnet" in n:
            return f"https://explorer.solana.com/address/{addr}"
        return None
    if c == "ICP":
        if n == "local":
            return None
        return f"https://dashboard.internetcomputer.org/principal/{addr}"
    return None

def _get_pending_transfer_for_sender(ctx: Context) -> dict | None:
    try:
        pending_transfers = ctx.storage.get("pending_transfers") or {}
        return pending_transfers.get(getattr(ctx, "sender", None))
    except Exception:
        return None

def _set_pending_transfer_for_sender(ctx: Context, pending: dict) -> None:
    pending_transfers = ctx.storage.get("pending_transfers") or {}
    pending_transfers[getattr(ctx, "sender", None)] = pending
    ctx.storage.set("pending_transfers", pending_transfers)

def _clear_pending_transfer_for_sender(ctx: Context) -> None:
    pending_transfers = ctx.storage.get("pending_transfers") or {}
    sender_key = getattr(ctx, "sender", None)
    if sender_key in pending_transfers:
        del pending_transfers[sender_key]
        ctx.storage.set("pending_transfers", pending_transfers)


async def call_endpoint(ctx: Context, func_name: str, args: dict):
    # Create canister
    ctx.logger.info(f"Private key: {get_private_key_for_sender(ctx)}")
    wallet_canister = make_canister("wallet", get_private_key_for_sender(ctx))
    icp_ledger_canister = make_canister("icp_ledger", get_private_key_for_sender(ctx))
    ai_canister = make_canister("ai", get_private_key_for_sender(ctx))

    try:
        # Fetch coin network info once for address/balance responses
        networks = None
        try:
            networks_raw = wallet_canister.coin_network()
            networks = unwrap_candid(networks_raw) or {}
        except Exception:
            networks = {}

        if func_name == "help":
            result = help_message

        elif func_name == "send_bitcoin":
            destination = args["destinationAddress"]
            amount_token = Decimal(str(args["amount"]))
            amount_smallest = to_smallest("BTC", amount_token)
            req = {"destination_address": destination, "amount_in_satoshi": amount_smallest}
            txid = unwrap_candid(wallet_canister.bitcoin_send(req))
            result = {"txid": txid}

        elif func_name == "send_ethereum":
            destination = args["destinationAddress"]
            amount_token = Decimal(str(args["amount"]))
            amount_smallest = to_smallest("ETH", amount_token)
            tx_hash = unwrap_candid(wallet_canister.ethereum_send(destination, amount_smallest))
            result = {"txid": tx_hash}

        elif func_name == "send_solana":
            destination = args["destinationAddress"]
            amount_token = Decimal(str(args["amount"]))
            amount_smallest = to_smallest("SOL", amount_token)
            sig = unwrap_candid(wallet_canister.solana_send(destination, amount_smallest))
            result = {"txid": sig}

        elif func_name == "send_icp":
            destination = args["destinationAddress"]
            amount_token = Decimal(str(args["amount"]))
            amount_smallest = to_smallest("ICP", amount_token)
            send_res = unwrap_candid(wallet_canister.icp_send(destination, amount_smallest))
            if isinstance(send_res, dict) and "Ok" in send_res:
                result = {"block_index": send_res["Ok"]}
            elif isinstance(send_res, dict) and "Err" in send_res:
                raise Exception(str(send_res["Err"]))
            else:
                result = send_res

        elif func_name == "best_market_price":
            # Accept either explicit coin_symbol or split pair from coin_from/coin_to
            coin_symbol = args.get("coin_symbol")
            if not coin_symbol:
                coin_from = str(args.get("coin_from", "")).strip().upper()
                coin_to = str(args.get("coin_to", "")).strip().upper()
                if coin_from and coin_to:
                    coin_symbol = f"{coin_from}/{coin_to}"
            side = (args.get("side") or "").lower()
            amount = args.get("amount")
            if not coin_symbol:
                raise ValueError("Missing trading pair. Provide coin_from and coin_to (e.g., BTC and USDT).")
            if side not in {"buy", "sell"}:
                raise ValueError("Invalid side. Use 'buy' or 'sell'.")
            if amount is None:
                raise ValueError("Missing amount for best_market_price.")

            payload = {"symbol": coin_symbol, "side": side, "amount": float(amount), "amount_usd": []}
            ctx.logger.info(f"[best_market_price] payload: {payload}")
            result = unwrap_candid(ai_canister.predict_trade_cost(payload))
            ctx.logger.info(f"Result: {result}")

        elif func_name == "get_coin_price":
            result = await get_crypto_price(ctx, args["coin_type"], args["amount"])
            ctx.logger.info(f"Result: {result}")

        elif func_name == "get_bitcoin_balance":
            address_raw = wallet_canister.bitcoin_address()
            address = unwrap_candid(address_raw)
            raw_balance = wallet_canister.bitcoin_balance(address)  # satoshi
            balance_smallest = unwrap_candid(raw_balance)
            balance_readable = to_amount("BTC", balance_smallest)
            try:
                price_usd = await get_crypto_price(ctx, "BTC", float(balance_readable or 0))
            except Exception:
                price_usd = "$0.00"
            result = {
                "balance": balance_readable,
                "price_usd": price_usd,
            }
        elif func_name == "get_ethereum_balance":
            address_raw = wallet_canister.ethereum_address()
            address = unwrap_candid(address_raw)
            raw_balance = wallet_canister.ethereum_balance(address)  # wei (string)
            balance_smallest = unwrap_candid(raw_balance)
            balance_readable = to_amount("ETH", balance_smallest)
            try:
                price_usd = await get_crypto_price(ctx, "ETH", float(balance_readable or 0))
            except Exception:
                price_usd = "$0.00"
            result = {
                "balance": balance_readable,
                "price_usd": price_usd,
            }
        elif func_name == "get_solana_balance":
            address_raw = wallet_canister.solana_address()
            address = unwrap_candid(address_raw)
            raw_balance = wallet_canister.solana_balance(address)  # lamports (Nat)
            balance_smallest = unwrap_candid(raw_balance)
            balance_readable = to_amount("SOL", balance_smallest)
            try:
                price_usd = await get_crypto_price(ctx, "SOL", float(balance_readable or 0))
            except Exception:
                price_usd = "$0.00"
            result = {
                "balance": balance_readable,
                "price_usd": price_usd,
            }

        elif func_name == "get_icp_balance":
            raw_balance = icp_ledger_canister.icrc1_balance_of({"owner": get_principal_for_sender(ctx), "subaccount": []})
            e8s_value = unwrap_candid(raw_balance)
            balance_readable = to_amount("ICP", e8s_value)
            try:
                price_usd = await get_crypto_price(ctx, "ICP", float(balance_readable or 0))
            except Exception:
                price_usd = "$0.00"
            result = {
                "balance": balance_readable,
                "price_usd": price_usd,
            }

        elif func_name == "get_bitcoin_address":
            result = {
                "address": unwrap_candid(wallet_canister.bitcoin_address()),
                "network": (networks.get("bitcoin") if isinstance(networks, dict) else None) or "unknown",
                "explorer": _explorer_address_url("BTC", (networks or {}).get("bitcoin", ""), unwrap_candid(wallet_canister.bitcoin_address())),
            }
        elif func_name == "get_ethereum_address":
            result = {
                "address": unwrap_candid(wallet_canister.ethereum_address()),
                "network": (networks.get("ethereum") if isinstance(networks, dict) else None) or "unknown",
                "explorer": _explorer_address_url("ETH", (networks or {}).get("ethereum", ""), unwrap_candid(wallet_canister.ethereum_address())),
            }
        elif func_name == "get_solana_address":
            result = {
                "address": unwrap_candid(wallet_canister.solana_address()),
                "network": (networks.get("solana") if isinstance(networks, dict) else None) or "unknown",
                "explorer": _explorer_address_url("SOL", (networks or {}).get("solana", ""), unwrap_candid(wallet_canister.solana_address())),
            }
        elif func_name == "get_icp_address":
            result = {
                "address": get_principal_for_sender(ctx),
                "network": (networks.get("icp") if isinstance(networks, dict) else None) or "unknown",
                "explorer": _explorer_address_url("ICP", (networks or {}).get("icp", ""), get_principal_for_sender(ctx)),
            }
        elif func_name == "create_stripe_checkout":
            # Create a payment link to purchase a coin using fiat
            coin_type = (args["coin_type"] or "").lower()
            destination = args["destinationAddress"]
            amount_usd = args.get("amount_usd")
            # Convert USD to cents
            amount_cents = int(Decimal(str(amount_usd)) * 100)
            order_id = str(uuid4())
            session = create_checkout_session(
                order_id=order_id,
                coin_type=coin_type,
                amount_minor=amount_cents,
                destination_address=destination
            )
            result = {
                "order_id": order_id,
                "checkout_url": session.get("url")
            }
        else:
            raise ValueError(f"Unsupported function call: {func_name}")
        
        return result
    except Exception as e:
        raise Exception(f"ICP canister call failed: {str(e)}")

async def process_query(query: str, ctx: Context) -> str:
    try:
        # Short-circuit: handle pending transfer confirmation flow first
        pending = _get_pending_transfer_for_sender(ctx)
        if pending:
            user_answer = (query or "").strip().lower()
            if user_answer == "yes":
                try:
                    # Special-case: buy flow should create Stripe session, not call canister
                    if pending.get("func_name") == "buy_crypto":
                        normalized = pending.get("args", {})
                        coin_type = (normalized.get("coin_type") or "").lower()
                        token_amount = normalized.get("amount")
                        # Derive destination address from user's own wallet
                        wallet_canister = make_canister("wallet", get_private_key_for_sender(ctx))
                        if coin_type.upper() == "BTC":
                            destination = unwrap_candid(wallet_canister.bitcoin_address())
                        elif coin_type.upper() == "ETH":
                            destination = unwrap_candid(wallet_canister.ethereum_address())
                        elif coin_type.upper() == "SOL":
                            destination = unwrap_candid(wallet_canister.solana_address())
                        elif coin_type.upper() == "ICP":
                            destination = get_principal_for_sender(ctx)
                        else:
                            destination = ""

                        # Estimate USD via get_crypto_price and create checkout
                        price_str = await get_crypto_price(ctx, coin_type.upper(), float(token_amount))
                        usd_value = Decimal(str(price_str).replace("$", "")) if isinstance(price_str, str) else Decimal(0)
                        amount_cents = int(usd_value * 100)
                        order_id = str(uuid4())
                        session = create_checkout_session(
                            order_id=order_id,
                            coin_type=coin_type,
                            amount_minor=amount_cents,
                            destination_address=destination,
                        )
                        checkout_url = session.get("url")
                        result_text = (
                            "Payment link has been created.\n"
                            f"Order ID: {order_id}\n"
                            f"Pay here: {checkout_url}\n"
                            "Note: the payment link will expire in 5 minutes."
                        )
                    else:
                        result = await call_endpoint(ctx, pending["func_name"], pending["args"])

                    _clear_pending_transfer_for_sender(ctx)
                    if pending.get("func_name") == "buy_crypto":
                        return result_text
                    else:
                        # Forward raw result JSON to ASI1 for nicer final formatting
                        try:
                            formatting_messages = [
                                {"role": "system", "content": "You are a helpful assistant. Format the following blockchain transfer result JSON into a concise, user-friendly confirmation with key details like transaction id or block index."},
                                {"role": "user", "content": f"Transfer result JSON: {json.dumps(result)}"},
                            ]
                            formatting_payload = {
                                "model": "asi1-mini",
                                "messages": formatting_messages,
                                "temperature": 0.3,
                                "max_tokens": 256,
                            }
                            formatting_response = requests.post(
                                f"{ASI1_BASE_URL}/chat/completions",
                                headers=ASI1_HEADERS,
                                json=formatting_payload,
                            )
                            formatting_response.raise_for_status()
                            formatting_json = formatting_response.json()
                            return formatting_json["choices"][0]["message"]["content"]
                        except Exception:
                            return json.dumps(result)
                except Exception as e:
                    _clear_pending_transfer_for_sender(ctx)
                    return f"Transfer failed: {str(e)}"
            else:
                _clear_pending_transfer_for_sender(ctx)
                # Do not return a cancellation message; continue normal processing

        # If the user greets (in many languages/variants), return help message directly
        if is_greeting(query or ""):
            return help_message

        # Step 1: Initial call to ASI1 with user query and tool
        user_message = {
            "role": "user",
            "content": query
        }
        payload = {
            "model": "asi1-mini",
            "messages": [user_message],
            "tools": tools,
            "temperature": 0.2,
            "max_tokens": 1024
        }
        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload
        )
        response.raise_for_status()
        response_json = response.json()

        ctx.logger.info(f"Response: {response_json}")

        # Step 2: Parse tool calls from response
        tool_calls = response_json["choices"][0]["message"].get("tool_calls", [])
        messages_history = [user_message, response_json["choices"][0]["message"]]

        if not tool_calls:
            return welcome_message

        # Step 3: Intercept transfer tools for confirmation; otherwise execute tools
        for tool_call in tool_calls:
            func_name = tool_call["function"]["name"]
            arguments = json.loads(tool_call["function"]["arguments"])
            tool_call_id = tool_call["id"]

            is_send = func_name in {"send_solana", "send_ethereum", "send_bitcoin", "send_icp"}
            is_buy = func_name in {"buy_crypto", "create_stripe_checkout"}
            if is_send:
                # Save pending transfer and ask for confirmation
                _set_pending_transfer_for_sender(ctx, {"func_name": func_name, "args": arguments})

                network_map = {
                    "send_bitcoin": ("Bitcoin", "BTC"),
                    "send_ethereum": ("Ethereum", "ETH"),
                    "send_solana": ("Solana", "SOL"),
                    "send_icp": ("ICP", "ICP"),
                }
                network_name, symbol = network_map.get(func_name, ("Unknown", ""))
                destination = arguments.get("destinationAddress", "-")
                amount_display = arguments.get("amount", "-")

                confirmation_text = (
                    "Please confirm your transfer request.\n\n"
                    "Do you want to proceed sending to this address? Estimated confirmation is 3 blocks and the fee is static. "
                    "Type 'yes' to proceed, or type anything else to cancel.\n\n"
                    f"- Network: {network_name}\n"
                    f"- Destination: {destination}\n"
                    f"- Amount: {amount_display} {symbol}\n"
                    "- Estimated confirmations: 3 blocks\n"
                    "- Estimated fee: 0.0001\n"
                )
                return confirmation_text
            elif is_buy:
                ctx.logger.info(f"[buy_check] buy flow")
                # Normalize arguments for buy flow (coinType, amount in token units)
                if func_name == "buy_crypto":
                    normalized_args = {
                        "coin_type": (arguments.get("coinType") or "").lower(),
                        "amount": arguments.get("amount"),
                    }
                else:
                    normalized_args = arguments

                coin_type = (normalized_args.get("coin_type") or "").upper()
                token_amount = normalized_args.get("amount")
                # Fallback: if amount in token not provided, derive from amount_usd
                if (token_amount is None or token_amount == "") and normalized_args.get("amount_usd") is not None:
                    try:
                        usd_num = Decimal(str(normalized_args.get("amount_usd")))
                        price_num = get_price_usd_number(coin_type.lower())
                        if price_num and price_num > 0:
                            token_amount = (usd_num / price_num)
                            ctx.logger.info(f"[buy_check] derived token_amount from USD: usd={usd_num} price={price_num} -> token_amount={token_amount}")
                    except Exception:
                        token_amount = None

                # 0) Prevent insufficient canister inventory before proceeding
                desired_e_smallest = None
                if token_amount is not None and str(token_amount) != "":
                    try:
                        amt_dec = Decimal(str(token_amount))
                        ctx.logger.info(f"[buy_check] pre-convert: token_amount={token_amount} type={type(token_amount)} dec={amt_dec}")
                        desired_e_smallest = to_smallest(coin_type, amt_dec)
                        ctx.logger.info(f"[buy_check] coin={coin_type} token_amount={token_amount} desired_smallest={desired_e_smallest}")
                    except Exception as ex:
                        ctx.logger.info(f"[buy_check] to_smallest failed: coin={coin_type} amount={token_amount} err={ex}")
                        desired_e_smallest = None

                ctx.logger.info(f"[buy_check] desired_e_smallest={desired_e_smallest}")
                ctx.logger.info(f"[buy_check] token_amount={token_amount}")
                ctx.logger.info(f"[buy_check] coin_type={coin_type}")

                if desired_e_smallest is not None and desired_e_smallest > 0:
                    available_smallest = 0
                    try:
                        wallet_canister = make_canister("wallet", get_private_key_for_sender(ctx))
                        balances_raw = wallet_canister.canister_wallet_balance()
                        balances = unwrap_candid(balances_raw) or {}
                        ctx.logger.info(f"[buy_check] balances={balances}")
                        if coin_type == "BTC":
                            available_smallest = int(balances.get("bitcoin", 0))
                        elif coin_type == "ETH":
                            # ethereum balance stored as string (wei)
                            available_smallest = int(balances.get("ethereum", "0") or 0)
                        elif coin_type == "SOL":
                            available_smallest = int(balances.get("solana", 0))
                        elif coin_type == "ICP":
                            available_smallest = int(balances.get("icp", 0))
                        ctx.logger.info(f"[buy_check] available_smallest={available_smallest}")
                    except Exception:
                        # Treat unknown balance as zero to be safe
                        available_smallest = 0

                    if desired_e_smallest > available_smallest:
                        ctx.logger.info(f"[buy_check] insufficient: desired={desired_e_smallest} available={available_smallest}")
                        return (
                            "Sorry, the canister balance is not sufficient to fulfill your purchase.\n"
                            f"- Asset: {coin_type}\n"
                            f"- Requested: {token_amount} {coin_type}\n"
                            f"- Available: {to_amount(coin_type, available_smallest)} {coin_type}\n"
                            "Please reduce the amount or try another asset."
                        )

                _set_pending_transfer_for_sender(ctx, {"func_name": "buy_crypto", "args": normalized_args})

                # Derive user's own wallet address for the asset
                try:
                    if coin_type == "BTC":
                        destination = unwrap_candid(wallet_canister.bitcoin_address())
                    elif coin_type == "ETH":
                        destination = unwrap_candid(wallet_canister.ethereum_address())
                    elif coin_type == "SOL":
                        destination = unwrap_candid(wallet_canister.solana_address())
                    elif coin_type == "ICP":
                        destination = get_principal_for_sender(ctx)
                    else:
                        destination = "-"
                except Exception:
                    destination = "-"

                estimated_price_text = "Unavailable"
                try:
                    if token_amount is not None:
                        estimated_price_text = await get_crypto_price(ctx, coin_type, float(token_amount))
                except Exception:
                    estimated_price_text = "Unavailable"

                confirmation_text = (
                    "Please confirm your purchase request.\n\n"
                    "Do you want to proceed to create a payment link? "
                    "Type 'yes' to proceed, or type anything else to cancel.\n\n"
                    f"- Asset: {coin_type}\n"
                    f"- Destination: {destination}\n"
                    f"- Amount: {token_amount} {coin_type}\n"
                    f"- Estimated price to pay (USD): {estimated_price_text}\n"
                )
                return confirmation_text

            # Non-transfer tool: execute immediately
            try:
                if func_name == "buy_crypto" and _get_pending_transfer_for_sender(ctx):
                    # If user confirmed "yes", create the checkout session now
                    # Convert token amount to USD cents using price utility
                    coin_type = (arguments.get("coinType") or arguments.get("coin_type") or "").lower()
                    token_amount = arguments.get("amount")
                    # Derive destination address from user's own wallet
                    wallet_canister = make_canister("wallet", get_private_key_for_sender(ctx))
                    if coin_type.upper() == "BTC":
                        destination = unwrap_candid(wallet_canister.bitcoin_address())
                    elif coin_type.upper() == "ETH":
                        destination = unwrap_candid(wallet_canister.ethereum_address())
                    elif coin_type.upper() == "SOL":
                        destination = unwrap_candid(wallet_canister.solana_address())
                    elif coin_type.upper() == "ICP":
                        destination = get_principal_for_sender(ctx)
                    else:
                        destination = ""
                    # Estimate USD via get_crypto_price (string like "$123.45"). Fallback handled server-side.
                    price_str = await get_crypto_price(ctx, coin_type.upper(), float(token_amount))
                    usd_value = Decimal(str(price_str).replace("$", "")) if isinstance(price_str, str) else Decimal(0)
                    amount_cents = int(usd_value * 100)
                    order_id = str(uuid4())
                    session = create_checkout_session(
                        order_id=order_id,
                        coin_type=coin_type,
                        amount_minor=amount_cents,
                        destination_address=destination,
                    )
                    result = {
                        "order_id": order_id,
                        "checkout_url": session.get("url"),
                    }
                else:
                    result = await call_endpoint(ctx, func_name, arguments)
                    content_to_send = json.dumps(result)
            except Exception as e:
                ctx.logger.error(f"Error executing tool: {str(e)}")
                error_content = {
                    "error": f"Tool execution failed: {str(e)}",
                    "status": "failed"
                }
                content_to_send = json.dumps(error_content)

            tool_result_message = {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": content_to_send
            }
            messages_history.append(tool_result_message)

        # Step 4: Send results back to ASI1 for final answer
        final_payload = {
            "model": "asi1-mini",
            "messages": messages_history,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        final_response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=final_payload
        )
        final_response.raise_for_status()
        final_response_json = final_response.json()

        # Step 5: Return the model's final answer
        return final_response_json["choices"][0]["message"]["content"]

    except Exception as e:
        ctx.logger.error(f"Error processing query: {str(e)}")
        return f"An error occurred while processing your request: {str(e)}"

chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(model=ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    try:
        ctx.sender = sender

        # send the acknowledgement for receiving the message
        ack = ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc),
            acknowledged_msg_id=msg.msg_id
        )
        await ctx.send(sender, ack)

        for item in msg.content:
            if isinstance(item, StartSessionContent):
                ctx.logger.info(f"Got a start session message from {sender}")

                principal, priv_b64, pub_b64 = generate_ed25519_identity()

                identities = ctx.storage.get("identity") or []
                if not isinstance(identities, list):
                    identities = [identities]

                already_exists = any(
                    isinstance(item, dict) and item.get("sender") == sender
                    for item in identities
                )

                if already_exists:
                    ctx.logger.info(f"Identity already exists for {sender}")
                    continue

                identities.append({
                    "principal": principal,
                    "private_key": priv_b64,
                    "public_key": pub_b64,
                    "sender": sender
                })
                ctx.storage.set("identity", identities)

                continue
            elif isinstance(item, TextContent):
                response_text = await process_query(item.text, ctx)
                ctx.logger.info(f"Response text: {response_text}")
                response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=response_text)]
                )
                await ctx.send(sender, response)
            else:
                ctx.logger.info(f"Got unexpected content from {sender}")
    except Exception as e:
        ctx.logger.error(f"Error handling chat message: {str(e)}")
        error_response = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=f"An error occurred: {str(e)}")]
        )
        await ctx.send(sender, error_response)

@chat_proto.on_message(model=ChatAcknowledgement)
async def handle_chat_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"[handle_chat_acknowledgement] Received acknowledgement from {sender} for message {msg.acknowledged_msg_id}")
    if msg.metadata:
        ctx.logger.info(f"Metadata: {msg.metadata}")
