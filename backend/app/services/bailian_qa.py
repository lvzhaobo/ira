"""
阿里云百炼（DashScope）OpenAI 兼容接口 — 用于研报问答等生成场景。

环境变量（与阿里云控制台一致）：
  DASHSCOPE_API_KEY  必填（启用真实模型时）
  IRA_BAILIAN_MODEL  可选，默认 qwen-plus
  IRA_BAILIAN_BASE_URL 可选，默认兼容模式 endpoint
"""
from __future__ import annotations

import os
from typing import Any

import requests

DEFAULT_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1"
DEFAULT_MODEL = "qwen-plus"
TIMEOUT_SEC = 120


def bailian_config() -> dict[str, str]:
    return {
        "api_key": os.environ.get("DASHSCOPE_API_KEY", "").strip(),
        "model": os.environ.get("IRA_BAILIAN_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL,
        "base_url": os.environ.get("IRA_BAILIAN_BASE_URL", DEFAULT_BASE).strip().rstrip("/") or DEFAULT_BASE,
    }


def is_bailian_enabled() -> bool:
    return bool(bailian_config()["api_key"])


def _system_prompt(evidence_block: str) -> str:
    base = (
        "你是中国内地基金公司投研部门的智能助手，面向分析师与投研合规场景。"
        "请使用专业、审慎的中文作答，条理清晰，必要时使用短标题分段。"
        "若问题涉及个股或证券，必须在结论中明确：本分析基于公开信息与模型推演，不构成投资建议，亦不构成对任何证券的买卖建议。"
        "若上下文未提供足够研报或数据支撑，应明确说明信息局限，不得编造具体数据来源或内部文件。"
    )
    if evidence_block.strip():
        return base + "\n\n【当前知识库可引用条目（摘要）】\n" + evidence_block
    return base + "\n\n【说明】当前机构知识库未挂载与问题强相关的研报片段，请结合行业通用分析框架作答，并声明材料局限。"


def chat_research_qa(user_query: str, evidence_block: str) -> tuple[str | None, str | None, dict[str, Any]]:
    """
    调用百炼 Chat Completions。
    返回 (answer_text, error_message, usage_meta)。
    error_message 非空表示失败；成功时 error_message 为 None。
    """
    cfg = bailian_config()
    if not cfg["api_key"]:
        return None, "BAILIAN_DISABLED", {}

    url = f"{cfg['base_url']}/chat/completions"
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": _system_prompt(evidence_block)},
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
