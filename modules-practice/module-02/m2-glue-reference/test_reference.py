import pytest

from job_fsm import IllegalTransitionError, JobStatus, transition
from providers import MockSinaLikeProvider


def test_fsm_happy_path():
    s = JobStatus.QUEUED
    s = transition(s, JobStatus.RUNNING)
    s = transition(s, JobStatus.SUCCESS)
    assert s == JobStatus.SUCCESS


def test_fsm_rejects_skip_running():
    with pytest.raises(IllegalTransitionError):
        transition(JobStatus.QUEUED, JobStatus.SUCCESS)


def test_mock_provider_deterministic():
    p = MockSinaLikeProvider()
    items = p.fetch_batch(limit=10)
    assert len(items) == 3
    assert items[0].external_id == "mock-sina-1"
    assert items[0].source_system == "mock_sina"
