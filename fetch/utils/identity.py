import base64, hashlib, struct, zlib, re
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_der_private_key, Encoding, PrivateFormat, NoEncryption
from ic.identity import Identity
from ic.principal import Principal

def text_encode_principal(principal_bytes: bytes) -> str:
    crc = zlib.crc32(principal_bytes) & 0xFFFFFFFF
    data = struct.pack(">I", crc) + principal_bytes  # CRC32 big-endian
    b32 = base64.b32encode(data).decode("ascii").lower().rstrip("=")
    return "-".join(b32[i:i+5] for i in range(0, len(b32), 5))

def principal_from_der_pubkey(der_pubkey: bytes) -> str:
    body = b"\x02" + hashlib.sha224(der_pubkey).digest()
    return text_encode_principal(body)

def _normalize_privkey_to_hex(priv_key: str) -> str:
    """Accept private key in forms of:
    - hex (direct)
    - PEM (with header) PKCS8
    - base64 body from PEM PKCS8 (without header)
    and return 32-byte hex (Ed25519 Raw).
    """
    s = (priv_key or "").strip()
    # If already a valid hex
    if re.fullmatch(r"[0-9a-fA-F]+", s) and len(s) % 2 == 0:
        return s.lower()
    # If the string contains a PEM header
    if "-----BEGIN" in s:
        key = load_pem_private_key(s.encode("utf-8"), password=None)
        raw = key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
        return raw.hex()
    # Try to assume base64 body (DER PKCS8)
    try:
        der = base64.b64decode(s)
        key = load_der_private_key(der, password=None)
        raw = key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
        return raw.hex()
    except Exception:
        pass
    raise ValueError("Unsupported private key format. Provide hex, PEM, or base64 PKCS8 body.")

def _normalize_privkey_to_hex(priv_key: str) -> str:
    """Accept private key in forms of:
    - hex (direct)
    - PEM (with header) PKCS8
    - base64 body from PEM PKCS8 (without header)
    and return 32-byte hex (Ed25519 Raw).
    """
    s = (priv_key or "").strip()
    # If already a valid hex
    if re.fullmatch(r"[0-9a-fA-F]+", s) and len(s) % 2 == 0:
        return s.lower()
    # If the string contains a PEM header
    if "-----BEGIN" in s:
        key = load_pem_private_key(s.encode("utf-8"), password=None)
        raw = key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
        return raw.hex()
    # Try to assume base64 body (DER PKCS8)
    try:
        der = base64.b64decode(s)
        key = load_der_private_key(der, password=None)
        raw = key.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())
        return raw.hex()
    except Exception:
        pass
    raise ValueError("Unsupported private key format. Provide hex, PEM, or base64 PKCS8 body.")

def generate_ed25519_identity():
    sk = ed25519.Ed25519PrivateKey.generate()

    priv_pem = sk.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    priv_b64 = "".join(l for l in priv_pem.splitlines() if not l.startswith("-----"))

    priv_hex = _normalize_privkey_to_hex(priv_b64)
    ic_identity = Identity(privkey=priv_hex)
    der_pubkey, _ = ic_identity.sign(b"probe")
    principal = Principal.self_authenticating(der_pubkey).to_str()
    der_pubkey_b64 = base64.b64encode(der_pubkey).decode("ascii")

    return principal, priv_b64, der_pubkey_b64

if __name__ == "__main__":
    ptxt, priv_pem, priv_b64, der_pub = generate_ed25519_identity()
    print("script principal:", ptxt)
