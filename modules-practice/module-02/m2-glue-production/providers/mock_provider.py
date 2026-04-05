"""
Mock Provider：从 ira.vin Mock 服务拉取数据并归一化。

【来源】
  - 基础结构抄自 m2-glue-reference/providers/mock_provider.py
  - 数据格式对接 ira-vin-mocks/app.py 的新浪/东财接口
【说明】实现真实 HTTP 请求，从 Mock 服务拉取数据并归一化为 NormalizedFeedItem
"""

from __future__ import annotations

import os
from typing import Optional

import requests

from .base import IngestProvider, NormalizedFeedItem


class MockSinaProvider:
    """
    新浪财经 Mock Provider（从 ira.vin 拉取）
    
    【来源】改造自 m2-glue-reference/providers/mock_provider.py::MockSinaLikeProvider
    【扩展】
      - 从硬编码改为真实 HTTP 请求
      - 对接 ira-vin-mocks/app.py::sina_news_list 接口
      - 归一化 external_ref 格式为 "sina:{id}"
    """
    provider_type = "sina"

    def __init__(self, base_url: Optional[str] = None):
        """
        初始化 Mock Provider
        
        【来源】新增（参考 ira-vin-mocks/README.md 的环境变量约定）
        """
        self.base_url = base_url or os.getenv("SINA_FEED_URL")
        if not self.base_url:
            raise ValueError(
                "SINA_FEED_URL 环境变量未设置，"
                "请配置为 ${IRA_VIN_MOCK_BASE}/mock/v1/sina/finance/news/list.json"
            )

    def fetch_batch(self, *, limit: int = 50) -> list[NormalizedFeedItem]:
        """
        从 Mock 服务拉取新浪资讯并归一化
        
        【来源】改造自 m2-glue-reference/providers/mock_provider.py::fetch_batch
        【对接】ira-vin-mocks/app.py::sina_news_list 返回结构
        """
        try:
            resp = requests.get(self.base_url, params={"page": 1}, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            raise RuntimeError(f"新浪 Mock 源不可用: {e}") from e

        # 解析 ira.vin Mock 响应结构
        items_data = data.get("result", {}).get("data", {}).get("items", [])
        
        out: list[NormalizedFeedItem] = []
        for item in items_data[:limit]:
            # 【对接】10-数据模型：external_ref 格式 "sina:<id>"
            external_id = item["id"]
            external_ref = f"sina:{external_id}"
            
            # 【对接】09-API规格：时间使用 ISO-8601 UTC
            # ira.vin Mock 返回 "2026-04-04 09:35:00"，需转换为 ISO-8601
            published_at = item["ctime"].replace(" ", "T") + "Z"
            
            out.append(
                NormalizedFeedItem(
                    external_id=external_id,
                    external_ref=external_ref,
                    title=item["title"],
                    summary=item.get("summary", ""),
                    published_at_iso=published_at,
                    category=item.get("channel", "market"),
                    source_system="mock_sina",
                )
            )
        
        return out


class MockEastmoneyProvider:
    """
    东方财富 Mock Provider（从 ira.vin 拉取）
    
    【来源】新增（对接 ira-vin-mocks/app.py::eastmoney_flash）
    【说明】结构同 MockSinaProvider，适配东财 JSON 格式
    """
    provider_type = "eastmoney"

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("EASTMONEY_FLASH_URL")
        if not self.base_url:
            raise ValueError(
                "EASTMONEY_FLASH_URL 环境变量未设置，"
                "请配置为 ${IRA_VIN_MOCK_BASE}/mock/v1/eastmoney/api/news/flash"
            )

    def fetch_batch(self, *, limit: int = 50) -> list[NormalizedFeedItem]:
        """
        从 Mock 服务拉取东财快讯并归一化
        
        【对接】ira-vin-mocks/app.py::eastmoney_flash 返回结构
        """
        try:
            resp = requests.get(self.base_url, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            raise RuntimeError(f"东财 Mock 源不可用: {e}") from e

        items_data = data.get("data", [])
        
        out: list[NormalizedFeedItem] = []
        for item in items_data[:limit]:
            # 【对接】10-数据模型：external_ref 格式 "em:<art_code>"
            external_id = item["art_code"]
            external_ref = f"em:{external_id}"
            
            # 时间格式转换
            published_at = item["show_time"].replace(" ", "T") + "Z"
            
            out.append(
                NormalizedFeedItem(
                    external_id=external_id,
                    external_ref=external_ref,
                    title=item["title"],
                    summary=item.get("digest", ""),
                    published_at_iso=published_at,
                    category=item.get("column", "market"),
                    source_system="mock_eastmoney",
                )
            )
        
        return out
