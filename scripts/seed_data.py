"""Seed data/ JSON files for local dev. Run from repo root: python scripts/seed_data.py"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def write(name: str, obj: dict) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    p = DATA / name
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", p)


def main() -> None:
    write(
        "rules.json",
        {
            "ruleset_version": "rules-v1.0.0",
            "rules": [
                {"id": "R-G01", "layer": "L1", "title": "禁止个性化投资建议", "summary": ""},
                {"id": "R-G02", "layer": "L1", "title": "禁止承诺收益", "summary": ""},
                {"id": "R-D01", "layer": "L2", "title": "标注来源与时间", "summary": ""},
            ],
        },
    )
    write(
        "todos.json",
        {
            "items": [
                {"id": 1, "title": "复核消费行业周报草稿", "meta": "trace tr_…", "level": "amber"},
            ]
        },
    )
    write("kpi.json", {"sessions_today": 12, "pending_review": 3})
    write(
        "sessions_recent.json",
        {
            "items": [
                {
                    "trace_id": "tr_demo_001",
                    "type": "qa_answer",
                    "summary": "示例摘要",
                    "time": "10:22",
                    "review": "待复核",
                }
            ]
        },
    )
    write("traces.json", {"traces": []})
    write("watchlist.json", {"items": [{"keyword": "降准", "count": 12}]})
    write("alerts.json", {"items": []})
    write("notify_channels.json", {"items": [{"id": "ding", "name": "钉钉演示", "connected": True}]})
    write("notify_history.json", {"items": []})
    write("kb_documents.json", {"items": []})
    write("compliance_blocks.json", {"items": []})
    write("multi_agent_runs.json", {"runs": []})
    write(
        "report_drafts.json",
        {
            "items": [
                {
                    "id": "1",
                    "title": "消费行业周报-草稿",
                    "type": "行业",
                    "updated_at": "2026-04-02",
                    "status": "待复核",
                    "trace_id": "tr_rep_1",
                }
            ]
        },
    )
    (DATA / "uploads").mkdir(exist_ok=True)
    print("Done. Set IRA_DATA_DIR=%s when running Flask or use default." % DATA)


if __name__ == "__main__":
    main()
