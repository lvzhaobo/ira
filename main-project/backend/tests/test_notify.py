def test_push_blocked_when_bad_content(client):
    r = client.post(
        "/api/v1/notify/push",
        json={"channel_id": "c1", "payload": "保证收益无风险", "source_trace_id": None},
    )
    assert r.status_code == 400
    assert r.get_json()["error"]["code"] in ("COMPLIANCE_BLOCK", "M4_COMPLIANCE_BLOCK")


def test_push_ok_when_safe(client):
    r = client.post(
        "/api/v1/notify/push",
        json={"channel_id": "c1", "payload": "【摘要】行业周报要点已生成。", "source_trace_id": "tr_x"},
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["delivery_status"] == "dry_run_ok"


def test_notify_templates_and_rules_and_dispatch(client):
    # seed channels
    client.put(
        "/api/v1/notify/channels",
        json={"items": [{"id": "feishu", "name": "飞书", "kind": "feishu", "connected": True}]},
    )

    tpl = client.post(
        "/api/v1/notify/templates",
        json={"name": "日报模板", "channelType": "feishu", "bodyMarkdown": "标题: {{title}}\n内容: {{body}}"},
    )
    assert tpl.status_code == 201
    tpl_id = tpl.get_json()["template"]["templateId"]

    rule = client.post(
        "/api/v1/notify/rules",
        json={"name": "日报规则", "channelIds": ["feishu"], "templateId": tpl_id, "triggerType": "manual"},
    )
    assert rule.status_code == 201
    rule_id = rule.get_json()["rule"]["ruleId"]

    dispatch = client.post(
        "/api/v1/notify/dispatch",
        json={
            "ruleId": rule_id,
            "payload": {"title": "今日摘要", "body": "行业景气上行", "variables": {}},
            "dryRun": True,
        },
    )
    assert dispatch.status_code == 200
    body = dispatch.get_json()
    assert body["dryRun"] is True
    assert len(body["deliveries"]) == 1
    assert body["deliveries"][0]["status"] == "sent"

    deliveries = client.get("/api/v1/notify/deliveries")
    assert deliveries.status_code == 200
    assert len(deliveries.get_json()["items"]) >= 1


def test_notify_channel_test_and_rule_validation(client):
    client.put("/api/v1/notify/channels", json={"items": [{"id": "ding", "name": "钉钉", "kind": "dingtalk"}]})

    ok = client.post("/api/v1/notify/channels/dingtalk/test", json={"channelId": "ding"})
    assert ok.status_code == 200
    assert ok.get_json()["ok"] is True

    bad_rule = client.post("/api/v1/notify/rules", json={"name": "bad", "channelIds": ["not-exists"]})
    assert bad_rule.status_code == 400
    assert bad_rule.get_json()["error"]["code"] == "M4_VALIDATION_ERROR"


def test_notify_dispatch_requires_review_for_non_dry_run(client):
    # seed channels/template/rule
    client.put("/api/v1/notify/channels", json={"items": [{"id": "feishu", "name": "飞书", "kind": "feishu"}]})
    tpl = client.post(
        "/api/v1/notify/templates",
        json={"name": "日报模板", "channelType": "feishu", "bodyMarkdown": "标题: {{title}}\n内容: {{body}}"},
    )
    tpl_id = tpl.get_json()["template"]["templateId"]
    rule = client.post(
        "/api/v1/notify/rules",
        json={"name": "日报规则", "channelIds": ["feishu"], "templateId": tpl_id, "triggerType": "manual"},
    )
    rule_id = rule.get_json()["rule"]["ruleId"]

    # create multi-agent run -> default pending review
    ma = client.post("/api/v1/research/stock/multi-agent/run", json={"symbol": "600519.SH", "mock": True})
    trace_id = ma.get_json()["trace_id"]

    blocked = client.post(
        "/api/v1/notify/dispatch",
        json={
            "ruleId": rule_id,
            "payload": {"title": "推送", "body": "测试内容", "variables": {}},
            "dryRun": False,
            "sourceRef": trace_id,
        },
    )
    assert blocked.status_code == 409
    assert blocked.get_json()["error"]["code"] == "M4_REVIEW_REQUIRED"

    client.patch(
        f"/api/v1/research/stock/multi-agent/runs/{trace_id}/review",
        json={"review_status": "approved", "reviewer": "qa"},
    )
    ok = client.post(
        "/api/v1/notify/dispatch",
        json={
            "ruleId": rule_id,
            "payload": {"title": "推送", "body": "测试内容", "variables": {}},
            "dryRun": False,
            "sourceRef": trace_id,
        },
    )
    assert ok.status_code == 200
