"""Protocol cho adapter — chỉ layer này gọi HTTP ra ngoài."""

from typing import Protocol

from vaschools_mkt.core.serp import KeywordVolumeMetrics, ProviderCostEstimate, SerpResponse


class SerpProvider(Protocol):
    name: str

    async def fetch_serp(
        self,
        keywords: list[str],
        location: str,
        language: str,
        device: str,
        depth: int = 100,
    ) -> list[SerpResponse]:
        """Tối đa 100 từ khóa."""

    def estimate_cost(self, keyword_count: int) -> ProviderCostEstimate:
        """Chi phí ước tính trước khi gọi — phục vụ quota guard tuần 2+."""


class KeywordPlannerProvider(Protocol):
    name: str

    async def fetch_metrics(
        self,
        keywords: list[str],
        location: str,
        language: str,
    ) -> list[KeywordVolumeMetrics]:
        """Volume/CPC — tối đa theo giới hạn API (thường ~1000)."""

    def estimate_cost(self, keyword_count: int) -> ProviderCostEstimate:
        ...
