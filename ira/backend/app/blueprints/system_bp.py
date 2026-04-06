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
