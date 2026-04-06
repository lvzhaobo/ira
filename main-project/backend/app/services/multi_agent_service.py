"""Build multi-agent discussion mock."""

from __future__ import annotations

from app.trace_util import new_trace_id


def run_multi_agent(symbol: str, mock: bool = True) -> dict:
    orch = new_trace_id("orch")
    u1 = new_trace_id("utt")
    u2 = new_trace_id("utt")
    u3 = new_trace_id("utt")
    u4 = new_trace_id("utt")
    sub_traces = [new_trace_id("sub") for _ in range(3)]
    discussion = [
        {
            "utterance_id": u1,
            "round": 1,
            "speaker_id": "industry",
            "speaker_name": "行业研究 Agent",
            "content": f"标的 {symbol}：行业存量竞争，龙头集中度延续，关注批价与渠道库存。",
            "reply_to_utterance_id": None,
            "mentions": [],
        },
        {
            "utterance_id": u2,
            "round": 1,
            "speaker_id": "quant",
            "speaker_name": "量化估值 Agent",
            "content": f"{symbol} 当前估值处于近三年中性区间，ROE 平稳；关键假设：无重大减值。",
            "reply_to_utterance_id": None,
            "mentions": [],
        },
        {
            "utterance_id": u3,
            "round": 1,
            "speaker_id": "risk",
            "speaker_name": "风控合规 Agent",
            "content": "未命中 R-G01/R-G02 高风险话术；需保留免责声明与数据来源。",
            "reply_to_utterance_id": None,
            "mentions": [],
        },
        {
            "utterance_id": u4,
            "round": 2,
            "speaker_id": "quant",
            "speaker_name": "量化估值 Agent",
            "content": "补充：与行业观点一致，若批价走弱需下调盈利假设。",
            "reply_to_utterance_id": u1,
            "mentions": ["industry"],
        },
    ]
    agents = [
        {
            "id": "industry",
            "name": "行业研究 Agent",
            "role_tag": "定性",
            "status": "done",
            "output": discussion[0]["content"],
            "trace": sub_traces[0],
            "card_order": 0,
        },
        {
            "id": "quant",
            "name": "量化估值 Agent",
            "role_tag": "定量",
            "status": "done",
            "output": discussion[1]["content"],
            "trace": sub_traces[1],
            "card_order": 1,
        },
        {
            "id": "risk",
            "name": "风控合规 Agent",
            "role_tag": "合规",
            "status": "done",
            "output": discussion[2]["content"],
            "trace": sub_traces[2],
            "card_order": 2,
        },
    ]
    merged = (
        f"【汇总 · 演示】{symbol}\n"
        "· 行业：龙头集中度延续。\n"
        "· 量化：估值中性，需跟踪批价。\n"
        "· 合规：未命中禁荐股/保本承诺；已提示免责声明。\n"
        "不构成投资建议。"
    )
    return {
        "execution_source": "local_mock",
        "orchestration_trace": orch,
        "sub_traces": sub_traces,
        "agents": agents,
        "discussion": discussion,
        "messages": [
            {
                "t": "10:00:01.120",
                "from": "BFF",
                "to": "编排Agent",
                "kind": "request",
                "body": f"start_pipeline(symbol={symbol!r}, mode=parallel_then_merge)",
            },
            {
                "t": "10:00:01.145",
                "from": "编排Agent",
                "to": "*",
                "kind": "broadcast",
                "body": "fan_out: [industry, quant, risk] round=1",
            },
            {
                "t": "10:00:02.880",
                "from": "行业研究 Agent",
                "to": "编排Agent",
                "kind": "result",
                "body": "artifact v1: 行业段落（定性）",
            },
            {
                "t": "10:00:03.102",
                "from": "量化估值 Agent",
                "to": "编排Agent",
                "kind": "result",
                "body": "artifact v1: 估值与假设（定量）",
            },
            {
                "t": "10:00:03.340",
                "from": "风控合规 Agent",
                "to": "编排Agent",
                "kind": "result",
                "body": "artifact v1: 规则扫描 PASS",
            },
            {
                "t": "10:00:04.010",
                "from": "编排Agent",
                "to": "量化估值 Agent",
                "kind": "delegate",
                "body": "reply_to=industry: 请基于行业结论核对盈利敏感项",
            },
            {
                "t": "10:00:05.400",
                "from": "编排Agent",
                "to": "merge",
                "kind": "merge",
                "body": "merge_trace 已生成，进入合规闸门",
            },
        ],
        "merged_text": merged,
        "merge_trace": new_trace_id("merge"),
        "compliance": {"ruleset_version": "rules-v1.0.0", "filtered": False, "decline_reason": None},
    }
