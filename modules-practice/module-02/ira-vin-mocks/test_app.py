import json

import pytest

from app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.testing = True
    return app.test_client()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_sina_shape(client):
    r = client.get("/mock/v1/sina/finance/news/list.json")
    assert r.status_code == 200
    j = r.get_json()
    assert j["result"]["status"]["code"] == 0
    assert len(j["result"]["data"]["items"]) >= 1
    assert "title" in j["result"]["data"]["items"][0]


def test_eastmoney_shape(client):
    r = client.get("/mock/v1/eastmoney/api/news/flash")
    j = r.get_json()
    assert j["success"] is True
    assert j["data"][0]["art_code"]


def test_wind_requires_param_ok(client):
    r = client.get("/mock/v1/wind/market/snapshot?windCode=000001.SH")
    j = r.get_json()
    assert j["errorCode"] == 0
    assert j["snap"]["windCode"] == "000001.SH"


def test_openai_completions(client):
    r = client.post(
        "/mock/v1/openai/v1/chat/completions",
        data=json.dumps(
            {
                "model": "x",
                "messages": [{"role": "user", "content": "hello"}],
            }
        ),
        content_type="application/json",
    )
    j = r.get_json()
    assert "choices" in j
    assert j["choices"][0]["message"]["role"] == "assistant"


def test_m3_qa(client):
    r = client.post(
        "/mock/v3/knowledge/qa",
        data=json.dumps({"question": "测试"}),
        content_type="application/json",
    )
    j = r.get_json()
    assert "citations" in j
    assert j["citations"][0]["chunkId"]


def test_portal_and_demo_pages(client):
    assert client.get("/").status_code == 200
    assert b"Mock" in client.get("/").data
    assert client.get("/mock/page/sina/finance").status_code == 200
    assert b"MOCK" in client.get("/mock/page/sina/finance").data
    assert client.get("/mock/page/eastmoney/flash").status_code == 200
    assert client.get("/mock/page/wind/terminal").status_code == 200


def test_sina_legacy_redirect(client):
    r = client.get("/mock/v1/page/sina/news-sample.html", follow_redirects=False)
    assert r.status_code == 302
    assert "/mock/page/sina/finance" in r.headers.get("Location", "")


def test_m5_preview(client):
    r = client.post(
        "/mock/v5/experts/utterances-preview",
        data=json.dumps({"topic": "基金A", "roundNo": 1}),
        content_type="application/json",
    )
    j = r.get_json()
    assert len(j["newUtterances"]) == 3
    roles = {u["agentId"] for u in j["newUtterances"]}
    assert roles == {"M5-BULL", "M5-BEAR", "M5-MOD"}
