"""
IRA MCP Server — 投研助手工具集

封装 IRA 后端已有 API 为 MCP 工具，供 Qoder IDE / CoPaw 等 MCP Client 调用。

工具列表:
  - ira_stock_quote:     A股行情快照查询
  - ira_compliance_scan: 合规文本扫描

前置条件:
  - IRA 后端运行在 localhost:5000
  - pip install -r requirements.txt
"""

import json
import os

import requests
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
IRA_API_BASE = os.environ.get("IRA_API_BASE", "http://localhost:5000/api/v1")
REQUEST_TIMEOUT = 10  # seconds

mcp = FastMCP("ira-tools")


# ---------------------------------------------------------------------------
# 工具 1: 行情快照查询
# ---------------------------------------------------------------------------
@mcp.tool()
def ira_stock_quote(symbol: str) -> str:
    """查询A股个股实时行情快照。

    返回最新价格和 PE(TTM) 估值。
    示例: 600519.SH、000858.SZ

    Args:
        symbol: 股票代码，如 600519.SH、000858.SZ
    """
    url = f"{IRA_API_BASE}/research/stock/quote"
    try:
        resp = requests.get(url, params={"symbol": symbol}, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
    except requests.ConnectionError:
        return json.dumps(
            {"error": "无法连接 IRA 后端，请确认 Flask 服务已启动在 :5000"},
            ensure_ascii=False,
        )
    except Exception as e:
        return json.dumps({"error": f"请求失败: {e}"}, ensure_ascii=False)

    last_price = data.get("last")
    pe_ttm = data.get("pe_ttm")
    is_mock = data.get("mock", True)

    result = {
        "symbol": symbol,
        "last_price": last_price,
        "pe_ttm": pe_ttm,
        "data_source": "Mock 模拟数据" if is_mock else "实时行情",
        "disclaimer": "仅供演示，不构成投资建议",
    }

    # 同时返回人类可读摘要
    if last_price is not None:
        result["summary"] = f"{symbol} 最新价 {last_price}，PE(TTM) {pe_ttm}"
    else:
        result["summary"] = f"{symbol} 暂无实时行情数据（Mock 模式）"

    return json.dumps(result, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# 工具 2: 合规文本扫描
# ---------------------------------------------------------------------------
@mcp.tool()
def ira_compliance_scan(text: str) -> str:
    """扫描文本是否包含合规违规内容。

    检测投资操作表述（全仓/清仓/买入/卖出等）和收益承诺（保本/稳赚/无风险等）。
    适用于文案发布前预检、研报草稿合规审查。

    Args:
        text: 待检查的文本内容
    """
    url = f"{IRA_API_BASE}/compliance/scan"
    try:
        resp = requests.post(
            url,
            json={"text": text},
            headers={"Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.ConnectionError:
        return json.dumps(
            {"error": "无法连接 IRA 后端，请确认 Flask 服务已启动在 :5000"},
            ensure_ascii=False,
        )
    except Exception as e:
        return json.dumps({"error": f"请求失败: {e}"}, ensure_ascii=False)

    blocked = data.get("blocked", False)
    hits = data.get("hits", [])
    trace_id = data.get("trace_id", "")
    ruleset = data.get("ruleset_version", "")

    result = {
        "compliant": not blocked,
        "blocked": blocked,
        "trace_id": trace_id,
        "ruleset_version": ruleset,
        "hits": hits,
        "scanned_text_length": len(text),
    }

    # 人类可读摘要
    if blocked:
        hit_details = "; ".join(f"{h['rule_id']}: {h['message']}" for h in hits)
        result["summary"] = f"⚠️ 合规不通过 — 命中 {len(hits)} 条规则: {hit_details}"
    else:
        result["summary"] = "✅ 合规通过 — 未发现违规内容"

    return json.dumps(result, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# 启动
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    mcp.run()
