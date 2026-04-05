"""
数据源适配器协议：真实 Wind/新浪等实现同接口即可替换 Mock。

【来源】抄自 m2-glue-reference/providers/base.py
【说明】定义 Provider 接口契约和归一化数据结构
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class NormalizedFeedItem:
    """
    归一化后的单条资讯（写入 M1 前可再映射为 `research_messages` 行）。
    
    【来源】抄自 m2-glue-reference/providers/base.py::NormalizedFeedItem
    【扩展】添加 external_ref 字段用于去重（对接 10-数据模型 §2.3 external_ref）
    """

    external_id: str  # 上游原始 ID
    external_ref: str  # 归一化引用，格式: "{source}:{id}"，如 "sina:sina-demo-1001"
    title: str
    summary: str
    published_at_iso: str  # UTC ISO-8601，与 `09` 约定一致
    category: str
    source_system: str  # 如 mock_sina、wind


class IngestProvider(Protocol):
    """
    数据源适配器协议：真实 Wind/新浪等实现同接口即可替换。
    
    【来源】抄自 m2-glue-reference/providers/base.py::IngestProvider
    """
    provider_type: str  # e.g. mock / sina / wind

    def fetch_batch(self, *, limit: int = 50) -> list[NormalizedFeedItem]:
        """拉取一批；失败应在上层记 failed / M2_UPSTREAM_UNAVAILABLE。"""
        ...
