from flask import g, jsonify


def error_response(code: str, message: str, http_status: int):
    body = {"error": {"code": code, "message": message}}
    tid = getattr(g, "trace_id", None)
    if tid:
        body["error"]["trace_id"] = tid
    return jsonify(body), http_status
