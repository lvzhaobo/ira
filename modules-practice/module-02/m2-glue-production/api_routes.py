"""
M2 Ingest API 路由（Blueprint）

【来源】
  - 结构参考 m2-glue-reference/ 的 Provider + FSM 架构
  - 端点定义严格按照 09-API接口规格.md §3 实现
【说明】实现 /api/v1/ingest 下的所有 P0 端点
"""

from __future__ import annotations

import sys
from pathlib import Path

# 确保当前目录在 Python 路径中
_current_dir = Path(__file__).parent
if str(_current_dir) not in sys.path:
    sys.path.insert(0, str(_current_dir))

import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request

try:
    # 作为包导入
    from job_fsm import JobStatus, transition, IllegalTransitionError
    from providers import MockSinaProvider, MockEastmoneyProvider
except ImportError:
    # 直接运行
    from job_fsm import JobStatus, transition, IllegalTransitionError
    from providers import MockSinaProvider, MockEastmoneyProvider

# 【对接】09-API规格：Blueprint 前缀 /api/v1/ingest
ingest_bp = Blueprint("ingest", __name__, url_prefix="/api/v1/ingest")


# ============================================================
# 内存存储（S0 阶段用，S1 应替换为 PostgreSQL）
# 【来源】新增（参考 10-数据模型 §2.1/2.2 表结构）
# ============================================================

# 模拟 ingest_data_sources 表
_data_sources: dict[str, dict] = {}

# 模拟 ingest_sync_jobs 表
_sync_jobs: dict[str, dict] = {}


def _now_iso() -> str:
    """生成 ISO-8601 UTC 时间戳"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _init_seed_data():
    """
    初始化种子数据（S0 阶段）
    
    【来源】新增（参考 12-实施计划 S0: 种子数据源）
    """
    if not _data_sources:
        _data_sources.update({
            "source-sina-mock": {
                "id": "source-sina-mock",
                "name": "新浪财经 (Mock)",
                "provider_type": "sina",
                "enabled": True,
                "config": {"feed_url": "${IRA_VIN_MOCK_BASE}/mock/v1/sina/finance/news/list.json"},
                "secret_ref": "SINA_API_KEY",
                "last_success_at": None,
                "last_job_id": None,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            },
            "source-em-mock": {
                "id": "source-em-mock",
                "name": "东方财富 (Mock)",
                "provider_type": "eastmoney",
                "enabled": True,
                "config": {"feed_url": "${IRA_VIN_MOCK_BASE}/mock/v1/eastmoney/api/news/flash"},
                "secret_ref": "EASTMONEY_API_KEY",
                "last_success_at": None,
                "last_job_id": None,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
            }
        })


# ============================================================
# 3.1 GET /ingest/health
# 【来源】按照 09-API规格 §3.1 实现
# ============================================================

@ingest_bp.get("/health")
def health():
    """
    健康检查
    
    【对接】09-API规格 §3.1
    """
    return jsonify({
        "status": "ok",
        "module": "M2",
        "version": "1.0.0"
    })


# ============================================================
# 3.2 GET /ingest/sources
# 【来源】按照 09-API规格 §3.2 实现
# ============================================================

@ingest_bp.get("/sources")
def list_sources():
    """
    列出已配置数据源
    
    【对接】09-API规格 §3.2
    【Query】enabledOnly (boolean，默认 false)
    """
    _init_seed_data()
    
    enabled_only = request.args.get("enabledOnly", "false").lower() == "true"
    
    sources = []
    for src in _data_sources.values():
        if enabled_only and not src["enabled"]:
            continue
        
        # 【对接】09-API规格 §2.1 DataSourceSummary DTO
        sources.append({
            "sourceId": src["id"],
            "name": src["name"],
            "providerType": src["provider_type"],
            "enabled": src["enabled"],
            "lastSuccessAt": src["last_success_at"],
            "lastJobStatus": _get_last_job_status(src["last_job_id"]),
            "configSummary": f"标的池 {src['provider_type']}"
        })
    
    return jsonify({"sources": sources})


# ============================================================
# 3.3 GET /ingest/sources/{sourceId}
# 【来源】按照 09-API规格 §3.3 实现
# ============================================================

@ingest_bp.get("/sources/<source_id>")
def get_source(source_id: str):
    """
    获取数据源详情
    
    【对接】09-API规格 §3.3
    """
    _init_seed_data()
    
    src = _data_sources.get(source_id)
    if not src:
        # 【对接】09-API规格 §1.2 错误码 M2_SOURCE_NOT_FOUND
        return jsonify({
            "error": {
                "code": "M2_SOURCE_NOT_FOUND",
                "message": f"数据源 {source_id} 不存在",
                "traceId": str(uuid.uuid4()),
            }
        }), 404
    
    return jsonify({
        "sourceId": src["id"],
        "name": src["name"],
        "providerType": src["provider_type"],
        "enabled": src["enabled"],
        "lastSuccessAt": src["last_success_at"],
        "configSummary": f"标的池 {src['provider_type']}"
    })


# ============================================================
# 3.4 POST /ingest/jobs
# 【来源】按照 09-API规格 §3.4 实现
# ============================================================

@ingest_bp.post("/jobs")
def create_job():
    """
    触发同步任务
    
    【对接】09-API规格 §3.4
    【Body】sourceId, mode (full/incremental), idempotencyKey (可选)
    """
    _init_seed_data()
    
    body = request.get_json(silent=True) or {}
    source_id = body.get("sourceId")
    mode = body.get("mode", "incremental")
    idempotency_key = body.get("idempotencyKey")
    
    # 校验 sourceId
    if not source_id or source_id not in _data_sources:
        return jsonify({
            "error": {
                "code": "M2_SOURCE_NOT_FOUND",
                "message": f"数据源 {source_id} 不存在",
                "traceId": str(uuid.uuid4()),
            }
        }), 404
    
    # 校验 enabled
    if not _data_sources[source_id]["enabled"]:
        return jsonify({
            "error": {
                "code": "M2_VALIDATION_ERROR",
                "message": "数据源已禁用",
                "traceId": str(uuid.uuid4()),
            }
        }), 400
    
    # 幂等检查（24h 内相同 key 返回同一 jobId）
    if idempotency_key:
        for job in _sync_jobs.values():
            if job.get("idempotency_key") == idempotency_key:
                # 【对接】09-API规格 §1.2 M2_IDEMPOTENCY_REPLAY
                return jsonify({
                    "error": {
                        "code": "M2_IDEMPOTENCY_REPLAY",
                        "message": "幂等重放：相同 idempotencyKey 已存在",
                        "traceId": str(uuid.uuid4()),
                        "details": {"existingJobId": job["id"]}
                    }
                }), 409
    
    # 检查是否有运行中的任务
    for job in _sync_jobs.values():
        if job["source_id"] == source_id and job["status"] in ("queued", "running"):
            return jsonify({
                "error": {
                    "code": "M2_JOB_ALREADY_RUNNING",
                    "message": f"数据源 {source_id} 已有运行中的任务",
                    "traceId": str(uuid.uuid4()),
                }
            }), 409
    
    # 创建任务（初始状态 queued）
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "source_id": source_id,
        "status": JobStatus.QUEUED.value,
        "mode": mode,
        "idempotency_key": idempotency_key,
        "stats": {"fetched": 0, "normalized": 0, "publishedToM1": 0, "skipped": 0},
        "errors": [],
        "error_summary": None,
        "started_at": None,
        "completed_at": None,
        "created_at": _now_iso(),
    }
    _sync_jobs[job_id] = job
    
    # 异步执行任务（S0 用同步模拟，S1 应改为 Celery/线程池）
    _execute_job(job_id)
    
    # 【对接】09-API规格 §2.2 SyncJob DTO
    return jsonify(_job_to_dto(job)), 201


# ============================================================
# 3.5 GET /ingest/jobs
# 【来源】按照 09-API规格 §3.5 实现
# ============================================================

@ingest_bp.get("/jobs")
def list_jobs():
    """
    任务历史列表
    
    【对接】09-API规格 §3.5
    【Query】sourceId, status, limit (默认 20)
    """
    source_id = request.args.get("sourceId")
    status = request.args.get("status")
    limit = int(request.args.get("limit", "20"))
    
    jobs = []
    for job in sorted(_sync_jobs.values(), key=lambda j: j["created_at"], reverse=True):
        if source_id and job["source_id"] != source_id:
            continue
        if status and job["status"] != status:
            continue
        
        jobs.append(_job_to_dto(job))
        if len(jobs) >= limit:
            break
    
    return jsonify({"jobs": jobs, "total": len(jobs)})


# ============================================================
# 3.6 GET /ingest/jobs/{jobId}
# 【来源】按照 09-API规格 §3.6 实现
# ============================================================

@ingest_bp.get("/jobs/<job_id>")
def get_job(job_id: str):
    """
    任务详情
    
    【对接】09-API规格 §3.6
    """
    job = _sync_jobs.get(job_id)
    if not job:
        return jsonify({
            "error": {
                "code": "M2_SOURCE_NOT_FOUND",
                "message": f"任务 {job_id} 不存在",
                "traceId": str(uuid.uuid4()),
            }
        }), 404
    
    return jsonify(_job_to_dto(job))


# ============================================================
# 内部辅助函数
# ============================================================

def _get_last_job_status(job_id: str | None) -> str | None:
    """获取最后一次任务的状态"""
    if not job_id:
        return None
    job = _sync_jobs.get(job_id)
    return job["status"] if job else None


def _job_to_dto(job: dict) -> dict:
    """
    将内部 job 记录转换为 09-API规格 §2.2 SyncJob DTO
    
    【对接】09-API规格 §2.2
    """
    return {
        "jobId": job["id"],
        "sourceId": job["source_id"],
        "status": job["status"],
        "mode": job["mode"],
        "startedAt": job["started_at"],
        "completedAt": job["completed_at"],
        "stats": job["stats"],
        "errorSummary": job["error_summary"],
        "errors": job["errors"],
    }


def _execute_job(job_id: str):
    """
    执行同步任务（S0 同步模拟，S1 应改为异步 worker）
    
    【来源】新增（整合 Provider + FSM + 写库逻辑）
    【对接】
      - 使用 providers/mock_provider.py 拉取数据
      - 使用 job_fsm.py 管理状态转移
      - 写入 ingest_feed_items（S0 用内存模拟）
    """
    job = _sync_jobs[job_id]
    source_id = job["source_id"]
    source = _data_sources[source_id]
    
    try:
        # 状态转移: queued -> running
        job["status"] = transition(JobStatus(job["status"]), JobStatus.RUNNING).value
        job["started_at"] = _now_iso()
        
        # 根据 provider_type 创建 Provider 实例
        if source["provider_type"] == "sina":
            provider = MockSinaProvider()
        elif source["provider_type"] == "eastmoney":
            provider = MockEastmoneyProvider()
        else:
            raise ValueError(f"不支持的 provider_type: {source['provider_type']}")
        
        # 拉取数据
        items = provider.fetch_batch(limit=50)
        
        # 更新 stats
        job["stats"]["fetched"] = len(items)
        job["stats"]["normalized"] = len(items)
        
        # S0 阶段：仅记录到内存，S1 应写入 ingest_feed_items / M1
        # TODO(S1): 写入 PostgreSQL ingest_feed_items 表
        print(f"[M2 Job {job_id}] 成功拉取 {len(items)} 条资讯")
        
        # 状态转移: running -> success
        job["status"] = transition(JobStatus(job["status"]), JobStatus.SUCCESS).value
        job["completed_at"] = _now_iso()
        
        # 更新数据源的 last_success_at
        _data_sources[source_id]["last_success_at"] = job["completed_at"]
        _data_sources[source_id]["last_job_id"] = job_id
        
    except Exception as e:
        # 状态转移: running -> failed
        job["status"] = transition(JobStatus(job["status"]), JobStatus.FAILED).value
        job["completed_at"] = _now_iso()
        job["error_summary"] = str(e)
        job["errors"].append({
            "code": "M2_UPSTREAM_UNAVAILABLE",
            "message": str(e),
            "batchHint": "fetch_batch"
        })
