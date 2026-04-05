"""
Provider 包初始化

【来源】抄自 m2-glue-reference/providers/__init__.py
"""

from .base import IngestProvider, NormalizedFeedItem
from .mock_provider import MockEastmoneyProvider, MockSinaProvider

__all__ = [
    "IngestProvider",
    "NormalizedFeedItem",
    "MockSinaProvider",
    "MockEastmoneyProvider",
]
