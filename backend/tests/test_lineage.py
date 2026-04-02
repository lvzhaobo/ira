def test_lineage_after_qa(client):
    client.post(
        "/api/v1/research/qa/ask",
        json={"session_id": "s1", "query": "测试", "spec_milestone": "mvp-v1"},
    )
    tid = client.post(
        "/api/v1/research/qa/ask",
        json={"session_id": "s1", "query": "第二次", "spec_milestone": "mvp-v1"},
    ).get_json()["trace_id"]
    r = client.get(f"/api/v1/lineage/traces/{tid}")
    assert r.status_code == 200
    assert r.get_json()["trace_id"] == tid


def test_lineage_search(client):
    client.post(
        "/api/v1/research/qa/ask",
        json={"session_id": "s1", "query": "唯一关键词xyz", "spec_milestone": "mvp-v1"},
    )
    r = client.get("/api/v1/lineage/search?q=xyz")
    assert r.status_code == 200
    items = r.get_json()["items"]
    assert len(items) >= 1
