import re
import unicodedata


def normalize_text_basic(text: str) -> str:
    """Normalize text for lightweight matching while preserving unicode letters and emojis."""
    try:
        normalized = unicodedata.normalize("NFKC", text or "")
    except Exception:
        normalized = text or ""
    lowered = normalized.lower()
    lowered = re.sub(r"[\t\n\r]+", " ", lowered)
    lowered = re.sub(r"[\-_.!,;:()?\[\]{}<>\"'`~@#$%^&*+=/\\|]+", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


_GREETING_PATTERNS = [
    r"\b(hi|hii+|hello|helo|hey|yo|sup|what'?s\s*up|wass?up|howdy|greetings)\b",
    r"\b(gm|good\s+morning|good\s+afternoon|good\s+evening|good\s+night)\b",
    r"\b(hola|buenas?|bonjour|salut|ciao|hallo|guten\s+(tag|morgen|abend)|servus|gr[uü]ezi|gr[uü][sß]\s*gott)\b",
    r"\b(hej|hejsan|hei|moi|terve|hall[aå]|hej\s+hej)\b",
    r"\b(ola|ol[aá]|bom\s+dia|boa\s+tarde|boa\s+noite)\b",
    r"\b(namaste|namaskar)\b",
    r"\b(salam|ass?ala?m\s*alaikum|as[- ]?salamu[- ]?alaykum|shalom)\b",
    r"\b(merhaba|marhaba|ahlan)\b",
    r"\b(privet|zdras?tvu?y(?:te|те)?|dobry[yi]\s+den)\b",
    r"\b(konn?ichiwa|ohay[oō]|moshi\s+moshi)\b",
    r"\b(ni\s*hao|n[iǐ]\s*h[aǎ]o)\b",
    r"\b(ann?yeong|anyeong|annyeonghaseyo)\b",
    r"\b(xin\s*ch[aá]o|ch[aà]o)\b",
    r"\b(sawasdee|sawadee|sawatdee|sabaidee)\b",
    r"\b(hai|halo|hallo|apa\s*kabar|selamat\s+(pagi|siang|sore|malam))\b",
]

_GREETING_KEYWORDS = {
    "hi", "hii", "hello", "helo", "hey", "yo", "sup", "howdy", "gm",
    "hola", "bonjour", "salut", "ciao", "hallo", "hej", "hei", "moi",
    "ola", "olá", "namaste", "salam", "shalom", "merhaba", "privet",
    "konnichiwa", "ohayo", "moshi", "ni", "hao", "annyeong", "xin",
    "chao", "sawasdee", "sawadee", "sawatdee", "sabaidee", "hai", "halo",
}


def is_greeting(text: str) -> bool:
    """Return True if the text looks like a greeting in various languages/variants."""
    if not text:
        return False
    if "👋" in text:
        return True
    normalized = normalize_text_basic(text)
    if not normalized:
        return False
    for pattern in _GREETING_PATTERNS:
        if re.search(pattern, normalized, flags=re.IGNORECASE | re.UNICODE):
            return True
    tokens = normalized.split()
    if len(tokens) <= 6 and any(tok in _GREETING_KEYWORDS for tok in tokens):
        return True
    if tokens and tokens[0] in _GREETING_KEYWORDS:
        return True
    return False


