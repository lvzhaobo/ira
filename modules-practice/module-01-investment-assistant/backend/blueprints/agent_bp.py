import uuid

from agent import CoPawAgent
from flask import Blueprint, jsonify, request
from storage import Storage

agent_bp = Blueprint("agent", __name__)

# 全局实例
agent = CoPawAgent()
storage = None  # 将在请求中通过 app.config 初始化


def get_storage():
    """获取存储实例"""
    from flask import current_app

    return Storage(current_app.config["DATA_DIR"])


# ========== 问答 API ==========


@agent_bp.route("/ask", methods=["POST"])
def ask():
    """
    POST /api/v1/agent/ask

    请求体:
    {
        "query": "string (required, 1-500字符)",
        "session_id": "string (required)"
    }
    """
    data = request.get_json()

    # 参数校验
    if not data or not data.get("query"):
        return jsonify({"error": {"code": "EMPTY_QUERY", "message": "请输入问题", "details": {}}}), 400

    query = data["query"].strip()

    if len(query) == 0:
        return jsonify({"error": {"code": "EMPTY_QUERY", "message": "请输入问题", "details": {}}}), 400

    if len(query) > 500:
        return (
            jsonify(
                {
                    "error": {
                        "code": "INVALID_QUERY",
                        "message": "问题过长",
                        "details": {"max_length": 500, "current_length": len(query)},
                    }
                }
            ),
            400,
        )

    if not data.get("session_id"):
        return jsonify({"error": {"code": "INVALID_QUERY", "message": "会话标识不能为空", "details": {}}}), 400

    session_id = data["session_id"]

    try:
        # 调用 Agent
        result = agent.ask(query)

        # 存储问答记录
        storage = get_storage()
        storage.add_record(
            session_id=session_id,
            query=query,
            answer=result["answer"],
            llm_used=result["llm_used"],
            model=result["model"],
            response_time_ms=result["response_time_ms"],
        )

        return jsonify(result), 200

    except Exception as e:
        return (
            jsonify({"error": {"code": "UPSTREAM_ERROR", "message": "内部服务错误", "details": {"error": str(e)}}}),
            500,
        )


# ========== 会话管理 API ==========


@agent_bp.route("/sessions", methods=["GET"])
def get_sessions():
    """获取会话列表"""
    storage = get_storage()
    sessions = storage.get_sessions()
    return jsonify({"sessions": sessions}), 200


@agent_bp.route("/sessions", methods=["POST"])
def create_session():
    """新建会话"""
    data = request.get_json()
    session_id = str(uuid.uuid4())
    title = data.get("title", "新会话")

    storage = get_storage()
    session = storage.create_session(session_id, title)

    return jsonify(session), 201


@agent_bp.route("/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """删除会话"""
    storage = get_storage()
    storage.delete_session(session_id)

    return jsonify({"message": "会话已删除"}), 200


# ========== 问答记录 API ==========


@agent_bp.route("/sessions/<session_id>/records", methods=["GET"])
def get_records(session_id):
    """获取会话问答历史"""
    storage = get_storage()
    records = storage.get_records_by_session(session_id)
    return jsonify({"records": records}), 200
