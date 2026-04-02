from pathlib import Path

from flask import Blueprint, current_app, g, jsonify, request

from app.errors import error_response
from app.json_store import read_json, write_json
from app.services.compliance_service import scan_text
from app.trace_util import new_trace_id

bp = Blueprint("notify", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


@bp.route("/notify/channels", methods=["GET"])
def notify_channels_get():
    data = read_json(_data("notify_channels.json"), {"items": []})
    return jsonify(data)


@bp.route("/notify/channels", methods=["PUT"])
def notify_channels_put():
    body = request.get_json(force=True, silent=True) or {}
    write_json(_data("notify_channels.json"), body if "items" in body else {"items": []})
    return jsonify({"ok": True})


@bp.route("/notify/history", methods=["GET"])
def notify_history():
    data = read_json(_data("notify_history.json"), {"items": []})
    return jsonify(data)


@bp.route("/notify/push", methods=["POST"])
def notify_push():
    body = request.get_json(force=True, silent=True) or {}
    payload = body.get("payload", "")
    channel_id = body.get("channel_id", "default")
    source_trace = body.get("source_trace_id")
    subject = body.get("subject")
    rules_data = read_json(_data("rules.json"), {"rules": [], "ruleset_version": "rules-v1.0.0"})
    hits = scan_text(payload, rules_data.get("rules", []))
    if hits:
        return error_response("COMPLIANCE_BLOCK", hits[0]["message"], 400)
    tid = new_trace_id("tr")
    hist = read_json(_data("notify_history.json"), {"items": []})
    hist["items"].insert(
        0,
        {
            "trace_id": tid,
            "channel_id": channel_id,
            "payload": payload[:500],
            "source_trace_id": source_trace,
            "subject": (subject or "")[:200] or None,
        },
    )
    write_json(_data("notify_history.json"), hist)
    return jsonify(
        {"trace_id": tid, "delivery_status": "dry_run_ok", "dry_run": True}
    )
