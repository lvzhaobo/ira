def test_system_health(client):
    r = client.get("/api/v1/system/health")
    assert r.status_code == 200
    assert r.get_json()["ok"] is True
    assert r.headers.get("X-Trace-Id")
