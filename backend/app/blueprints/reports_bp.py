from datetime import date
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request

from app.json_store import read_json, write_json

bp = Blueprint("reports", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


@bp.route("/reports/drafts", methods=["GET"])
def reports_drafts():
    data = read_json(_data("report_drafts.json"), {"items": []})
    return jsonify(data)


@bp.route("/reports/drafts/<draft_id>", methods=["GET", "PATCH"])
def reports_draft_one(draft_id: str):
    path = _data("report_drafts.json")
    data = read_json(path, {"items": []})
    items = data.get("items", [])
    idx = next((i for i, x in enumerate(items) if x.get("id") == draft_id), None)
    if idx is None:
        return jsonify({"error": {"code": "NOT_FOUND", "message": draft_id}}), 404

    if request.method == "GET":
        return jsonify(items[idx])

    body = request.get_json(force=True, silent=True) or {}
    row = items[idx]
    for k in (
        "workflow_stage",
        "compliance_status",
        "owner",
        "reviewer",
        "title",
    ):
        if k in body and body[k] is not None:
            row[k] = body[k]
    row["updated_at"] = date.today().isoformat()
    write_json(path, data)
    return jsonify(row)
