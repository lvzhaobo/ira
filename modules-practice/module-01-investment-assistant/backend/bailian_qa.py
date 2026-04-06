"""
百炼（DashScope）OpenAI 兼容接口 — 与主项目 `ira/backend/app/services/bailian_qa.py` 行为对齐。

密钥优先级：DASHSCOPE_API_KEY（与 ira 一致）> BAILIAN_API_KEY（历史兼容）。
"""

from __future__ import annotations

import os
from typing import Any

import requests

DEFAULT_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1"
DEFAULT_MODEL = "qwen-plus"
TIMEOUT_SEC = 120


def _api_key() -> str:
    return (os.environ.get("DASHSCOPE_API_KEY") or os.environ.get("BAILIAN_API_KEY") or "").strip()


def bailian_config() -> dict[str, str]:
    return {
        "api_key": _api_key(),
        "model": (os.environ.get("IRA_BAILIAN_MODEL") or os.environ.get("BAILIAN_MODEL") or DEFAULT_MODEL).strip()
        or DEFAULT_MODEL,
        "base_url": os.environ.get("IRA_BAILIAN_BASE_URL", DEFAULT_BASE).strip().rstrip("/") or DEFAULT_BASE,
    }


def is_bailian_enabled() -> bool:
    return bool(bailian_config()["api_key"])


def _system_prompt() -> str:
    return (
        "你是中国内地基金公司投研部门的智能助手，面向分析师与投研合规场景。"
        "请使用专业、审慎的中文作答，条理清晰。"
        "若问题涉及个股或证券，须声明：本分析基于公开信息与模型推演，不构成投资建议。"
    )


def chat_completion(user_query: str) -> tuple[str | None, str | None, dict[str, Any]]:
    cfg = bailian_config()
    if not cfg["api_key"]:
        return None, "BAILIAN_DISABLED", {}

    url = f"{cfg['base_url']}/chat/completions"
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": user_query.strip()},
        ],
        "temperature": float(os.environ.get("IRA_BAILIAN_TEMPERATURE", "0.2")),
    }
    try:
        r = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {cfg['api_key']}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=TIMEOUT_SEC,
        )
    except requests.RequestException as e:
        return None, f"UPSTREAM_NETWORK: {e}", {}

    try:
        data = r.json()
    except Exception:
        return None, f"UPSTREAM_BAD_JSON: HTTP {r.status_code}", {}

    if r.status_code != 200:
        err = data.get("error") or data.get("message") or data
        return None, f"UPSTREAM_HTTP_{r.status_code}: {err}", {}

    choices = data.get("choices") or []
    if not choices:
        return None, "UPSTREAM_EMPTY_CHOICES", {}

    msg = (choices[0].get("message") or {}).get("content") or ""
    if not str(msg).strip():
        return None, "UPSTREAM_EMPTY_CONTENT", {}

    usage = data.get("usage") or {}
    return str(msg).strip(), None, {"raw_usage": usage, "model": cfg["model"]}
