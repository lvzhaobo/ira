"""数据源适配器协议：真实 Wind/新浪等实现同接口即可替换 Mock。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class NormalizedFeedItem:
    """归一化后的单条资讯（写入 M1 前可再映射为 `research_messages` 行）。"""

    external_id: str
    title: str
    summary: str
    published_at_iso: str  # UTC ISO-8601，与 `09` 约定一致
    category: str
    source_system: str  # 如 mock_sina、wind


class IngestProvider(Protocol):
    provider_type: str  # e.g. mock / sina / wind

    def fetch_batch(self, *, limit: int = 50) -> list[NormalizedFeedItem]:
        """拉取一批；失败应在上层记 failed / M2_UPSTREAM_UNAVAILABLE。"""
        ...
