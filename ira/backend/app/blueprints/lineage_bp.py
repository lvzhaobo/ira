from pathlib import Path

from app.json_store import read_json, write_json
from app.trace_util import new_trace_id
from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("lineage", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


def append_trace_record(record: dict) -> None:
    path = _data("traces.json")
    data = read_json(path, {"traces": []})
    data["traces"].insert(0, record)
    write_json(path, data)


@bp.route("/lineage/traces/<trace_id>", methods=["GET"])
def lineage_get_trace(trace_id: str):
    data = read_json(_data("traces.json"), {"traces": []})
    for t in data["traces"]:
        if t.get("trace_id") == trace_id:
            return jsonify(t)
    return jsonify({"error": {"code": "NOT_FOUND", "message": trace_id}}), 404


@bp.route("/lineage/search", methods=["GET"])
def lineage_search():
    q = (request.args.get("q") or "").lower()
    limit = int(request.args.get("limit") or 20)
    data = read_json(_data("traces.json"), {"traces": []})
    items = []
    for t in data["traces"]:
        summary = (t.get("summary") or "").lower()
        tid = t.get("trace_id", "")
        if not q or q in summary or q in tid.lower():
            items.append(
                {
                    "trace_id": t.get("trace_id"),
                    "summary": t.get("summary", ""),
                    "artifact_type": t.get("artifact_type", ""),
                    "created_at": t.get("created_at", ""),
                }
            )
        if len(items) >= limit:
            break
    return jsonify({"items": items})
