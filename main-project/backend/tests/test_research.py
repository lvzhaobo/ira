def test_qa_ask_mvp(client):
    r = client.post(
        "/api/v1/research/qa/ask",
        json={"session_id": "s1", "query": "白酒行业观点？", "spec_milestone": "mvp-v1"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["trace_id"]
    assert j["answer"]
    assert j["evidence_refs"]


def test_qa_ask_with_embedded_mode(client, monkeypatch):
    monkeypatch.setenv("IRA_COPAW_MODE", "embedded")
    r = client.post(
        "/api/v1/research/qa/ask",
        json={"session_id": "s_embedded", "query": "白酒行业观点？"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["answer"]
    assert j["model"]["model_id"] == "copaw-embedded-prototype"


def test_qa_ask_with_off_mode(client, monkeypatch):
    monkeypatch.setenv("IRA_COPAW_MODE", "off")
    monkeypatch.delenv("IRA_COPAW_QA_ASK_URL", raising=False)
    monkeypatch.delenv("IRA_COPAW_BASE_URL", raising=False)
    r = client.post(
        "/api/v1/research/qa/ask",
        json={"session_id": "s_off", "query": "白酒行业观点？"},
    )
    assert r.status_code == 200
    j = r.get_json()
    # off 模式下不走 CoPaw，回退到默认离线/本地逻辑
    assert j["model"]["model_id"] == "demo-llm"


def test_qa_ask_change_version(client):
    r = client.post(
        "/api/v1/research/qa/ask",
        headers={"X-Spec-Version": "ira-1.1.0"},
        json={"session_id": "s2", "query": "风险？", "require_risk_label": True},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j.get("risk_level")
    assert j.get("spec_version") == "ira-1.1.0"


def test_stock_analysis(client):
    r = client.post(
        "/api/v1/research/stock/analysis",
        json={"symbol": "600519.SH", "mock": True},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["disclaimer_applied"] is True
    assert j["sources"]


def test_multi_agent_discussion(client):
    r = client.post(
        "/api/v1/research/stock/multi-agent/run",
        json={"symbol": "600519.SH", "mock": True},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert "discussion" in j
    assert len(j["discussion"]) >= 2
    rounds = {d["round"] for d in j["discussion"]}
    assert max(rounds) >= 2
    assert any(d.get("reply_to_utterance_id") for d in j["discussion"])
    assert j.get("execution_source") in ("copaw", "local_mock")
    assert j.get("review_status") == "pending"

    trace_id = j["trace_id"]
    rlist = client.get("/api/v1/research/stock/multi-agent/runs")
    assert rlist.status_code == 200
    assert any(it.get("trace_id") == trace_id for it in rlist.get_json()["items"])

    rpatch = client.patch(
        f"/api/v1/research/stock/multi-agent/runs/{trace_id}/review",
        json={"review_status": "approved", "reviewer": "qa", "review_comment": "looks good"},
    )
    assert rpatch.status_code == 200
    assert rpatch.get_json()["review_status"] == "approved"
