def test_compliance_rules(client):
    r = client.get("/api/v1/compliance/rules")
    assert r.status_code == 200
    j = r.get_json()
    assert j["ruleset_version"]
    assert len(j["rules"]) >= 1


def test_compliance_scan_blocks(client):
    r = client.post(
        "/api/v1/compliance/scan",
        json={"text": "建议全仓买入", "context_trace_id": None},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["blocked"] is True
    assert j["hits"]


def test_compliance_scan_pass(client):
    r = client.post(
        "/api/v1/compliance/scan",
        json={"text": "仅供研究参考，不构成投资建议。", "context_trace_id": None},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["blocked"] is False
