"""Sync job 合法状态转移（对齐 M2 `09` §2.2 `SyncJob.status`）。"""

from __future__ import annotations

from enum import Enum


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


_ALLOWED: dict[JobStatus, frozenset[JobStatus]] = {
    JobStatus.QUEUED: frozenset({JobStatus.RUNNING, JobStatus.CANCELLED}),
    JobStatus.RUNNING: frozenset(
        {JobStatus.SUCCESS, JobStatus.FAILED, JobStatus.PARTIAL, JobStatus.CANCELLED}
    ),
    JobStatus.SUCCESS: frozenset(),
    JobStatus.FAILED: frozenset(),
    JobStatus.PARTIAL: frozenset(),
    JobStatus.CANCELLED: frozenset(),
}


class IllegalTransitionError(ValueError):
    pass


def transition(current: JobStatus, target: JobStatus) -> JobStatus:
    if target not in _ALLOWED[current]:
        raise IllegalTransitionError(f"{current.value} -> {target.value} not allowed")
    return target
