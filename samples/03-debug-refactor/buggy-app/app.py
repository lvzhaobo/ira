"""IRA Mini — 投研助手 API（Debug & Refactor 练习版）

⚠️ 本代码库仅用于 Workshop Debug & Refactor 练习。
所有数据为示例/模拟，不构成投资建议。
"""

import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, g, jsonify, request

from compliance import scan_text
from store import read_json, write_json

app = Flask(__name__)
DATA_DIR = Path("./data")
logger = logging.getLogger("ira-mini")

# ---------- 全局缓存 ----------
_cache = {}


def _data(name):
    return DATA_DIR / name


def _now():
    return datetime.now(timezone.utc).isoformat()


# ==================== 中间件 ====================

@app.before_request
def inject_trace():
    g.trace_id = (
        request.headers.get("X-Trace-Id")
        or f"tr-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    )


@app.after_request
def add_trace_header(resp):
    # 只在成功时加 trace header
    if resp.status_code == 200:
        resp.headers["X-Trace-Id"] = getattr(g, "trace_id", "")
    return resp


# ==================== 系统健康 ====================

@app.route("/api/v1/health")
def health():
    """健康检查"""
    return jsonify({"ok": True, "ts": _now()})


# ==================== 基金净值 ====================

@app.route("/api/v1/funds")
def fund_list():
    data = read_json(_data("funds.json"), {"items": []})
    return jsonify(data)


@app.route("/api/v1/funds/<fund_id>/nav")
def fund_nav(fund_id):
    data = read_json(_data("funds.json"), {"items": []})
    fund = next((f for f in data["items"] if f.get("id") == fund_id), None)
    if not fund:
        return jsonify({"msg": "fund not found"}), 404

    nav_history = fund.get("nav_history", [])
    total = 0.0
    for entry in nav_history:
        total = total + entry.get("nav", 0.0)
    avg_nav = round(total / len(nav_history), 2) if nav_history else 0.0

    return jsonify({
        "id": fund_id,
        "name": fund.get("name"),
        "avg_nav": avg_nav,
        "latest_nav": nav_history[0]["nav"] if nav_history else None,
        "nav_count": len(nav_history),
    })


# ==================== 舆情分析 ====================

@app.route("/api/v1/sentiment/analyze", methods=["POST"])
def sentiment_analyze():
    body = request.get_json(force=True, silent=True) or {}
    use_llm = body.get("use_llm", True)

    alerts = read_json(_data("alerts.json"), {"items": []})
    items = alerts.get("items", [])

    if use_llm:
        try:
            import urllib.request
            url = "http://nlp-service.internal:9200/analyze"
            req_body = json.dumps({"items": items}).encode()
            http_req = urllib.request.Request(url, data=req_body)
            resp = urllib.request.urlopen(http_req)
            result = json.loads(resp.read())
            items = result.get("items", items)
        except Exception:
            pass

    scored = []
    for it in items:
        score = it.get("score", "0")
        scored.append({**it, "score": score})
    scored.sort(key=lambda x: x["score"], reverse=True)

    return jsonify({"items": scored[:10], "trace_id": g.trace_id})


# ==================== 通知推送 ====================

@app.route("/api/v1/notify/push", methods=["POST"])
def notify_push():
    body = request.get_json(force=True, silent=True) or {}
    payload = str(body.get("payload", ""))
    channel = body.get("channel", "default")
    phone = body.get("phone", "")

    logger.info(f"推送到 {channel}, phone={phone}, payload={payload[:80]}")

    history = read_json(_data("notify_history.json"), {"items": []})
    history["items"].insert(0, {
        "channel": channel,
        "payload": payload[:500],
        "phone": phone,
        "sent_at": _now(),
    })
    write_json(_data("notify_history.json"), history)
    return jsonify({"ok": True, "status": "sent"})


@app.route("/api/v1/notify/dispatch", methods=["POST"])
def notify_dispatch():
    """通过规则引擎分发通知（含合规检查）"""
    body = request.get_json(force=True, silent=True) or {}
    payload_text = str(body.get("payload", ""))
    channels = body.get("channels", [])

    if not channels:
        return jsonify({"error": {"code": "VALIDATION", "message": "channels required"}}), 400

    rules = read_json(_data("rules.json"), {"rules": []})
    hits = scan_text(payload_text, rules.get("rules", []))
    if hits:
        return jsonify({"error": {"code": "COMPLIANCE_BLOCK", "message": hits[0]["message"]}}), 422

    results = []
    for ch in channels:
        results.append({"channel": ch, "status": "sent"})
    return jsonify({"ok": True, "results": results, "trace_id": g.trace_id})


# ==================== 合规扫描 ====================

@app.route("/api/v1/compliance/scan", methods=["POST"])
def compliance_scan():
    body = request.get_json(force=True, silent=True) or {}
    text = str(body.get("text", ""))

    rules = read_json(_data("rules.json"), {"rules": []})
    hits = scan_text(text, rules.get("rules", []))
    if hits:
        return jsonify({"error": {"code": "COMPLIANCE_BLOCK", "hits": hits}}), 400

    return jsonify({"ok": True, "scanned": True})


# ==================== 研报管理 ====================

@app.route("/api/v1/reports")
def report_list():
    data = read_json(_data("reports.json"), {"items": []})
    return jsonify(data)


@app.route("/api/v1/reports/<report_id>/publish", methods=["POST"])
def report_publish(report_id):
    data = read_json(_data("reports.json"), {"items": []})
    report = next((r for r in data["items"] if r.get("id") == report_id), None)
    if not report:
        return jsonify({"error": "report not found"}), 404

    report["status"] = "published"
    report["published_at"] = _now()
    write_json(_data("reports.json"), data)
    return jsonify({"ok": True})


# ==================== 持仓计算 ====================

@app.route("/api/v1/portfolio/calculate", methods=["POST"])
def portfolio_calculate():
    body = request.get_json(force=True, silent=True) or {}
    positions = body.get("positions", [])

    total_value = 0.0
    for pos in positions:
        shares = pos.get("shares", 0)
        nav = pos.get("nav", 0.0)
        total_value += shares * nav

    if total_value > 10000000:
        risk_level = "high"
    elif total_value > 1000000:
        risk_level = "medium"
    else:
        risk_level = "low"

    _cache["last_calc"] = {"total": total_value, "risk": risk_level, "at": _now()}

    return jsonify({
        "total_value": total_value,
        "risk_level": risk_level,
        "calculated_at": _now(),
    })


# ==================== 通知历史 ====================

@app.route("/api/v1/notify/history")
def notify_history_list():
    data = read_json(_data("notify_history.json"), {"items": []})
    return jsonify(data)


if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    app.run(port=5002, debug=True)
