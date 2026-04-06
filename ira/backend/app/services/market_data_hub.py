from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.json_store import read_json, write_json
from flask import current_app


def _data(name: str) -> Path:
    return Path(current_app.config["DATA_DIR"]) / name


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _seed_sources_if_needed() -> dict[str, Any]:
    path = _data("ingest_sources.json")
    payload = read_json(path, {"items": []})
    if payload.get("items"):
        return payload
    payload["items"] = [
        {
            "id": "source-sina-mock",
            "name": "新浪财经 (Mock)",
            "provider_type": "sina",
            "enabled": True,
            "config": {"feed_url": "/mock/v1/sina/finance/news/list.json"},
            "updated_at": _now_iso(),
        },
        {
            "id": "source-em-mock",
            "name": "东方财富 (Mock)",
            "provider_type": "eastmoney",
            "enabled": True,
            "config": {"feed_url": "/mock/v1/eastmoney/api/news/flash"},
            "updated_at": _now_iso(),
        },
    ]
    write_json(path, payload)
    return payload


def list_sources(enabled_only: bool = False) -> list[dict[str, Any]]:
    items = _seed_sources_if_needed().get("items", [])
    if not enabled_only:
        return items
    return [s for s in items if bool(s.get("enabled"))]


def _write_job(job: dict[str, Any]) -> None:
    path = _data("ingest_sync_jobs.json")
    payload = read_json(path, {"items": []})
    payload["items"].insert(0, job)
    write_json(path, payload)


def get_job(job_id: str) -> dict[str, Any] | None:
    payload = read_json(_data("ingest_sync_jobs.json"), {"items": []})
    for it in payload.get("items", []):
        if it.get("job_id") == job_id:
            return it
    return None


def _append_snapshot(snapshot: dict[str, Any]) -> None:
    path = _data("market_snapshots.json")
    payload = read_json(path, {"items": []})
    payload["items"].insert(0, snapshot)
    write_json(path, payload)


def create_sync_job(source_id: str, symbol: str = "600519.SH", mode: str = "incremental") -> dict[str, Any]:
    src = next((s for s in list_sources(False) if s.get("id") == source_id), None)
    if not src:
        raise ValueError("SOURCE_NOT_FOUND")
    if not src.get("enabled", True):
        raise ValueError("SOURCE_DISABLED")

    now = _now_iso()
    job_id = f"job-{uuid4().hex[:10]}"
    snapshot_id = f"snap-{uuid4().hex[:10]}"
    job = {
        "job_id": job_id,
        "source_id": source_id,
        "source_name": src.get("name"),
        "status": "success",
        "mode": mode,
        "symbol": symbol,
        "started_at": now,
        "finished_at": now,
        "stats": {"fetched": 1, "normalized": 1, "published": 1},
        "market_snapshot_id": snapshot_id,
    }
    _write_job(job)
    snapshot = {
        "snapshot_id": snapshot_id,
        "symbol": symbol,
        "as_of": now,
        "source_id": source_id,
        "source_name": src.get("name"),
        "provider_type": src.get("provider_type"),
        "mock": True,
        "quote": {"last": 1688.0, "pe_ttm": 28.1},
    }
    _append_snapshot(snapshot)
    return job


def latest_snapshot(symbol: str) -> dict[str, Any] | None:
    payload = read_json(_data("market_snapshots.json"), {"items": []})
    for it in payload.get("items", []):
        if (it.get("symbol") or "").upper() == (symbol or "").upper():
            return it
    return None
