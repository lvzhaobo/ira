"""
可选 CoPaw HTTP 桥接 — 与 `ira/backend/app/services/copaw_qa_adapter.py` 约定一致。

未配置 IRA_COPAW_QA_ASK_URL / IRA_COPAW_BASE_URL 时跳过，由百炼或离线演示承接。
"""

from __future__ import annotations

import os
from typing import Any

import requests


def copaw_config() -> dict[str, Any]:
    return {
        "ask_url": os.environ.get("IRA_COPAW_QA_ASK_URL", "").strip(),
        "base_url": os.environ.get("IRA_COPAW_BASE_URL", "").strip(),
        "api_token": os.environ.get("IRA_COPAW_API_TOKEN", "").strip(),
        "timeout_sec": float(os.environ.get("IRA_COPAW_TIMEOUT_SEC", "20")),
    }


def copaw_enabled() -> bool:
    c = copaw_config()
    return bool(c["ask_url"] or c["base_url"])


def copaw_ask_or_none(*, session_id: str, query: str) -> tuple[str | None, dict[str, Any] | None]:
    if not copaw_enabled():
        return None, None

    cfg = copaw_config()
    url = cfg["ask_url"] or (cfg["base_url"].rstrip("/") + "/skills/ira_qa_ask/run")
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if cfg["api_token"]:
        headers["Authorization"] = f"Bearer {cfg['api_token']}"

    payload = {
        "session_id": session_id,
        "query": query,
        "evidence_block": "",
        "spec_version": "ira-1.0.0",
        "require_risk_label": False,
        "trace_id": f"m01-{session_id}",
    }

    try:
        r = requests.post(url, json=payload, headers=headers, timeout=cfg["timeout_sec"])
    except requests.RequestException:
        return None, None

    if r.status_code != 200:
        return None, None

    try:
        data = r.json()
    except Exception:
        return None, None

    if not isinstance(data, dict):
        return None, None

    for k in ("answer", "content", "merged_text"):
        v = data.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip(), data

    return None, None
