from datetime import datetime, timezone
from time import perf_counter
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request

from app.json_store import read_json, write_json
from app.services.compliance_service import scan_text
from app.services.bailian_sentiment import chat_sentiment_analysis
from app.trace_util import new_trace_id

bp = Blueprint("sentiment", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@bp.route("/sentiment/watchlist", methods=["GET"])
def watchlist_get():
    data = read_json(_data("watchlist.json"), {"items": []})
    return jsonify(data)


@bp.route("/sentiment/watchlist", methods=["POST"])
def watchlist_add():
    body = request.get_json(force=True, silent=True) or {}
    kw = body.get("keyword", "").strip()
    data = read_json(_data("watchlist.json"), {"items": []})
    data["items"].append({"keyword": kw, "count": 0})
    write_json(_data("watchlist.json"), data)
    return jsonify({"ok": True})


@bp.route("/sentiment/watchlist", methods=["DELETE"])
def watchlist_del():
    kw = request.args.get("keyword", "")
    data = read_json(_data("watchlist.json"), {"items": []})
    data["items"] = [x for x in data["items"] if x.get("keyword") != kw]
    write_json(_data("watchlist.json"), data)
    return ("", 204)


@bp.route("/sentiment/alerts", methods=["GET"])
def sentiment_alerts():
    data = read_json(_data("alerts.json"), {"items": []})
    return jsonify(data)


@bp.route("/sentiment/ingest", methods=["POST"])
def sentiment_ingest():
    body = request.get_json(force=True, silent=True) or {}
    items = []
    if "items" in body:
        items = body["items"]
    else:
        items = [body]
    alerts = read_json(_data("alerts.json"), {"items": []})
    trace_ids = []
    for it in items:
        aid = new_trace_id("al")
        trace_ids.append(aid)
        alerts["items"].insert(
            0,
            {
                "id": aid,
                "title": it.get("title", ""),
                "summary": it.get("summary", ""),
                "source_type": it.get("source_type", "manual"),
                "source_name": it.get("source_name", "ingest"),
                "published_at": it.get("published_at", ""),
                "sentiment": "中性",
                "trace_id": aid,
            },
        )
    write_json(_data("alerts.json"), alerts)
    return jsonify({"ingested": len(items), "trace_ids": trace_ids})


@bp.route("/sentiment/analysis/run", methods=["POST"])
def sentiment_analysis_run():
    body = request.get_json(force=True, silent=True) or {}
    time_window = body.get("time_window", "24h")
    use_llm = bool(body.get("use_llm", True))
    keywords = body.get("keywords", [])
    if not isinstance(keywords, list):
        keywords = []

    alerts = read_json(_data("alerts.json"), {"items": []})
    items = alerts.get("items", [])
    run_id = new_trace_id("run")
    tid = new_trace_id("tr")

    # sources 简化：给 LLM/展示用的来源归纳（生产可在 Normalize Agent 中生成）
    sources_unique = []
    seen_src = set()
    for it in items:
        st = it.get("source_type", "manual")
        sn = it.get("source_name", "ingest")
        key = (st, sn)
        if key in seen_src:
            continue
        seen_src.add(key)
        sources_unique.append({"source_type": st, "source_name": sn})

    def rule_cluster():
        event_rows = []
        for i, it in enumerate(items[: min(len(items), 40)]):
            summary = (it.get("summary") or it.get("title") or "").strip()
            if not summary:
                summary = "无摘要"
            # 简易规则：演示聚类与风险标签（回退兜底）
            sent = it.get("sentiment") or (
                "negative" if any(x in summary for x in ("下滑", "风险", "违规", "处罚")) else "neutral"
            )
            risk = (
                "high"
                if any(x in summary for x in ("处罚", "违规", "立案"))
                else "medium"
                if any(x in summary for x in ("下滑", "波动", "压力"))
                else "low"
            )
            event_rows.append(
                {
                    "dedup_group_id": f"grp_{(i % 4) + 1:03d}",
                    "event_uid": f"evt_{it.get('id', i)}",
                    "cluster_title": it.get("title", "未命名事件"),
                    "risk_level": risk,
                    "sentiment": sent,
                    "risk_tags": [],
                    "impact_scope": "",
                    "suggested_actions": [],
                    "sources": sources_unique[:1],
                    "trace_id": it.get("trace_id", tid),
                    "published_at": it.get("published_at", ""),
                }
            )
        return event_rows

    llm_used = False
    llm_model = None
    event_rows = []
    if use_llm:
        # 只有当百炼配置存在时才尝试；失败则回退规则聚类，确保演示可用。
        try:
            top_alerts = []
            for it in items[: min(len(items), 16)]:
                top_alerts.append(
                    {
                        "id": it.get("id"),
                        "title": it.get("title", ""),
                        "summary": it.get("summary", ""),
                        "source_type": it.get("source_type", "manual"),
                        "source_name": it.get("source_name", "ingest"),
                        "published_at": it.get("published_at", ""),
                        "sentiment": it.get("sentiment", "中性"),
                        "trace_id": it.get("trace_id"),
                    }
                )
            clusters, meta = chat_sentiment_analysis(top_alerts, time_window=time_window, keywords=keywords)
            if clusters:
                llm_used = bool(meta.get("llm_used", True))
                llm_model = meta.get("model")
                # cluster -> event_rows：保证字段能被前端展示
                event_rows = []
                for i, c in enumerate(clusters[:8]):
                    event_rows.append(
                        {
                            "dedup_group_id": c.get("dedup_group_id") or f"grp_{(i % 4) + 1:03d}",
                            "event_uid": c.get("event_uid") or f"evt_{i}",
                            "cluster_title": c.get("cluster_title") or "未命名事件",
                            "risk_level": c.get("risk_level") or "low",
                            "sentiment": c.get("sentiment") or "neutral",
                            "risk_tags": c.get("risk_tags") or [],
                            "impact_scope": c.get("impact_scope") or "",
                            "suggested_actions": c.get("suggested_actions") or [],
                            "sources": sources_unique[:2],
                            "trace_id": tid,
                            "published_at": "",
                        }
                    )
        except Exception:
            event_rows = []

    if not event_rows:
        event_rows = rule_cluster()

    write_json(_data("sentiment_events.json"), {"items": event_rows})

    run_item = {
        "run_id": run_id,
        "workflow": "sentiment_analyze",
        "status": "success",
        "started_at": _now_iso(),
        "ended_at": _now_iso(),
        "trace_id": tid,
        "params": {"time_window": time_window, "use_llm": use_llm, "keywords": keywords},
        "stats": {
            "events_collected": len(items),
            "events_deduped": len(event_rows),
            "alerts_generated": min(len(event_rows), 10),
        },
        "llm_used": llm_used,
        "llm_model": llm_model,
    }
    runs = read_json(_data("sentiment_pipeline_runs.json"), {"items": []})
    runs["items"].insert(0, run_item)
    write_json(_data("sentiment_pipeline_runs.json"), runs)
    return jsonify({"run_id": run_id, "status": "queued", "trace_id": tid, "llm_used": llm_used, "llm_model": llm_model})


@bp.route("/sentiment/pipeline/runs", methods=["GET"])
def sentiment_pipeline_runs():
    data = read_json(_data("sentiment_pipeline_runs.json"), {"items": []})
    return jsonify(data)


@bp.route("/sentiment/events", methods=["GET"])
def sentiment_events():
    data = read_json(_data("sentiment_events.json"), {"items": []})
    limit = int(request.args.get("limit") or 20)
    items = data.get("items", [])[: max(limit, 0)]
    return jsonify({"items": items})


@bp.route("/sentiment/report/generate", methods=["POST"])
def sentiment_report_generate():
    body = request.get_json(force=True, silent=True) or {}
    report_type = body.get("report_type", "daily")
    time_window = body.get("time_window", "24h")
    template_version = body.get("template_version", "sentiment-daily-v1")
    tid = new_trace_id("tr")
    rid = new_trace_id("rep_sent")
    title = f"舆情{'日报' if report_type == 'daily' else '周报'}（{datetime.now().strftime('%Y-%m-%d')}）"
    rows = read_json(_data("sentiment_events.json"), {"items": []}).get("items", [])
    top = rows[:3]
    summary = "；".join(x.get("cluster_title", "") for x in top) or "暂无高优先级事件"

    drafts = read_json(_data("report_drafts.json"), {"items": []})
    drafts["items"].insert(
        0,
        {
            "id": rid,
            "title": title,
            "report_type": "舆情" + ("日报" if report_type == "daily" else "周报"),
            "product_line": "投研运营",
            "product_code": "SENTIMENT",
            "report_period": time_window,
            "department": "投研中台",
            "owner": "系统自动生成",
            "reviewer": "待指定",
            "workflow_stage": "编制中",
            "compliance_status": "未送审",
            "confidentiality": "内部",
            "updated_at": datetime.now().strftime("%Y-%m-%d"),
            "due_at": datetime.now().strftime("%Y-%m-%d"),
            "trace_id": tid,
            "template_version": template_version,
            "summary": summary,
        },
    )
    write_json(_data("report_drafts.json"), drafts)
    return jsonify({"report_id": rid, "report_title": title, "status": "draft", "trace_id": tid, "link": f"/reports?focus={rid}"})


@bp.route("/sentiment/push/run", methods=["POST"])
def sentiment_push_run():
    body = request.get_json(force=True, silent=True) or {}
    report_id = body.get("report_id")
    channels = body.get("channels", [])
    if not isinstance(channels, list) or not channels:
        channels = ["feishu"]
    subject = body.get("subject") or "【舆情摘要】自动推送"
    require_scan = bool(body.get("require_compliance_scan", True))
    tid = new_trace_id("tr")
    pbid = new_trace_id("push")

    drafts = read_json(_data("report_drafts.json"), {"items": []}).get("items", [])
    row = next((x for x in drafts if x.get("id") == report_id), None)
    payload = (row.get("summary") if row else "") or "舆情自动推送（演示）"

    if require_scan:
        rules_data = read_json(_data("rules.json"), {"rules": []})
        hits = scan_text(payload, rules_data.get("rules", []))
        if hits:
            return jsonify({"push_batch_id": pbid, "status": "blocked", "trace_id": tid, "blocked": True, "hits": hits}), 200

    hist = read_json(_data("notify_history.json"), {"items": []})
    results = []
    for ch in channels:
        msg_id = new_trace_id("msg")
        hist["items"].insert(
            0,
            {
                "trace_id": tid,
                "channel_id": ch,
                "payload": payload[:500],
                "source_trace_id": row.get("trace_id") if row else None,
                "subject": subject[:200],
                "batch_id": pbid,
                "message_id": msg_id,
            },
        )
        results.append({"channel": ch, "status": "sent", "message_id": msg_id})
    write_json(_data("notify_history.json"), hist)
    return jsonify({"push_batch_id": pbid, "status": "sent", "trace_id": tid, "results": results})


@bp.route("/cron/jobs", methods=["GET"])
def cron_jobs_get():
    data = read_json(
        _data("cron_jobs.json"),
        {
            "items": [
                {"job_id": "job.sentiment.collect", "enabled": True, "schedule": "managed-by-copaw-console", "last_run_status": "success", "last_run_at": _now_iso()},
                {"job_id": "job.sentiment.analyze", "enabled": True, "schedule": "managed-by-copaw-console", "last_run_status": "success", "last_run_at": _now_iso()},
                {"job_id": "job.sentiment.report", "enabled": True, "schedule": "managed-by-copaw-console", "last_run_status": "success", "last_run_at": _now_iso()},
                {"job_id": "job.sentiment.push", "enabled": True, "schedule": "managed-by-copaw-console", "last_run_status": "success", "last_run_at": _now_iso()},
            ]
        },
    )
    return jsonify(data)


@bp.route("/cron/jobs/run-once", methods=["POST"])
def cron_jobs_run_once():
    body = request.get_json(force=True, silent=True) or {}
    job_id = body.get("job_id", "").strip()
    if not job_id:
        return jsonify({"error": {"code": "INVALID_ARGUMENT", "message": "job_id is required"}}), 400
    run_id = new_trace_id("run_job")
    tid = new_trace_id("tr")

    runs = read_json(_data("cron_runs.json"), {"items": []})
    runs["items"].insert(
        0,
        {"run_id": run_id, "job_id": job_id, "status": "queued", "trace_id": tid, "started_at": _now_iso(), "params": body.get("params", {})},
    )
    write_json(_data("cron_runs.json"), runs)
    return jsonify({"run_id": run_id, "status": "queued", "trace_id": tid})


def _mock_kpis():
    return [
        {"id": "vol", "label": "24h 全网声量（条）", "value": "12,847", "sub": "已去重", "delta": "+6.2%", "trend": "up", "accent": "neutral"},
        {"id": "neg", "label": "负面信息占比", "value": "11.3%", "sub": "含弱负面", "delta": "-0.8pt", "trend": "down", "accent": "ok"},
        {"id": "alert", "label": "待处置预警", "value": "7", "sub": "高 2 · 中 3 · 低 2", "accent": "risk"},
        {"id": "cover", "label": "覆盖 A 股标的", "value": "186", "sub": "含港股通 42", "delta": "+3", "trend": "up", "accent": "neutral"},
        {"id": "interactive", "label": "互动平台待阅", "value": "23", "sub": "上证e互动 / 深证互动易", "accent": "neutral"},
        {"id": "compliance", "label": "合规敏感命中", "value": "4", "sub": "已推送合规复核队列", "accent": "risk"},
    ]


def _mock_alerts():
    return [
        {
            "id": "a1",
            "level": "high",
            "category": "重仓标的",
            "title": "某新能源龙头被媒体报道产能利用率争议",
            "summary": "晚间财经媒体引用匿名供应商说法，提及排产与库存；股吧与雪球讨论热度上升，需核对公开披露与调研纪要一致性。",
            "source": "财联社 · 深度",
            "channel": "新闻网站",
            "time": "今日 21:16",
            "relatedCodes": ["300750"],
            "tags": ["新能源", "供应链"],
        },
        {
            "id": "a2",
            "level": "high",
            "category": "监管政策",
            "title": "行业协会发布征求意见稿，涉及费率与销售渠道表述",
            "summary": "文件涉及理财产品宣传用语，可能与近期产品材料更新相关，合规已订阅全文待评估影响面。",
            "source": "协会官网",
            "channel": "监管/自律",
            "time": "今日 17:40",
            "tags": ["政策", "合规"],
        },
        {
            "id": "a3",
            "level": "medium",
            "category": "产品声誉",
            "title": "社交媒体出现对「固收+」回撤讨论的集中转发",
            "summary": "话题集中于近两周净值波动，情绪偏中性偏负；需区分持有人结构与市场整体β。",
            "source": "微博 / 雪球",
            "channel": "社交",
            "time": "今日 15:02",
            "tags": ["固收+", "声誉"],
        },
        {
            "id": "a4",
            "level": "medium",
            "category": "行业景气",
            "title": "半导体设备板块研报密集下调全年资本开支预期",
            "summary": "3 家卖方在同日更新模型，关键词「资本开支」「稼动率」命中上升；与内部行业观点比对中。",
            "source": "Wind 研报摘要",
            "channel": "研报",
            "time": "今日 11:28",
            "relatedCodes": ["688012", "002371"],
            "tags": ["半导体", "景气度"],
        },
        {
            "id": "a5",
            "level": "medium",
            "category": "竞品动态",
            "title": "同业新发科技主题 ETF 费率与募集上限引讨论",
            "summary": "媒体报道与投资者问答区热度升高，需跟踪对存量产品申赎与渠道排期的潜在影响。",
            "source": "上证e互动",
            "channel": "互动平台",
            "time": "昨日 19:55",
            "tags": ["ETF", "渠道"],
        },
        {
            "id": "a6",
            "level": "low",
            "category": "宏观舆情",
            "title": "海外媒体对人民币汇率波动的解读分歧加大",
            "summary": "对权益与固收资产定价影响偏间接，已纳入晨会宏观简报引用列表。",
            "source": "Bloomberg 摘要",
            "channel": "外媒",
            "time": "昨日 08:10",
            "tags": ["汇率", "宏观"],
        },
    ]


def _mock_sector_sentiment():
    return [
        {"name": "电力设备及新能源", "score": 46, "deltaW": -4},
        {"name": "电子 / 半导体", "score": 52, "deltaW": -3},
        {"name": "食品饮料", "score": 64, "deltaW": 1},
        {"name": "医药生物", "score": 59, "deltaW": 2},
        {"name": "非银金融", "score": 56, "deltaW": 0},
        {"name": "有色金属", "score": 54, "deltaW": -1},
    ]


def _mock_source_mix():
    return [
        {"name": "新闻与财经终端", "pct": 34, "count": 4368},
        {"name": "交易所互动平台", "pct": 22, "count": 2826},
        {"name": "卖方研报摘要", "pct": 18, "count": 2312},
        {"name": "社交媒体 / 股吧", "pct": 15, "count": 1927},
        {"name": "监管与协会披露", "pct": 11, "count": 1414},
    ]


def _mock_hot_topics():
    return [
        {"topic": "新能源排产与库存", "heat": 96, "sentiment": "neg"},
        {"topic": "半导体资本开支", "heat": 88, "sentiment": "neg"},
        {"topic": "白酒渠道去库存", "heat": 72, "sentiment": "neu"},
        {"topic": "固收+ 净值波动", "heat": 69, "sentiment": "neg"},
        {"topic": "港股通资金流向", "heat": 61, "sentiment": "neu"},
        {"topic": "ETF 费率改革预期", "heat": 55, "sentiment": "neu"},
    ]


def _mock_stock_sentiment():
    return [
        {"code": "300750", "name": "宁德时代", "score": 42, "change24h": -8, "buzz": 126, "positionTag": "前十大重仓", "funds": ["南方新能源主题", "南方产业升级混合"], "risk": "watch"},
        {"code": "600519", "name": "贵州茅台", "score": 68, "change24h": 3, "buzz": 89, "positionTag": "核心池", "funds": ["南方品质优选", "南方消费精选"], "risk": "normal"},
        {"code": "688012", "name": "中微公司", "score": 55, "change24h": -5, "buzz": 64, "positionTag": "科技成长", "funds": ["南方科技创新混合"], "risk": "watch"},
        {"code": "000858", "name": "五粮液", "score": 61, "change24h": 1, "buzz": 52, "positionTag": "消费", "funds": ["南方消费升级"], "risk": "normal"},
        {"code": "601318", "name": "中国平安", "score": 58, "change24h": -2, "buzz": 71, "positionTag": "金融", "funds": ["南方金融主题"], "risk": "normal"},
        {"code": "002371", "name": "北方华创", "score": 48, "change24h": -12, "buzz": 58, "positionTag": "半导体设备", "funds": ["南方信息创新混合"], "risk": "high"},
    ]


def _mock_watch_matrix():
    return [
        {"keyword": "基金经理离任", "scope": "全市场", "hits24h": 12, "negRatio": "8%", "owner": "合规"},
        {"keyword": "巨额赎回", "scope": "自有产品", "hits24h": 3, "negRatio": "33%", "owner": "零售"},
        {"keyword": "监管处罚", "scope": "同业+监管", "hits24h": 28, "negRatio": "41%", "owner": "合规"},
        {"keyword": "重仓股名称", "scope": "股票池 186", "hits24h": 412, "negRatio": "14%", "owner": "权益"},
        {"keyword": "费率 / 业绩比较基准", "scope": "产品材料", "hits24h": 19, "negRatio": "5%", "owner": "产品"},
    ]


def _mock_ingestion_pipeline():
    return [
        {"label": "财联社专线", "value": "正常", "status": "ok"},
        {"label": "互动易爬虫", "value": "延迟 <15min", "status": "delay"},
        {"label": "Wind 研报摘要", "value": "Mock", "status": "mock"},
        {"label": "社交情绪 NLP", "value": "离线模型", "status": "mock"},
    ]


@bp.route("/sentiment/mock/kpis", methods=["GET"])
def sentiment_mock_kpis():
    return jsonify({"items": _mock_kpis()})


@bp.route("/sentiment/mock/sector-sentiment", methods=["GET"])
def sentiment_mock_sector_sentiment():
    return jsonify({"items": _mock_sector_sentiment()})


@bp.route("/sentiment/mock/source-mix", methods=["GET"])
def sentiment_mock_source_mix():
    return jsonify({"items": _mock_source_mix()})


@bp.route("/sentiment/mock/hot-topics", methods=["GET"])
def sentiment_mock_hot_topics():
    return jsonify({"items": _mock_hot_topics()})


@bp.route("/sentiment/mock/stock-sentiment", methods=["GET"])
def sentiment_mock_stock_sentiment():
    return jsonify({"items": _mock_stock_sentiment()})


@bp.route("/sentiment/mock/watch-matrix", methods=["GET"])
def sentiment_mock_watch_matrix():
    return jsonify({"items": _mock_watch_matrix()})


@bp.route("/sentiment/mock/ingestion-pipeline", methods=["GET"])
def sentiment_mock_ingestion_pipeline():
    return jsonify({"items": _mock_ingestion_pipeline()})


@bp.route("/sentiment/alerts/for-ui", methods=["GET"])
def sentiment_alerts_for_ui():
    limit = int(request.args.get("limit") or 6)

    # 读取最近一次分析的 llm_used：用于标识“来源”
    runs = read_json(_data("sentiment_pipeline_runs.json"), {"items": []}).get("items", [])
    llm_used = bool(runs[0].get("llm_used")) if runs else False

    events = read_json(_data("sentiment_events.json"), {"items": []}).get("items", [])
    if not events:
        items = _mock_alerts()[:limit]
        return jsonify({"items": items, "source": "mock"})

    now_hhmm = datetime.now().strftime("%H:%M")
    source = "CoPaw/百炼" if llm_used else "规则聚类"
    items = []
    for i, ev in enumerate(events[:limit]):
        risk_level = ev.get("risk_level") or "low"
        level = "high" if risk_level == "high" else "medium" if risk_level == "medium" else "low"
        impact_scope = ev.get("impact_scope") or ""
        suggested_actions = ev.get("suggested_actions") or []
        summary = impact_scope or ("；".join(suggested_actions[:3]) if isinstance(suggested_actions, list) and suggested_actions else "") or "舆情事件摘要（演示）"
        title = ev.get("cluster_title") or "未命名事件"
        tags = ev.get("risk_tags") or []
        items.append(
            {
                "id": f"der_{i}",
                "level": level,
                "category": "事件聚类",
                "title": title,
                "summary": summary,
                "source": source,
                "channel": "舆情分析",
                "time": f"今日 {now_hhmm}",
                "relatedCodes": [],
                "tags": tags,
            }
        )

    return jsonify({"items": items, "source": "derived"})


def _copaw_agents_default():
    return {
        "items": [
            {
                "agent_id": "agent.sentiment.pm-assistant",
                "name": "投研经理舆情助手",
                "provider": "copaw",
                "llm_provider": "bailian",
                "model_hint": "qwen-plus",
                "capabilities": ["analyze_overview", "explain_alert", "suggest_actions", "generate_brief"],
            }
        ]
    }


@bp.route("/sentiment/copaw/agents", methods=["GET"])
def sentiment_copaw_agents():
    data = read_json(_data("sentiment_copaw_agents.json"), _copaw_agents_default())
    return jsonify(data)


def _risk_by_text(text: str) -> str:
    if any(x in text for x in ("处罚", "违规", "立案", "兑付风险")):
        return "high"
    if any(x in text for x in ("下滑", "波动", "压力", "争议")):
        return "medium"
    return "low"


def _rule_cluster_by_alerts(items: list[dict]):
    rows = []
    for i, it in enumerate(items[: min(len(items), 12)]):
        summary = (it.get("summary") or it.get("title") or "").strip() or "无摘要"
        sentiment = it.get("sentiment") or ("negative" if _risk_by_text(summary) in ("high", "medium") else "neutral")
        risk_level = _risk_by_text(summary)
        rows.append(
            {
                "dedup_group_id": f"grp_{(i % 4) + 1:03d}",
                "event_uid": f"evt_{it.get('id', i)}",
                "cluster_title": it.get("title", "未命名事件"),
                "risk_level": risk_level,
                "sentiment": sentiment,
                "risk_tags": [it.get("source_name", "舆情")] if it.get("source_name") else [],
                "impact_scope": "影响范围待确认，建议先核验原始披露口径。",
                "suggested_actions": ["核验原文出处与发布时间", "确认影响范围（产品/持仓/渠道）", "同步研究结论与合规口径"],
            }
        )
    return rows


@bp.route("/sentiment/copaw/agent/run", methods=["POST"])
def sentiment_copaw_agent_run():
    started_perf = perf_counter()
    started_at = _now_iso()
    body = request.get_json(force=True, silent=True) or {}
    agent_id = body.get("agent_id") or "agent.sentiment.pm-assistant"
    action = (body.get("action") or "").strip()
    time_window = body.get("time_window", "24h")
    keywords = body.get("keywords", [])
    if not isinstance(keywords, list):
        keywords = []

    if action not in ("analyze_overview", "explain_alert", "suggest_actions", "generate_brief"):
        return jsonify({"error": {"code": "INVALID_ARGUMENT", "message": "invalid action"}}), 400

    alerts_data = read_json(_data("alerts.json"), {"items": []}).get("items", [])
    alert_payload = body.get("alert") or {}
    picked = []
    if action in ("explain_alert", "suggest_actions") and isinstance(alert_payload, dict) and alert_payload:
        picked = [
            {
                "id": alert_payload.get("id"),
                "title": alert_payload.get("title", ""),
                "summary": alert_payload.get("summary", ""),
                "source_type": "ui",
                "source_name": alert_payload.get("source", "ui-card"),
                "published_at": "",
                "sentiment": "中性",
                "trace_id": alert_payload.get("id"),
            }
        ]
        keywords = (keywords + [alert_payload.get("category", "")] + (alert_payload.get("tags") or []))[:8]
    else:
        picked = alerts_data[:8]

    tid = new_trace_id("tr")
    run_id = new_trace_id("run_agent")

    llm_used = False
    llm_model = None
    clusters = []
    try:
        clusters, meta = chat_sentiment_analysis(picked, time_window=time_window, keywords=[x for x in keywords if x])
        if clusters:
            llm_used = bool(meta.get("llm_used", True))
            llm_model = meta.get("model")
    except Exception:
        clusters = []

    if not clusters:
        clusters = _rule_cluster_by_alerts(picked)

    top = clusters[0] if clusters else {}
    brief_lines = [f"- {c.get('cluster_title', '未命名事件')}（风险：{c.get('risk_level', 'low')}）" for c in clusters[:3]]
    result = {
        "title": top.get("cluster_title") or "舆情分析结果",
        "risk_level": top.get("risk_level") or "low",
        "sentiment": top.get("sentiment") or "neutral",
        "impact_scope": top.get("impact_scope") or "影响范围待确认",
        "risk_tags": top.get("risk_tags") or [],
        "suggested_actions": top.get("suggested_actions") or ["核验数据来源", "同步研究与合规口径"],
        "brief_md": "\n".join(brief_lines) or "- 暂无高优先级事件",
    }

    runs = read_json(_data("sentiment_pipeline_runs.json"), {"items": []})
    runs["items"].insert(
        0,
        {
            "run_id": run_id,
            "workflow": f"copaw_agent_{action}",
            "status": "success",
            "started_at": started_at,
            "ended_at": _now_iso(),
            "trace_id": tid,
            "params": {"agent_id": agent_id, "action": action, "time_window": time_window},
            "llm_used": llm_used,
            "llm_model": llm_model,
        },
    )
    write_json(_data("sentiment_pipeline_runs.json"), runs)
    elapsed_ms = int((perf_counter() - started_perf) * 1000)
    response_preview = (result.get("impact_scope") or "")[:180] or (result.get("brief_md") or "")[:180]
    ended_at = _now_iso()

    return jsonify(
        {
            "run_id": run_id,
            "status": "success",
            "provider": "copaw",
            "llm_provider": "bailian" if llm_used else "rule-fallback",
            "trace_id": tid,
            "agent_id": agent_id,
            "action": action,
            "llm_used": llm_used,
            "llm_model": llm_model,
            "started_at": started_at,
            "ended_at": ended_at,
            "elapsed_ms": elapsed_ms,
            "response_preview": response_preview,
            "result": result,
        }
    )

