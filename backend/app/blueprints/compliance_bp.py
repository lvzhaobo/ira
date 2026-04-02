from pathlib import Path

from app.errors import error_response
from app.json_store import read_json, write_json
from app.services.compliance_service import scan_text
from app.trace_util import new_trace_id
from flask import Blueprint, current_app, g, jsonify, request

bp = Blueprint("compliance", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


@bp.route("/compliance/rules", methods=["GET"])
def compliance_rules():
    data = read_json(_data("rules.json"), {"ruleset_version": "rules-v1.0.0", "rules": []})
    return jsonify(data)


@bp.route("/compliance/scan", methods=["POST"])
def compliance_scan():
    body = request.get_json(force=True, silent=True) or {}
    text = body.get("text", "")
    ctx = body.get("context_trace_id")
    rules_data = read_json(_data("rules.json"), {"ruleset_version": "rules-v1.0.0", "rules": []})
    rules = rules_data.get("rules", [])
    hits = scan_text(text, rules)
    tid = new_trace_id("scan")
    blocked = len(hits) > 0
    block_entry = {
        "trace_id": tid,
        "rule_id": hits[0]["rule_id"] if hits else None,
        "summary": hits[0]["message"] if hits else "",
    }
    blocks = read_json(_data("compliance_blocks.json"), {"items": []})
    blocks["items"].insert(0, block_entry)
    write_json(_data("compliance_blocks.json"), blocks)
    return jsonify(
        {
            "trace_id": tid,
            "blocked": blocked,
            "hits": hits,
            "ruleset_version": rules_data.get("ruleset_version", "rules-v1.0.0"),
        }
    )


@bp.route("/compliance/blocks/recent", methods=["GET"])
def compliance_blocks_recent():
    data = read_json(_data("compliance_blocks.json"), {"items": []})
    return jsonify(data)
