import json
from pathlib import Path

import pytest
from app import create_app


@pytest.fixture
def app(tmp_path):
    rules = {
        "ruleset_version": "rules-v1.0.0",
        "rules": [
            {"id": "R-G01", "layer": "L1", "title": "禁个性化投资建议", "summary": ""},
            {"id": "R-G02", "layer": "L1", "title": "禁保本收益", "summary": ""},
        ],
    }
    (tmp_path / "rules.json").write_text(json.dumps(rules), encoding="utf-8")
    for name, payload in [
        ("traces.json", {"traces": []}),
        ("todos.json", {"items": []}),
        ("kpi.json", {"sessions_today": 1}),
        ("sessions_recent.json", {"items": []}),
        ("watchlist.json", {"items": [{"keyword": "降准", "count": 1}]}),
        ("alerts.json", {"items": []}),
        ("notify_channels.json", {"items": []}),
        ("notify_history.json", {"items": []}),
        ("kb_documents.json", {"items": []}),
        ("compliance_blocks.json", {"items": []}),
        ("multi_agent_runs.json", {"runs": []}),
        (
            "report_drafts.json",
            {
                "items": [
                    {
                        "id": "t1",
                        "title": "测试草稿",
                        "report_type": "周报",
                        "workflow_stage": "编制中",
                        "compliance_status": "未送审",
                        "updated_at": "2026-04-02",
                        "trace_id": "x",
                    }
                ]
            },
        ),
        ("workspace_preferences.json", {"default_route": "/workbench", "show_workshop_panel": True}),
    ]:
        (tmp_path / name).write_text(json.dumps(payload), encoding="utf-8")
    (tmp_path / "uploads").mkdir(exist_ok=True)

    app = create_app({"TESTING": True, "DATA_DIR": str(tmp_path)})
    return app


@pytest.fixture
def client(app):
    return app.test_client()
