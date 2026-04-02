def test_sentiment_analysis_run_and_events(client):
    r = client.post("/api/v1/sentiment/ingest", json={"title": "测试", "summary": "渠道库存存在下滑压力", "source_type": "manual"})
    assert r.status_code == 200

    run = client.post("/api/v1/sentiment/analysis/run", json={"time_window": "24h", "use_llm": True, "keywords": ["渠道"]})
    assert run.status_code == 200
    jr = run.get_json()
    assert jr["status"] == "queued"
    assert jr["trace_id"]

    runs = client.get("/api/v1/sentiment/pipeline/runs")
    assert runs.status_code == 200
    assert len(runs.get_json()["items"]) >= 1

    ev = client.get("/api/v1/sentiment/events?limit=5")
    assert ev.status_code == 200
    assert "items" in ev.get_json()


def test_sentiment_report_and_push(client):
    _ = client.post("/api/v1/sentiment/analysis/run", json={"time_window": "24h"})
    gen = client.post("/api/v1/sentiment/report/generate", json={"report_type": "daily", "time_window": "24h"})
    assert gen.status_code == 200
    rid = gen.get_json()["report_id"]

    push = client.post(
        "/api/v1/sentiment/push/run",
        json={"report_id": rid, "channels": ["feishu", "ding"], "require_compliance_scan": True},
    )
    assert push.status_code == 200
    assert push.get_json()["status"] in ("sent", "blocked")


def test_cron_jobs_and_run_once(client):
    j = client.get("/api/v1/cron/jobs")
    assert j.status_code == 200
    assert "items" in j.get_json()

    r = client.post("/api/v1/cron/jobs/run-once", json={"job_id": "job.sentiment.collect", "params": {"time_window": "24h"}})
    assert r.status_code == 200
    assert r.get_json()["status"] == "queued"


def test_copaw_agents_and_run(client):
    ag = client.get("/api/v1/sentiment/copaw/agents")
    assert ag.status_code == 200
    items = ag.get_json()["items"]
    assert len(items) >= 1
    agent_id = items[0]["agent_id"]

    run = client.post(
        "/api/v1/sentiment/copaw/agent/run",
        json={"agent_id": agent_id, "action": "analyze_overview", "time_window": "24h", "keywords": ["渠道"]},
    )
    assert run.status_code == 200
    jr = run.get_json()
    assert jr["status"] == "success"
    assert jr["trace_id"]
    assert "started_at" in jr
    assert "elapsed_ms" in jr
    assert "response_preview" in jr
    assert "result" in jr

