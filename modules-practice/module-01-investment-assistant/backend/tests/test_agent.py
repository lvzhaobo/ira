"""
后端测试用例
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["DATA_DIR"] = "./test_data"

    with app.test_client() as client:
        yield client


def test_ask_success(client):
    """正常问答返回答案 (REQ-001, 002)"""
    # 先创建会话
    client.post("/api/v1/agent/sessions", json={"title": "测试会话"})

    response = client.post("/api/v1/agent/ask", json={"query": "测试问题", "session_id": "test-session"})

    assert response.status_code == 200
    data = response.get_json()
    assert "answer" in data
    assert "llm_used" in data
    assert "response_time_ms" in data
    assert data.get("answer_source") in ("copaw", "bailian", "demo")


def test_ask_empty_query(client):
    """空查询返回 400 (REQ-005)"""
    response = client.post("/api/v1/agent/ask", json={"query": "", "session_id": "test-session"})

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"]["code"] == "EMPTY_QUERY"


def test_ask_long_query(client):
    """超长文本返回 400 (REQ-005)"""
    long_query = "测" * 501

    response = client.post("/api/v1/agent/ask", json={"query": long_query, "session_id": "test-session"})

    assert response.status_code == 400
    data = response.get_json()
    assert data["error"]["code"] == "INVALID_QUERY"


def test_bailian_fallback(client):
    """无密钥时降级 (REQ-003)；与 ira 一致读取 DASHSCOPE_API_KEY 或 BAILIAN_API_KEY"""
    client.post("/api/v1/agent/sessions", json={"title": "测试会话"})

    response = client.post("/api/v1/agent/ask", json={"query": "测试降级", "session_id": "test-session-2"})

    assert response.status_code == 200
    data = response.get_json()
    if not (os.getenv("DASHSCOPE_API_KEY") or os.getenv("BAILIAN_API_KEY")):
        assert data["llm_used"] is False
        assert data["model"] is None
        assert data.get("answer_source") == "demo"


def test_capabilities(client):
    r = client.get("/api/v1/agent/capabilities")
    assert r.status_code == 200
    j = r.get_json()
    assert "bailian_configured" in j
    assert "copaw_configured" in j
    assert "llm_live" in j


def test_llm_used_flag(client):
    """llm_used 字段正确 (RULE-005)"""
    client.post("/api/v1/agent/sessions", json={"title": "测试会话"})

    response = client.post("/api/v1/agent/ask", json={"query": "测试标志", "session_id": "test-session-3"})

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data["llm_used"], bool)


def test_response_time(client):
    """响应时间 < 5s (REQ-004)"""
    client.post("/api/v1/agent/sessions", json={"title": "测试会话"})

    response = client.post("/api/v1/agent/ask", json={"query": "测试性能", "session_id": "test-session-4"})

    assert response.status_code == 200
    data = response.get_json()
    assert data["response_time_ms"] < 5000
