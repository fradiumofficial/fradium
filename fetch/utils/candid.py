def unwrap_candid(value):
    v = value
    # Unwrap list/tuple satu elemen berulang kali
    while isinstance(v, (list, tuple)) and len(v) == 1:
        v = v[0]
    # Unwrap Result
    if isinstance(v, dict):
        if "Ok" in v:
            return v["Ok"]
        if "Err" in v:
            raise Exception(f"Canister returned error: {v['Err']}")
    return v


