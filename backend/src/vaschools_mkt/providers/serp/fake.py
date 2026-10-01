"""Đọc fixture — không gọi mạng."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

from vaschools_mkt.core.serp import ProviderCostEstimate, SerpResponse, SerpResult
from vaschools_mkt.providers.errors import ProviderSchemaError

_DEFAULT_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_google_vi.json"


class FakeSerpProvider:
    name = "fake"

    def __init__(self, fixture_path: Path | None = None) -> None:
        self._fixture_path = fixture_path or _DEFAULT_FIXTURE

    async def fetch_serp(
        self,
        keywords: list[str],
        location: str,
        language: str,
        device: str,
        depth: int = 100,
    ) -> list[SerpResponse]:
        if len(keywords) > 100:
            msg = "FakeSerpProvider: tối đa 100 từ khóa mỗi lần gọi"
            raise ValueError(msg)

        template = self._load_template()
        now = datetime.now(tz=UTC)
        out: list[SerpResponse] = []
        for kw in keywords:
            raw = dict(template)
            raw["keyword"] = kw
            parsed = raw.get("parsed") or {}
            raw_results = parsed.get("results") or []
            results = [SerpResult.model_validate(item) for item in raw_results]
            if depth < len(results):
                results = results[:depth]
            out.append(
                SerpResponse(
                    keyword=kw,
                    location=location,
                    language=language,
                    device=device,
                    results=results,
                    features=list(parsed.get("features") or []),
                    results_count=parsed.get("results_count"),
                    provider=self.name,
                    fetched_at=now,
                    raw=raw,
                )
            )
        return out

    def estimate_cost(self, keyword_count: int) -> ProviderCostEstimate:
        return ProviderCostEstimate(usd=Decimal("0"), request_units=keyword_count)

    def _load_template(self) -> dict:
        if not self._fixture_path.is_file():
            msg = f"Thiếu fixture SERP: {self._fixture_path}"
            raise ProviderSchemaError(msg)
        data = json.loads(self._fixture_path.read_text(encoding="utf-8"))
        if "parsed" not in data:
            raise ProviderSchemaError("Fixture SERP thiếu khóa 'parsed'")
        return data
