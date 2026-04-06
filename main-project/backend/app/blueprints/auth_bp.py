import os
from pathlib import Path

from app.json_store import read_json
from flask import Blueprint, current_app, jsonify, request

bp = Blueprint("auth", __name__)


def _repo_root() -> Path:
    # backend/app/blueprints -> backend -> repo root
    return Path(current_app.root_path).resolve().parent.parent


def load_login_config() -> dict:
    """读取 config/auth_login.json；环境变量 IRA_LOGIN_PASSWORD 可覆盖密码（不落盘）。"""
    path = _repo_root() / "config" / "auth_login.json"
    data = read_json(path, {"username": "demo", "password": "ira.vin"})
    username = str(data.get("username") or "demo").strip() or "demo"
    password = str(data.get("password") or "ira.vin")
    env_pw = os.environ.get("IRA_LOGIN_PASSWORD", "").strip()
    if env_pw:
        password = env_pw
    return {"username": username, "password": password}


@bp.route("/auth/public-config", methods=["GET"])
def auth_public_config():
    """Workshop 演示：公开默认账号与密码，便于对照 config 文件。"""
    cfg = load_login_config()
    return jsonify({"username": cfg["username"], "password": cfg["password"]})


@bp.route("/auth/login", methods=["POST"])
def auth_login():
    body = request.get_json(force=True, silent=True) or {}
    u = str(body.get("username", "")).strip()
    p = str(body.get("password", ""))
    cfg = load_login_config()
    if u == cfg["username"] and p == cfg["password"]:
        return jsonify({"ok": True, "username": cfg["username"]})
    return jsonify({"ok": False, "error": {"code": "INVALID_CREDENTIALS", "message": "账号或密码错误"}}), 401
