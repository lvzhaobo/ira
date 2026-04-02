from pathlib import Path

from flask import Blueprint, current_app, jsonify

from app.json_store import read_json

bp = Blueprint("dashboard", __name__)


def _data(name: str):
    return Path(current_app.config["DATA_DIR"]) / name


@bp.route("/dashboard/todos", methods=["GET"])
def dashboard_todos():
    data = read_json(_data("todos.json"), {"items": []})
    return jsonify(data)


@bp.route("/dashboard/kpi", methods=["GET"])
def dashboard_kpi():
    data = read_json(_data("kpi.json"), {"sessions_today": 12, "pending_review": 3})
    return jsonify(data)


@bp.route("/sessions/recent", methods=["GET"])
def sessions_recent():
    data = read_json(_data("sessions_recent.json"), {"items": []})
    return jsonify(data)
