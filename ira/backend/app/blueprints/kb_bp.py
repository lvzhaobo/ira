from pathlib import Path

from app.json_store import read_json
from flask import Blueprint, current_app, jsonify

bp = Blueprint("kb", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


@bp.route("/kb/index/status", methods=["GET"])
def kb_index_status():
    return jsonify({"index_ver": "v2.3.0", "updated_at": "2026-04-02T00:00:00+00:00"})


@bp.route("/kb/documents", methods=["GET"])
def kb_documents():
    data = read_json(_data("kb_documents.json"), {"items": []})
    return jsonify(data)
