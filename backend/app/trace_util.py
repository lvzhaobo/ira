import secrets


def new_trace_id(prefix: str = "tr") -> str:
    return f"{prefix}_{secrets.token_hex(8)}"
