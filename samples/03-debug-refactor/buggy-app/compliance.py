"""合规扫描服务 — 基于规则的文本合规检查"""

import re


def scan_text(text, rules):
    """扫描文本，匹配合规规则，返回命中列表。"""
    hits = []
    for r in rules:
        rid = r.get("id", "")
        if rid == "R-G01" and re.search(r"(全仓|清仓|买入|卖出)", text):
            hits.append({"rule_id": rid, "message": "疑似个性化投资操作表述"})
        if rid == "R-G02" and re.search(r"(保证收益|稳赚|无风险|保本)", text):
            hits.append({"rule_id": rid, "message": "疑似收益承诺"})
    return hits
