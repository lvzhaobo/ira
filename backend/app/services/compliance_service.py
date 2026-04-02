"""Minimal rule scan for workshop prototype."""
from __future__ import annotations

import re
from typing import Any


def scan_text(text: str, rules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    hits: list[dict[str, Any]] = []
    for r in rules:
        rid = r.get("id", "")
        # Simple demo patterns — extend per 02-SPEC
        if rid == "R-G01" and re.search(r"(全仓|清仓|买入|卖出|加仓|减仓|调仓)", text):
            hits.append({"rule_id": rid, "span": "investment_ops", "message": "疑似个性化投资操作表述"})
        if rid == "R-G02" and re.search(r"(保证收益|稳赚|无风险|保本)", text):
            hits.append({"rule_id": rid, "span": "return_promise", "message": "疑似收益承诺"})
    return hits
