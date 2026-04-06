from datetime import datetime, timezone
from pathlib import Path

from app.json_store import read_json, write_json
from app.services.bailian_qa import bailian_config, is_bailian_enabled
from app.services.copaw_multi_agent_adapter import copaw_ma_enabled
from app.services.copaw_qa_adapter import copaw_bridge_status
from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("system", __name__)


def _prefs_path() -> Path:
    return Path(current_app.config["DATA_DIR"]) / "workspace_preferences.json"


def _data(name: str) -> Path:
    return Path(current_app.config["DATA_DIR"]) / name


@bp.route("/system/health", methods=["GET"])
def system_health():
    live = is_bailian_enabled()
    cfg = bailian_config()
    return jsonify(
        {
            "ok": True,
            "ruleset_version": "rules-v1.0.0",
            "index_ver": "v2.3.0",
            "mock_quote": True,
            "copaw_bridge": copaw_bridge_status(),
            "copaw_multi_agent": "configured" if copaw_ma_enabled() else "disabled",
            "research_qa_llm": {
                "enabled": live,
                "provider": "dashscope" if live else None,
                "model": cfg["model"] if live else None,
            },
        }
    )


@bp.route("/system/ops/summary", methods=["GET"])
def system_ops_summary():
    runs = read_json(_data("multi_agent_runs.json"), {"runs": []}).get("runs", [])
    deliveries = read_json(_data("notify_deliveries.json"), {"items": []}).get("items", [])
    pending_reviews = sum(1 for r in runs if str(r.get("review_status") or "pending").lower() == "pending")
    approved_reviews = sum(1 for r in runs if str(r.get("review_status") or "").lower() == "approved")
    rejected_reviews = sum(1 for r in runs if str(r.get("review_status") or "").lower() == "rejected")
    sent_count = sum(1 for d in deliveries if d.get("status") == "sent")
    pending_dispatch_count = sum(1 for d in deliveries if d.get("status") == "pending")
    return jsonify(
        {
            "multi_agent": {
                "total_runs": len(runs),
                "pending_reviews": pending_reviews,
                "approved_reviews": approved_reviews,
                "rejected_reviews": rejected_reviews,
            },
            "notify": {
                "total_deliveries": len(deliveries),
                "sent_count": sent_count,
                "pending_dispatch_count": pending_dispatch_count,
            },
        }
    )


@bp.route("/system/settings", methods=["GET"])
def system_settings():
    prefs = read_json(_prefs_path(), {})
    return jsonify(
        {
            "api_base": "/api/v1",
            "mock_quote": True,
            "build": "ira-workshop-dev",
            "data_classification": "演示数据 · 不得用于投资决策",
            "swagger_ui_path": "/api/docs",
            "openapi_spec_path": "/api/v1/openapi.json",
            "preferences": prefs,
        }
    )


@bp.route("/system/preferences", methods=["PUT"])
def system_preferences_put():
    body = request.get_json(force=True, silent=True) or {}
    cur = read_json(_prefs_path(), {})
    for k in ("default_route", "show_workshop_panel", "reports_default_filter_stage", "show_research_qa_mvp_nav"):
        if k in body:
            cur[k] = body[k]
    cur["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_json(_prefs_path(), cur)
    return jsonify(cur)
