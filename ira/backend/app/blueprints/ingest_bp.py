from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.errors import error_response
from app.services.market_data_hub import create_sync_job, get_job, list_sources

bp = Blueprint("ingest", __name__)


@bp.route("/ingest/health", methods=["GET"])
def ingest_health():
    return jsonify({"status": "ok", "module": "M2", "version": "1.0.0"})


@bp.route("/ingest/sources", methods=["GET"])
def ingest_sources():
    enabled_only = (request.args.get("enabledOnly") or "false").lower() == "true"
    return jsonify({"items": list_sources(enabled_only=enabled_only)})


@bp.route("/ingest/sources/<source_id>/sync", methods=["POST"])
def ingest_sync(source_id: str):
    body = request.get_json(force=True, silent=True) or {}
    symbol = body.get("symbol", "600519.SH")
    mode = body.get("mode", "incremental")
    try:
        job = create_sync_job(source_id=source_id, symbol=symbol, mode=mode)
    except ValueError as e:
        code = str(e)
        if code == "SOURCE_NOT_FOUND":
            return error_response("NOT_FOUND", f"source not found: {source_id}", 404)
        if code == "SOURCE_DISABLED":
            return error_response("INVALID_STATE", f"source disabled: {source_id}", 409)
        return error_response("VALIDATION_ERROR", code, 422)
    return jsonify(job), 201


@bp.route("/ingest/jobs/<job_id>", methods=["GET"])
def ingest_job(job_id: str):
    job = get_job(job_id)
    if not job:
        return error_response("NOT_FOUND", f"job not found: {job_id}", 404)
    return jsonify(job)
