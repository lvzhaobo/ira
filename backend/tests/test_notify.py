def test_push_blocked_when_bad_content(client):
    r = client.post(
        "/api/v1/notify/push",
        json={"channel_id": "c1", "payload": "保证收益无风险", "source_trace_id": None},
    )
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] == "COMPLIANCE_BLOCK"


def test_push_ok_when_safe(client):
    r = client.post(
        "/api/v1/notify/push",
        json={"channel_id": "c1", "payload": "【摘要】行业周报要点已生成。", "source_trace_id": "tr_x"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["delivery_status"] == "dry_run_ok"
