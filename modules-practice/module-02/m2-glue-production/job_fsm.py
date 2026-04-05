"""
Sync job 合法状态转移（对齐 M2 `09` §2.2 `SyncJob.status`）。

【来源】抄自 m2-glue-reference/job_fsm.py
【说明】实现任务状态机，确保状态转移合法
"""

from __future__ import annotations

from enum import Enum


class JobStatus(str, Enum):
    """
    任务状态枚举
    
    【来源】抄自 m2-glue-reference/job_fsm.py::JobStatus
    【对接】09-API规格 §2.2 SyncJob.status
    """
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


# 合法状态转移表
# 【来源】抄自 m2-glue-reference/job_fsm.py::_ALLOWED
_ALLOWED: dict[JobStatus, frozenset[JobStatus]] = {
    JobStatus.QUEUED: frozenset({JobStatus.RUNNING, JobStatus.CANCELLED}),
    JobStatus.RUNNING: frozenset(
        {JobStatus.SUCCESS, JobStatus.FAILED, JobStatus.PARTIAL, JobStatus.CANCELLED}
    ),
    JobStatus.SUCCESS: frozenset(),  # 终态
    JobStatus.FAILED: frozenset(),   # 终态
    JobStatus.PARTIAL: frozenset(),  # 终态
    JobStatus.CANCELLED: frozenset(),  # 终态
}


class IllegalTransitionError(ValueError):
    """
    非法状态转移异常
    
    【来源】抄自 m2-glue-reference/job_fsm.py::IllegalTransitionError
    """
    pass


def transition(current: JobStatus, target: JobStatus) -> JobStatus:
    """
    执行状态转移，若非法则抛出 IllegalTransitionError
    
    【来源】抄自 m2-glue-reference/job_fsm.py::transition
    """
    if target not in _ALLOWED[current]:
        raise IllegalTransitionError(f"{current.value} -> {target.value} not allowed")
    return target
