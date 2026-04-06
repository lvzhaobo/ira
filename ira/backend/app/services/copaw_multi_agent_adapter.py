"""
CoPaw Multi-Agent Adapter（可选接入）

目标：在不改变 `/research/stock/multi-agent/run` 外部契约的前提下，
优先尝试 CoPaw 多 Agent 编排；不可用时回退本地 mock 编排。
"""

from __future__ import annotations

import os
from typing import Any

import requests


def copaw_ma_config() -> dict[str, Any]:
    return {
        "run_url": os.environ.get("IRA_COPAW_MA_RUN_URL", "").strip(),
        "base_url": os.environ.get("IRA_COPAW_BASE_URL", "").strip(),
        "api_token": os.environ.get("IRA_COPAW_API_TOKEN", "").strip(),
        "timeout_sec": float(os.environ.get("IRA_COPAW_TIMEOUT_SEC", "20")),
    }


def copaw_ma_enabled() -> bool:
    cfg = copaw_ma_config()
    return bool(cfg["run_url"] or cfg["base_url"])


def _pick_text(data: dict[str, Any], *keys: str) -> str | None:
    for k in keys:
        v = data.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def copaw_multi_agent_run_or_none(
    *,
    symbol: str,
    trace_id: str,
    market_snapshot_id: str | None,
    mock: bool,
) -> dict[str, Any] | None:
    """
    期望返回（尽量对齐现有前端消费）：
    {
      merged_text: str,
      discussion: list,
      agents: list,
      messages: list,
      orchestration_trace: str,
      merge_trace: str,
      compliance: dict
    }
    """
    cfg = copaw_ma_config()
    if not copaw_ma_enabled():
        return None

    url = cfg["run_url"] or (cfg["base_url"].rstrip("/") + "/skills/ira_stock_multi_agent/run")
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if cfg["api_token"]:
        headers["Authorization"] = f"Bearer {cfg['api_token']}"

    payload = {
        "symbol": symbol,
        "trace_id": trace_id,
        "market_snapshot_id": market_snapshot_id,
        "mock": mock,
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=cfg["timeout_sec"])
    except requests.RequestException:
        return None
    if r.status_code != 200:
        return None
    try:
        data = r.json()
    except Exception:
        return None
    if not isinstance(data, dict):
        return None

    merged = _pick_text(data, "merged_text", "content", "answer")
    discussion = data.get("discussion")
    if not merged or not isinstance(discussion, list):
        return None

    out: dict[str, Any] = {
        "merged_text": merged,
        "discussion": discussion,
        "agents": data.get("agents") if isinstance(data.get("agents"), list) else [],
        "messages": data.get("messages") if isinstance(data.get("messages"), list) else [],
        "orchestration_trace": _pick_text(data, "orchestration_trace", "trace_id"),
        "merge_trace": _pick_text(data, "merge_trace"),
        "compliance": data.get("compliance") if isinstance(data.get("compliance"), dict) else {},
    }
    return out
