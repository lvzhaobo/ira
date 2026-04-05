"""
ira.vin 演示用 Mock HTTP 服务：新浪/东财/Wind 风格 JSON + 仿门户 HTML + OpenAI 形 + M3/M5 捷径。
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from flask import Flask, redirect, render_template, request, url_for


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates")

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "ira-vin-mocks", "version": "1.1.0"}

    @app.get("/")
    def portal_index():
        """Mock 门户首页：链到三个仿门户页面。"""
        return render_template("portal_index.html")

    @app.get("/mock/page/sina/finance")
    def page_sina_finance():
        """模拟门户财经资讯页（前端 fetch 列表 JSON）。"""
        return render_template("sina_finance.html")

    @app.get("/mock/page/eastmoney/flash")
    def page_eastmoney_flash():
        """模拟快讯页（前端 fetch 快讯 JSON）。"""
        return render_template("eastmoney_flash.html")

    @app.get("/mock/page/wind/terminal")
    def page_wind_terminal():
        """模拟终端行情页（前端 fetch snapshot JSON）。"""
        return render_template("wind_terminal.html")

    @app.get("/mock/v1/sina/finance/news/list.json")
    def sina_news_list():
        page = int(request.args.get("page", 1))
        _ = page
        return {
            "result": {
                "status": {"code": 0, "msg": "success"},
                "timestamp": _now_iso(),
                "data": {
                    "page": page,
                    "pageSize": 20,
                    "items": [
                        {
                            "id": "sina-demo-1001",
                            "title": "[模拟新浪] A 股早盘：消费板块相对韧性",
                            "summary": "演示摘要：成交额与北向资金为虚构数据。",
                            "ctime": "2026-04-04 09:35:00",
                            "channel": "stock",
                            "url": "https://example.com/mock/sina/1001",
                        },
                        {
                            "id": "sina-demo-1002",
                            "title": "[模拟新浪] 国债期货窄幅震荡",
                            "summary": "演示摘要：利率曲线为虚构。",
                            "ctime": "2026-04-04 09:40:00",
                            "channel": "bond",
                            "url": "https://example.com/mock/sina/1002",
                        },
                    ],
                },
            }
        }

    @app.get("/mock/v1/eastmoney/api/news/flash")
    def eastmoney_flash():
        return {
            "success": True,
            "message": "ok",
            "data": [
                {
                    "art_code": "em-demo-2001",
                    "title": "[模拟东财快讯] 创业板指波动加大",
                    "digest": "演示：板块轮动加快，注意流动性。",
                    "show_time": "2026-04-04 10:02:33",
                    "column": "市场",
                },
                {
                    "art_code": "em-demo-2002",
                    "title": "[模拟东财快讯] 港股科技龙头发行可转债（虚构）",
                    "digest": "演示：仅供接口形态参考。",
                    "show_time": "2026-04-04 10:15:00",
                    "column": "港股",
                },
            ],
        }

    @app.get("/mock/v1/wind/market/snapshot")
    def wind_snapshot():
        code = request.args.get("windCode", "600519.SH")
        return {
            "requestId": f"wind-{uuid.uuid4().hex[:12]}",
            "errorCode": 0,
            "snap": {
                "windCode": code,
                "securityName": "演示茅台" if "519" in code else "演示证券",
                "last": 1688.88,
                "changePct": 0.0123,
                "updateTime": _now_iso(),
                "currency": "CNY",
            },
        }

    @app.post("/mock/v1/openai/v1/chat/completions")
    def openai_chat_completions():
        body = request.get_json(silent=True) or {}
        msgs = body.get("messages") or []
        last_user = next(
            (m.get("content", "") for m in reversed(msgs) if m.get("role") == "user"),
            "",
        )
        content = (
            f"[ira.vin Mock LLM] 已收到用户问题（演示回复）。\n\n"
            f"问题摘要：{last_user[:200]!r}\n\n"
            f"本响应为虚构，不构成投资建议。"
        )
        rid = f"chatcmpl-mock-{uuid.uuid4().hex[:10]}"
        return {
            "id": rid,
            "object": "chat.completion",
            "created": int(datetime.now(timezone.utc).timestamp()),
            "model": body.get("model") or "ira-vin-mock",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": content},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 50,
                "total_tokens": 60,
            },
        }

    @app.post("/mock/v3/knowledge/qa")
    def m3_knowledge_qa():
        body = request.get_json(silent=True) or {}
        q = (body.get("question") or "").strip() or "（空问题）"
        doc_id = body.get("documentId") or "d0000003-0000-4000-8000-000000000003"
        cid = "c0000003-0000-4000-8000-000000000099"
        return {
            "answer": f"（Mock）针对「{q[:80]}」的演示回答：根据片段摘录，**结论仅为占位**。\n\n> 基金投研免责声明：演示数据。",
            "citations": [
                {
                    "chunkId": cid,
                    "documentId": doc_id,
                    "score": 0.88,
                    "snippet": "…演示 PDF 解析片段：仓位约 xx%，行业分散…",
                }
            ],
            "traceId": f"tr-m3-{uuid.uuid4().hex[:8]}",
            "model": {"modelId": "ira-vin-mock", "promptVersion": "2026-04-04"},
            "declined": False,
            "declineReason": None,
        }

    @app.post("/mock/v5/experts/utterances-preview")
    def m5_utterances_preview():
        body = request.get_json(silent=True) or {}
        topic = body.get("topic") or "（无主题）"
        rnd = int(body.get("roundNo") or 1)
        sid = str(uuid.uuid4())
        base_seq = rnd * 10
        return {
            "previewSessionStub": sid,
            "topic": topic,
            "newUtterances": [
                {
                    "utteranceId": str(uuid.uuid4()),
                    "sessionId": sid,
                    "seq": base_seq + 1,
                    "roundNo": rnd,
                    "agentId": "M5-BULL",
                    "content": f"（Mock 看多）关于「{topic[:60]}」：演示性乐观论据，**非真实研究观点**。",
                    "contentFormat": "markdown",
                    "structured": None,
                    "toolCalls": [],
                    "modelName": "ira-vin-mock",
                    "promptVersion": "2026-04-04",
                    "createdAt": _now_iso(),
                },
                {
                    "utteranceId": str(uuid.uuid4()),
                    "sessionId": sid,
                    "seq": base_seq + 2,
                    "roundNo": rnd,
                    "agentId": "M5-BEAR",
                    "content": f"（Mock 看空）关于「{topic[:60]}」：演示性风险提醒，**非真实研究观点**。",
                    "contentFormat": "markdown",
                    "structured": None,
                    "toolCalls": [],
                    "modelName": "ira-vin-mock",
                    "promptVersion": "2026-04-04",
                    "createdAt": _now_iso(),
                },
                {
                    "utteranceId": str(uuid.uuid4()),
                    "sessionId": sid,
                    "seq": base_seq + 3,
                    "roundNo": rnd,
                    "agentId": "M5-MOD",
                    "content": (
                        "## 纪要（演示）\n\n"
                        "- 多空分歧为虚构\n"
                        "- **基金投研免责声明**：本段由 Mock 生成，不构成投资建议。\n"
                    ),
                    "contentFormat": "markdown",
                    "structured": {"type": "disclaimer", "version": "2026-04-04"},
                    "toolCalls": [],
                    "modelName": "ira-vin-mock",
                    "promptVersion": "2026-04-04",
                    "createdAt": _now_iso(),
                },
            ],
        }

    @app.get("/mock/v1/page/sina/news-sample.html")
    def sina_html_legacy():
        """旧路径保留，重定向到新门户风格页。"""
        return redirect(url_for("page_sina_finance"), code=302)

    return app


app = create_app()
