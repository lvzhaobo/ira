"""
M1 问答编排：可选 CoPaw（HTTP）→ 百炼（OpenAI 兼容，与 ira 一致）→ 离线演示降级。

说明：类名历史为 CoPawAgent，实际仅在配置了 IRA_COPAW_* 时走 CoPaw；否则与主项目同样依赖百炼或演示数据。
"""

import time
from typing import Any

from bailian_qa import bailian_config, chat_completion, is_bailian_enabled
from copaw_bridge import copaw_ask_or_none, copaw_enabled


class CoPawAgent:
    def ask(self, query: str, session_id: str = "") -> dict[str, Any]:
        """
        返回:
        {
            'answer': str,
            'llm_used': bool,
            'model': str | None,
            'response_time_ms': int,
            'answer_source': 'copaw' | 'bailian' | 'demo'
        }
        """
        start_time = time.time()

        def elapsed_ms() -> int:
            return int((time.time() - start_time) * 1000)

        q = (query or "").strip()
        sid = session_id or "anonymous"

        if copaw_enabled():
            ans, raw = copaw_ask_or_none(session_id=sid, query=q)
            if ans:
                model_id = None
                if isinstance(raw, dict):
                    m = raw.get("model")
                    if isinstance(m, dict):
                        model_id = m.get("model_id")
                    elif isinstance(raw.get("model_id"), str):
                        model_id = raw["model_id"]
                return {
                    "answer": ans,
                    "llm_used": True,
                    "model": model_id or "copaw-bridge",
                    "response_time_ms": elapsed_ms(),
                    "answer_source": "copaw",
                }

        if is_bailian_enabled():
            ans, err, meta = chat_completion(q)
            if not err and ans:
                return {
                    "answer": ans,
                    "llm_used": True,
                    "model": meta.get("model") or bailian_config()["model"],
                    "response_time_ms": elapsed_ms(),
                    "answer_source": "bailian",
                }

        return {
            "answer": (
                "【离线演示】未配置 DASHSCOPE_API_KEY（或与 ira 相同的百炼密钥）。以下为占位回复，配置密钥后可调用真实模型。\n"
                f"问题摘要：{q[:200]}"
            ),
            "llm_used": False,
            "model": None,
            "response_time_ms": elapsed_ms(),
            "answer_source": "demo",
        }


def describe_capabilities() -> dict[str, Any]:
    """供 GET /api/v1/agent/capabilities 与前端状态条使用。"""
    return {
        "copaw_configured": copaw_enabled(),
        "bailian_configured": is_bailian_enabled(),
        "bailian_model": bailian_config()["model"] if is_bailian_enabled() else None,
    }
