def test_reports_draft_get_patch(client):
    r = client.get("/api/v1/reports/drafts/t1")
    assert r.status_code == 200
    assert r.get_json()["title"] == "测试草稿"

    r2 = client.patch(
        "/api/v1/reports/drafts/t1",
        json={"workflow_stage": "内审中", "compliance_status": "未送审"},
    )
    assert r2.status_code == 200
    j = r2.get_json()
    assert j["workflow_stage"] == "内审中"

    r404 = client.get("/api/v1/reports/drafts/nope")
    assert r404.status_code == 404


def test_openapi_json(client):
    r = client.get("/api/v1/openapi.json")
    assert r.status_code == 200
    j = r.get_json()
    assert j["openapi"] == "3.0.3"
    assert "/reports/drafts/{draft_id}" in j["paths"]
    assert "bearerAuth" in j["components"]["securitySchemes"]
    assert j.get("security") == [{}, {"bearerAuth": []}]


def test_swagger_ui_page(client):
    r = client.get("/api/docs")
    assert r.status_code == 200
    assert b"swagger-ui" in r.data.lower()


def test_system_preferences_put(client):
    r = client.put(
        "/api/v1/system/preferences",
        json={
            "default_route": "/reports",
            "show_workshop_panel": False,
            "show_research_qa_mvp_nav": True,
        },
    )
    assert r.status_code == 200
    j = r.get_json()
    assert j["default_route"] == "/reports"
    assert j["show_workshop_panel"] is False
    assert j["show_research_qa_mvp_nav"] is True

    s = client.get("/api/v1/system/settings")
    prefs = s.get_json()["preferences"]
    assert prefs["default_route"] == "/reports"
    assert prefs["show_research_qa_mvp_nav"] is True
