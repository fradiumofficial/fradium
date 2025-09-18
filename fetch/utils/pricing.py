from decimal import Decimal
from typing import Optional, Tuple
import requests


TOKENS_CONFIG = {
    "BTC": {"id": "bitcoin", "symbol": "BTC"},
    "ETH": {"id": "ethereum", "symbol": "ETH"},
    "SOL": {"id": "solana", "symbol": "SOL"},
}

ALIASES = {
    # Bitcoin
    "BTC": "BTC",
    "BITCOIN": "BTC",
    # Ethereum
    "ETH": "ETH",
    "ETHEREUM": "ETH",
    "ETHER": "ETH",
    # Solana
    "SOL": "SOL",
    "SOLANA": "SOL",
}


def resolve_token_identifiers(raw_token: str) -> Tuple[Optional[str], Optional[str]]:
    """Resolve CoinGecko id and normalized symbol for a token.

    1) Use static mapping for common tokens (BTC/ETH/SOL)
    2) Otherwise, try CoinGecko search API to find an id by symbol/name
    3) Fallback to guessed id (lowercased, spaces->dashes) and uppercase symbol
    """
    if not raw_token:
        return None, None
    normalized = str(raw_token).strip()
    upper = normalized.upper()
    symbol = ALIASES.get(upper, upper)
    guessed_id = normalized.lower().replace(" ", "-")

    mapped = TOKENS_CONFIG.get(symbol)
    if mapped:
        return mapped.get("id"), mapped.get("symbol")

    # Try CoinGecko search endpoint
    try:
        resp = requests.get(
            "https://api.coingecko.com/api/v3/search",
            params={"query": normalized},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        coins = data.get("coins", [])
        chosen = None
        # Prefer exact symbol match (e.g., ETH) among results
        for c in coins:
            if str(c.get("symbol", "")).upper() == symbol:
                chosen = c
                break
        if not chosen and coins:
            # Otherwise prefer exact name match
            for c in coins:
                if str(c.get("name", "")).strip().lower() == normalized.lower():
                    chosen = c
                    break
        if not chosen and coins:
            chosen = coins[0]
        if chosen:
            resolved_id = chosen.get("id") or guessed_id
            resolved_symbol = str(chosen.get("symbol", symbol)).upper()
            return resolved_id, resolved_symbol
    except Exception:
        pass

    return guessed_id, symbol


def _format_usd_dynamic(usd_value: Decimal) -> str:
    if usd_value >= Decimal("0.01"):
        return f"${usd_value.quantize(Decimal('0.01')):.2f}"

    small = format(usd_value, 'f')
    if '.' in small:
        integer_part, frac_part = small.split('.', 1)
        frac_part = frac_part[:20]
        small = integer_part + ('.' + frac_part if frac_part else '')
        small = small.rstrip('0').rstrip('.')
    if not small:
        small = "0.00"
    return f"${small}"


def get_price_usd(coin_type: str, amount_in_token: float, logger=None) -> str:
    # Validate amount
    try:
        if amount_in_token is None:
            return "$0.00"
        amount_num = Decimal(str(amount_in_token))
        if amount_num <= 0:
            return "$0.00"
    except Exception:
        return "$0.00"

    # Resolve identifiers for general token support
    token_id, token_symbol = resolve_token_identifiers(coin_type)
    if not token_id or not token_symbol:
        return "$0.00"

    # Build endpoints
    url_coingecko = f"https://api.coingecko.com/api/v3/simple/price?ids={token_id}&vs_currencies=usd"
    url_cryptocompare = f"https://min-api.cryptocompare.com/data/price?fsym={token_symbol}&tsyms=USD"

    logger.info(f"URL ID: {url_coingecko}")
    logger.info(f"URL ID: {url_cryptocompare}")
    price_usd: Optional[Decimal] = None

    # Try CoinGecko first
    try:
        resp = requests.get(url_coingecko, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if logger:
            logger.info(f"Data: {data}")
        value = data.get(token_id, {}).get("usd")
        if value is None:
            raise ValueError("CoinGecko returned no USD price for id")
        price_usd = Decimal(str(value))
    except Exception:
        try:
            resp = requests.get(url_cryptocompare, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            value = data.get("USD")
            if value is None:
                return "$0.00"
            price_usd = Decimal(str(value))
        except Exception:
            return "$0.00"

    if price_usd is None or price_usd <= 0:
        return "$0.00"

    usd_value = amount_num * price_usd
    if usd_value <= 0:
        return "$0.00"

    return _format_usd_dynamic(usd_value)



def get_price_usd_number(coin_type: str):
    """Return the current price in USD for one unit of the given token.

    Returns Decimal or None on failure.
    """
    token_id, token_symbol = resolve_token_identifiers(coin_type)
    if not token_id or not token_symbol:
        return None

    url_coingecko = f"https://api.coingecko.com/api/v3/simple/price?ids={token_id}&vs_currencies=usd"
    url_cryptocompare = f"https://min-api.cryptocompare.com/data/price?fsym={token_symbol}&tsyms=USD"

    # Try CoinGecko first
    try:
        resp = requests.get(url_coingecko, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        value = data.get(token_id, {}).get("usd")
        if value is None:
            raise ValueError("CoinGecko returned no USD price for id")
        price_usd = Decimal(str(value))
        if price_usd > 0:
            return price_usd
    except Exception:
        pass

    # Fallback to CryptoCompare
    try:
        resp = requests.get(url_cryptocompare, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        value = data.get("USD")
        if value is None:
            return None
        price_usd = Decimal(str(value))
        if price_usd > 0:
            return price_usd
    except Exception:
        return None

    return None

