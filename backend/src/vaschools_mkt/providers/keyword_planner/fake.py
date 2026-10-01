"""Volume/CPC giả lập — phát triển không cần Google Ads."""

from datetime import UTC, datetime
from decimal import Decimal

from vaschools_mkt.core.serp import KeywordVolumeMetrics, ProviderCostEstimate


class FakeKeywordPlannerProvider:
    name = "fake"

    async def fetch_metrics(
        self,
        keywords: list[str],
        location: str,
        language: str,
    ) -> list[KeywordVolumeMetrics]:
        now = datetime.now(tz=UTC)
        return [
            KeywordVolumeMetrics(
                keyword=kw,
                search_volume=100 + (hash(kw) % 900),
                cpc_micros=5_000_000 + (hash(kw) % 20_000_000),
                competitive_density=0.35,
                provider=self.name,
                fetched_at=now,
                raw={"keyword": kw, "location": location, "language": language},
                is_range_estimate=False,
            )
            for kw in keywords
        ]

    def estimate_cost(self, keyword_count: int) -> ProviderCostEstimate:
        return ProviderCostEstimate(usd=Decimal("0"), request_units=keyword_count)
