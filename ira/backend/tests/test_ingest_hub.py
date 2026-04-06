def test_ingest_minimal_flow(client):
    h = client.get("/api/v1/ingest/health")
    assert h.status_code == 200
    assert h.get_json()["module"] == "M2"

    s = client.get("/api/v1/ingest/sources")
    assert s.status_code == 200
    items = s.get_json()["items"]
    assert len(items) >= 1
    source_id = items[0]["id"]
    d = client.get(f"/api/v1/ingest/sources/{source_id}")
    assert d.status_code == 200
    assert d.get_json()["id"] == source_id

    j = client.post(f"/api/v1/ingest/sources/{source_id}/sync", json={"symbol": "600519.SH"})
    assert j.status_code == 201
    job = j.get_json()
    assert job["job_id"]
    assert job["market_snapshot_id"]

    g = client.get(f"/api/v1/ingest/jobs/{job['job_id']}")
    assert g.status_code == 200
    assert g.get_json()["market_snapshot_id"] == job["market_snapshot_id"]


def test_ingest_jobs_api_with_idempotency(client):
    source_id = client.get("/api/v1/ingest/sources").get_json()["items"][0]["id"]
    r1 = client.post(
        "/api/v1/ingest/jobs",
        json={"sourceId": source_id, "symbol": "600519.SH", "mode": "incremental", "idempotencyKey": "idem-1"},
    )
    assert r1.status_code == 201
    first_job = r1.get_json()
    assert first_job["status"] in ("queued", "running", "success")

    r2 = client.post(
        "/api/v1/ingest/jobs",
        json={"sourceId": source_id, "symbol": "600519.SH", "mode": "incremental", "idempotencyKey": "idem-1"},
    )
    assert r2.status_code == 409
    assert r2.get_json()["error"]["code"] == "M2_IDEMPOTENCY_REPLAY"

    r3 = client.get("/api/v1/ingest/jobs?limit=5")
    assert r3.status_code == 200
    assert len(r3.get_json()["items"]) >= 1


def test_stock_analysis_prefers_hub_snapshot(client):
    src = client.get("/api/v1/ingest/sources").get_json()["items"][0]["id"]
    job = client.post(f"/api/v1/ingest/sources/{src}/sync", json={"symbol": "600519.SH"}).get_json()
    snapshot_id = job["market_snapshot_id"]

    r = client.post("/api/v1/research/stock/analysis", json={"symbol": "600519.SH", "mock": False})
    assert r.status_code == 200
    data = r.get_json()
    assert data.get("market_snapshot_id") == snapshot_id
    assert data["sources"][0]["mock"] is False


def test_multi_agent_snapshot_searchable_in_lineage(client):
    src = client.get("/api/v1/ingest/sources").get_json()["items"][0]["id"]
    job = client.post(f"/api/v1/ingest/sources/{src}/sync", json={"symbol": "600519.SH"}).get_json()
    snapshot_id = job["market_snapshot_id"]

    m = client.post(
        "/api/v1/research/stock/multi-agent/run",
        json={"symbol": "600519.SH", "mock": False, "market_snapshot_id": snapshot_id},
    )
    assert m.status_code == 200
    assert m.get_json().get("market_snapshot_id") == snapshot_id

    q = client.get(f"/api/v1/lineage/search?q={snapshot_id}")
    assert q.status_code == 200
    items = q.get_json()["items"]
    assert any(it.get("market_snapshot_id") == snapshot_id for it in items)
