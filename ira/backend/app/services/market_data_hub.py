from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4
import os
import time

from app.json_store import read_json, write_json
from flask import current_app
import requests


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
            "config": {"api_path": "/products"},
            "updated_at": _now_iso(),
        },
        {
            "id": "source-em-mock",
            "name": "东方财富 (Mock)",
            "provider_type": "eastmoney",
            "enabled": True,
            "config": {"api_path": "/products"},
            "updated_at": _now_iso(),
        },
        {
            "id": "source-wind-mock",
            "name": "Wind (Mock)",
            "provider_type": "wind",
            "enabled": True,
            "config": {"api_path": "/stats"},
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


def get_source(source_id: str) -> dict[str, Any] | None:
    return next((s for s in list_sources(False) if s.get("id") == source_id), None)


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


def _all_jobs() -> list[dict[str, Any]]:
    payload = read_json(_data("ingest_sync_jobs.json"), {"items": []})
    return payload.get("items", [])


def list_jobs(limit: int = 20) -> list[dict[str, Any]]:
    _refresh_all_jobs()
    items = _all_jobs()
    return items[: max(1, limit)]


def _find_job_by_idempotency(source_id: str, idempotency_key: str | None) -> dict[str, Any] | None:
    if not idempotency_key:
        return None
    for it in _all_jobs():
        if it.get("source_id") == source_id and it.get("idempotency_key") == idempotency_key:
            return it
    return None


def _has_running_job(source_id: str) -> bool:
    for it in _all_jobs():
        if it.get("source_id") == source_id and it.get("status") in ("queued", "running"):
            return True
    return False


def _append_snapshot(snapshot: dict[str, Any]) -> None:
    path = _data("market_snapshots.json")
    payload = read_json(path, {"items": []})
    payload["items"].insert(0, snapshot)
    write_json(path, payload)


def _snapshot_exists(snapshot_id: str) -> bool:
    payload = read_json(_data("market_snapshots.json"), {"items": []})
    return any((it.get("snapshot_id") == snapshot_id) for it in payload.get("items", []))


def _mock_api_base_url() -> str:
    return (os.environ.get("IRA_MOCK_API_BASE_URL") or "http://127.0.0.1:5001").rstrip("/")


def _fallback_quote(provider_type: str) -> dict[str, Any]:
    if provider_type == "sina":
        return {"last": 1688.0, "pe_ttm": 28.1}
    if provider_type == "eastmoney":
        return {"last": 1666.0, "pe_ttm": 27.4}
    if provider_type == "wind":
        return {"last": 1701.0, "pe_ttm": 29.2}
    return {"last": 1680.0, "pe_ttm": 28.0}


def _fetch_mock_quote(src: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    """
    从 demo/mock-api 拉取可复用的 mock 原料，组装成统一 quote。
    返回 (quote, fetched_from_remote)。
    """
    provider_type = str(src.get("provider_type") or "unknown")
    api_path = ((src.get("config") or {}).get("api_path") or "/products").strip()
    url = f"{_mock_api_base_url()}{api_path if api_path.startswith('/') else '/' + api_path}"
    try:
        r = requests.get(url, timeout=3)
        data = r.json() if r.status_code == 200 else {}
        # demo/mock-api 目前提供 products/stats，不是金融专用；这里做“统一适配”。
        if api_path == "/products":
            items = (data or {}).get("data") or []
            if items:
                p = items[0]
                price = float(p.get("price") or 0) * 10
                pe = 20 + float(p.get("stock") or 0) / 10
                return {"last": round(price, 2), "pe_ttm": round(pe, 2)}, True
        if api_path == "/stats":
            stats = (data or {}).get("data") or {}
            users = int(stats.get("total_users") or 0)
            products = int(stats.get("total_products") or 0)
            orders = int(stats.get("total_orders") or 0)
            return {"last": 1600 + users * 10 + products, "pe_ttm": round(18 + orders / 10, 2)}, True
    except Exception:
        pass
    return _fallback_quote(provider_type), False


def _schedule_delays_sec() -> tuple[float, float]:
    """
    返回 (queued->running 秒, running->success 秒)。
    测试模式下置 0，避免拖慢单测；运行环境默认使用短延迟模拟异步流程。
    """
    if current_app.config.get("TESTING"):
        return 0.0, 0.0
    q = float(os.environ.get("IRA_INGEST_QUEUE_SEC", "1.0"))
    r = float(os.environ.get("IRA_INGEST_RUNNING_SEC", "2.0"))
    return max(0.0, q), max(0.0, r)


def create_job(
    source_id: str,
    symbol: str = "600519.SH",
    mode: str = "incremental",
    idempotency_key: str | None = None,
) -> dict[str, Any]:
    src = get_source(source_id)
    if not src:
        raise ValueError("SOURCE_NOT_FOUND")
    if not src.get("enabled", True):
        raise ValueError("SOURCE_DISABLED")

    replay = _find_job_by_idempotency(source_id, idempotency_key)
    if replay:
        raise RuntimeError(f"IDEMPOTENCY_REPLAY:{replay.get('job_id')}")
    if _has_running_job(source_id):
        raise RuntimeError("JOB_ALREADY_RUNNING")

    now = _now_iso()
    now_ts = time.time()
    queue_sec, run_sec = _schedule_delays_sec()
    job_id = f"job-{uuid4().hex[:10]}"
    snapshot_id = f"snap-{uuid4().hex[:10]}"
    queued_job = {
        "job_id": job_id,
        "source_id": source_id,
        "source_name": src.get("name"),
        "status": "queued",
        "mode": mode,
        "symbol": symbol,
        "started_at": None,
        "finished_at": None,
        "stats": {"fetched": 0, "normalized": 0, "published": 0},
        "market_snapshot_id": snapshot_id,
        "idempotency_key": idempotency_key,
        "created_at": now,
        "run_after_ts": now_ts + queue_sec,
        "finish_after_ts": now_ts + queue_sec + run_sec,
    }
    _write_job(queued_job)
    return refresh_job(job_id) or queued_job


def _replace_job(job_id: str, updater) -> dict[str, Any] | None:
    path = _data("ingest_sync_jobs.json")
    payload = read_json(path, {"items": []})
    items = payload.get("items", [])
    updated = None
    for idx, it in enumerate(items):
        if it.get("job_id") == job_id:
            it2 = dict(it)
            updater(it2)
            items[idx] = it2
            updated = it2
            break
    payload["items"] = items
    write_json(path, payload)
    return updated


def _promote_job_to_running(job_id: str) -> dict[str, Any] | None:
    now = _now_iso()
    return _replace_job(job_id, lambda j: j.update({"status": "running", "started_at": now}))


def _finalize_job_success(job_id: str, symbol: str, snapshot_id: str) -> dict[str, Any] | None:
    job = get_job(job_id)
    if not job:
        return None
    src = get_source(str(job.get("source_id") or ""))
    quote, fetched = _fetch_mock_quote(src or {})
    now = _now_iso()
    out = _replace_job(
        job_id,
        lambda j: j.update(
            {
                "status": "success",
                "finished_at": now,
                "stats": {"fetched": 1 if fetched else 0, "normalized": 1, "published": 1},
            }
        ),
    )
    if not _snapshot_exists(snapshot_id):
        _append_snapshot(
            {
                "snapshot_id": snapshot_id,
                "symbol": symbol,
                "as_of": now,
                "source_id": job.get("source_id"),
                "source_name": job.get("source_name"),
                "provider_type": (src or {}).get("provider_type"),
                "mock": True,
                "quote": quote,
                "upstream": {"base_url": _mock_api_base_url(), "fetched": fetched},
            }
        )
    return out


def _refresh_job(job: dict[str, Any]) -> dict[str, Any]:
    status = str(job.get("status") or "")
    if status in ("success", "failed"):
        return job
    now_ts = time.time()
    run_after = float(job.get("run_after_ts") or 0.0)
    finish_after = float(job.get("finish_after_ts") or 0.0)
    job_id = str(job.get("job_id") or "")
    symbol = str(job.get("symbol") or "600519.SH")
    snapshot_id = str(job.get("market_snapshot_id") or "")
    if status == "queued" and now_ts >= run_after:
        _promote_job_to_running(job_id)
        job = get_job(job_id) or job
        status = str(job.get("status") or "")
    if status == "running" and now_ts >= finish_after:
        _finalize_job_success(job_id, symbol=symbol, snapshot_id=snapshot_id)
        job = get_job(job_id) or job
    return job


def _refresh_all_jobs() -> None:
    payload = read_json(_data("ingest_sync_jobs.json"), {"items": []})
    items = payload.get("items", [])
    for it in items:
        _refresh_job(it)


def refresh_job(job_id: str) -> dict[str, Any] | None:
    job = get_job(job_id)
    if not job:
        return None
    return _refresh_job(job)


def create_sync_job(source_id: str, symbol: str = "600519.SH", mode: str = "incremental") -> dict[str, Any]:
    # 兼容旧调用，转到新 job 语义
    return create_job(source_id=source_id, symbol=symbol, mode=mode, idempotency_key=None)


def latest_snapshot(symbol: str) -> dict[str, Any] | None:
    payload = read_json(_data("market_snapshots.json"), {"items": []})
    for it in payload.get("items", []):
        if (it.get("symbol") or "").upper() == (symbol or "").upper():
            return it
    return None
