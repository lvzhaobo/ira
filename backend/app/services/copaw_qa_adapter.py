"""
CoPaw QA Adapter（可选接入）

目标：在不破坏现有 `/research/qa/ask` 外部契约的前提下，
把“生成答案/证据/风控字段”替换为由 CoPaw workflow/agent 执行的结果。

由于本 Workshop 环境未强制嵌入 CoPaw 运行时：
- 未配置 CoPaw 时返回 `None`，由现有逻辑（bailian_qa / mock）继续工作；
- 配置完成后可逐步替换为真实 CoPaw 调用。
"""

from __future__ import annotations

import os
from typing import Any

import requests


def copaw_config() -> dict[str, Any]:
    return {
        # 完整 Skill URL（推荐：你们内部 CoPaw 的实际入口）
        "ask_url": os.environ.get("IRA_COPAW_QA_ASK_URL", "").strip(),
        # Base URL：用于拼接默认路径（若 ask_url 未提供）
        "base_url": os.environ.get("IRA_COPAW_BASE_URL", "").strip(),
        # 可选 token（若 CoPaw 需要鉴权）
        "api_token": os.environ.get("IRA_COPAW_API_TOKEN", "").strip(),
        "timeout_sec": float(os.environ.get("IRA_COPAW_TIMEOUT_SEC", "20")),
    }


def copaw_enabled() -> bool:
    cfg = copaw_config()
    return bool(cfg["ask_url"] or cfg["base_url"])


def copaw_bridge_status() -> str:
    if not copaw_enabled():
        return "disabled"
    cfg = copaw_config()
    return "configured" if cfg["ask_url"] or cfg["base_url"] else "disabled"


def _pick_answer(data: dict[str, Any]) -> str:
    # 兼容不同 Agent 返回字段（Workshop 先保证“能跑通结构”，真实对接再统一字段）
    for k in ("answer", "content", "merged_text"):
        v = data.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def _pick_evidence_refs(data: dict[str, Any]) -> list[dict[str, Any]]:
    ev = data.get("evidence_refs") or data.get("evidence") or data.get("evidenceRef") or []
    if isinstance(ev, list):
        return ev  # type: ignore[return-value]
    return []


def _pick_risk_level(data: dict[str, Any]) -> str | None:
    v = data.get("risk_level") or data.get("risk") or data.get("riskLabel")
    if v is None:
        return None
    if isinstance(v, str) and v.strip():
        return v.strip()
    return None


def _pick_model_meta(data: dict[str, Any]) -> dict[str, Any] | None:
    model = data.get("model")
    if isinstance(model, dict) and model:
        return model
    # 兼容：直接返回 model_id
    model_id = data.get("model_id")
    if isinstance(model_id, str) and model_id.strip():
        return {"model_id": model_id.strip()}
    return None


def copaw_qa_ask_or_none(
    *,
    session_id: str,
    query: str,
    evidence_block: str,
    spec_ver: str,
    require_risk: bool,
    trace_id: str,
) -> dict[str, Any] | None:
    """
    返回结构建议：
    {
      answer: string,
      evidence_refs: EvidenceRef[],
      risk_level: "高/中/低",
      model: { model_id?: string },
      compliance?: {...}
    }
    """
    cfg = copaw_config()
    if not copaw_enabled():
        return None

    url = cfg["ask_url"] or (cfg["base_url"].rstrip("/") + "/skills/ira_qa_ask/run")
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if cfg["api_token"]:
        headers["Authorization"] = f"Bearer {cfg['api_token']}"

    # 约定：把 trace_id 作为主键贯穿；CoPaw 若有子 trace，可再映射/追加。
    payload: dict[str, Any] = {
        "session_id": session_id,
        "query": query,
        "evidence_block": evidence_block,
        "spec_version": spec_ver,
        "require_risk_label": require_risk,
        "trace_id": trace_id,
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

    answer = _pick_answer(data)
    if not answer:
        # 不强制：允许 CoPaw 只返回结构字段但 answer 为空；此处认为不可用则回退
        return None

    out: dict[str, Any] = {
        "answer": answer,
        "evidence_refs": _pick_evidence_refs(data),
        "risk_level": _pick_risk_level(data),
        "model": _pick_model_meta(data) or {},
    }
    if isinstance(data.get("compliance"), dict):
        out["compliance"] = data["compliance"]
    return out

