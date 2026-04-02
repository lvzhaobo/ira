from __future__ import annotations

import json
import os
import re
from typing import Any

import requests

from app.services.bailian_qa import bailian_config, is_bailian_enabled


def _system_prompt() -> str:
    return (
        "你是中国内地基金公司投研部门的舆情分析助手，面向投研与合规场景。"
        "请在不编造事实的前提下，对输入的舆情告警进行结构化归纳。"
        "输出必须是严格 JSON，不允许输出非 JSON 文本。"
        "\n\n输出结构："
        "{"
        '  "clusters": ['
        "    {"
        '      "dedup_group_id": "grp_001",'
        '      "event_uid": "evt_...",'
        '      "cluster_title": "事件标题（可读，2-20字）",'
        '      "sentiment": "positive|neutral|negative",'
        '      "risk_level": "low|medium|high",'
        '      "risk_tags": ["tag1","tag2"],'
        '      "impact_scope": "影响范围一句话",'
        '      "suggested_actions": ["动作1","动作2"]'
        "    }"
        "  ]"
        "}"
        "\n\n规则："
        "- sentiment 只基于文本表达的正/中性/负面语义。"
        "- risk_level 用 low/medium/high 表示风险高低（例：high 可用于处罚/违规/立案/承诺收益等强风险措辞）。"
        "- risk_tags 为简短标签，最多 4 个。"
        "- suggested_actions 为 2-4 条可执行建议（核查资料、排查口径、复核合规话术等），不得给出买卖建议。"
        "- 任何不确定点必须在 impact_scope 或 suggested_actions 中表达为“需核实/待确认”。"
    )


def _extract_json(text: str) -> dict[str, Any]:
    # 兜底：尝试从响应里截取第一个 {...}
    m = re.search(r"\{.*\}", text, flags=re.S)
    if m:
        text = m.group(0)
    return json.loads(text)


def chat_sentiment_analysis(alerts: list[dict[str, Any]], time_window: str, keywords: list[str]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """
    返回 clusters, usage_meta
    """
    cfg = bailian_config()
    if not cfg["api_key"] or not is_bailian_enabled():
        return [], {"llm_used": False}

    url = f"{cfg['base_url']}/chat/completions"
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "time_window": time_window,
                        "keywords": keywords,
                        "alerts": alerts,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "temperature": float(os.environ.get("IRA_BAILIAN_TEMPERATURE", "0.2")),
    }

    r = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {cfg['api_key']}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )
    data = r.json()
    if r.status_code != 200:
        err = data.get("error") or data.get("message") or data
        raise RuntimeError(f"BAILIAN_HTTP_{r.status_code}: {err}")

    choices = data.get("choices") or []
    if not choices:
        return [], {"llm_used": True, "usage_meta": data.get("usage") or {}}

    msg = (choices[0].get("message") or {}).get("content") or ""
    if not str(msg).strip():
        return [], {"llm_used": True, "usage_meta": data.get("usage") or {}}

    parsed = _extract_json(str(msg))
    clusters = parsed.get("clusters") or []
    return clusters, {"llm_used": True, "usage_meta": data.get("usage") or {}, "model": cfg["model"]}

