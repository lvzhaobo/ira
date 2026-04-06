"""确定性 Mock 源：无网络，便于单测与演示管道。"""

from __future__ import annotations

from .base import NormalizedFeedItem


class MockSinaLikeProvider:
    provider_type = "mock"

    def fetch_batch(self, *, limit: int = 50) -> list[NormalizedFeedItem]:
        n = min(limit, 3)
        out: list[NormalizedFeedItem] = []
        for i in range(n):
            out.append(
                NormalizedFeedItem(
                    external_id=f"mock-sina-{i + 1}",
                    title=f"[Mock] 市场速递 {i + 1}",
                    summary="演示用摘要：实际接入时由适配器填充。",
                    published_at_iso="2026-04-04T00:00:00Z",
                    category="market",
                    source_system="mock_sina",
                )
            )
        return out
