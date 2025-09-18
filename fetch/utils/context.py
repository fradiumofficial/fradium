from uagents import Context


def get_private_key_for_sender(ctx: Context):
    identities = ctx.storage.get("identity") or []
    if not isinstance(identities, list):
        identities = [identities]
    for item in identities:
        if isinstance(item, dict) and item.get("sender") == ctx.sender:
            return item.get("private_key")
    return None

def get_principal_for_sender(ctx: Context):
    identities = ctx.storage.get("identity") or []
    if not isinstance(identities, list):
        identities = [identities]
    for item in identities:
        if isinstance(item, dict) and item.get("sender") == ctx.sender:
            return item.get("principal")
    return None


