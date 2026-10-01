"""SerpAPI adapter — 1 từ khóa / request (khác DataForSEO batch 100)."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from decimal import Decimal
from urllib.parse import urlparse

import httpx

from vaschools_mkt.core.config import settings
from vaschools_mkt.core.serp import ProviderCostEstimate, SerpResponse, SerpResult
from vaschools_mkt.providers.errors import (
    ProviderAuthError,
    ProviderNotConfigured,
    ProviderQuotaExceeded,
    ProviderRateLimited,
    ProviderSchemaError,
    ProviderUnavailable,
)

log = logging.getLogger(__name__)

_SEARCH_URL = "https://serpapi.com/search.json"

# SerpAPI field → tên feature nội bộ (provider-abstraction.md)
_FEATURE_MAP: dict[str, str] = {
    "answer_box": "featured_snippet",
    "related_questions": "people_also_ask",
    "local_results": "local_pack",
    "inline_images": "image_pack",
    "inline_videos": "video",
    "shopping_results": "shopping",
    "knowledge_graph": "knowledge_panel",
    "top_stories": "video",
    "ads": "top_ads",
    "ads_bottom": "bottom_ads",
}

# Chi phí ước tính / search (USD) — hiệu chỉnh cuối tháng 1 theo hóa đơn SerpAPI
_EST_USD_PER_SEARCH = Decimal("0.0075")


def _registrable_domain(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if host.startswith("www."):
        return host[4:]
    return host


def _location_params(location: str) -> dict[str, str]:
    loc = location.strip().lower()
    if loc in {"vn", "vietnam", "việt nam"}:
        return {"gl": "vn", "google_domain": "google.com.vn"}
    return {"gl": "vn", "google_domain": "google.com.vn"}


def _extract_features(payload: dict) -> list[str]:
    features: list[str] = []
    for key, name in _FEATURE_MAP.items():
        val = payload.get(key)
        if val:
            features.append(name)
    return features


def _parse_organic(payload: dict, depth: int) -> list[SerpResult]:
    organic = payload.get("organic_results")
    if organic is None:
        raise ProviderSchemaError("SerpAPI response thiếu organic_results")
    if not isinstance(organic, list):
        raise ProviderSchemaError("SerpAPI organic_results không phải list")

    out: list[SerpResult] = []
    for item in organic[:depth]:
        if not isinstance(item, dict):
            continue
        link = item.get("link") or item.get("url")
        if not link:
            continue
        position = item.get("position")
        if position is None:
            continue
        out.append(
            SerpResult(
                position=int(position),
                url=str(link),
                domain=_registrable_domain(str(link)),
                title=str(item.get("title") or ""),
                description=item.get("snippet") or item.get("description"),
            )
        )
    return out


def _raise_for_payload(payload: dict, status: int) -> None:
    err = payload.get("error")
    if err:
        msg = str(err)
        lowered = msg.lower()
        if "invalid api key" in lowered or "unauthorized" in lowered:
            raise ProviderAuthError(msg)
        if "run out of searches" in lowered or "quota" in lowered:
            raise ProviderQuotaExceeded(msg)
        if status == 429:
            raise ProviderRateLimited(msg)
        raise ProviderUnavailable(msg)

    if status == 401 or status == 403:
        raise ProviderAuthError(f"SerpAPI HTTP {status}")
    if status == 429:
        raise ProviderRateLimited("SerpAPI HTTP 429")
    if status >= 500:
        raise ProviderUnavailable(f"SerpAPI HTTP {status}")
    if status >= 400:
        raise ProviderUnavailable(f"SerpAPI HTTP {status}: {payload}")


class SerpApiProvider:
    name = "serpapi"

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or settings.serp_api_key
        if not self._api_key:
            raise ProviderNotConfigured("Thiếu SERP_API_KEY cho SerpAPI")

    async def fetch_serp(
        self,
        keywords: list[str],
        location: str,
        language: str,
        device: str,
        depth: int = 100,
    ) -> list[SerpResponse]:
        if len(keywords) > 100:
            msg = "SerpApiProvider: tối đa 100 từ khóa mỗi lần gọi"
            raise ValueError(msg)

        depth = min(max(depth, 1), 100)
        loc = _location_params(location)

        async with httpx.AsyncClient(timeout=120.0) as client:
            tasks = [
                self._fetch_one(client, kw, location, loc, language, device, depth)
                for kw in keywords
            ]
            return list(await asyncio.gather(*tasks))

    async def _fetch_one(
        self,
        client: httpx.AsyncClient,
        keyword: str,
        location: str,
        loc: dict[str, str],
        language: str,
        device: str,
        depth: int,
    ) -> SerpResponse:
        params = {
            "engine": "google",
            "q": keyword,
            "api_key": self._api_key,
            "hl": language,
            "device": device,
            "num": depth,
            **loc,
        }
        resp = await client.get(_SEARCH_URL, params=params)
        try:
            payload = resp.json()
        except Exception as exc:
            raise ProviderSchemaError(f"SerpAPI JSON không hợp lệ: {exc}") from exc

        if not isinstance(payload, dict):
            raise ProviderSchemaError("SerpAPI response root không phải object")

        _raise_for_payload(payload, resp.status_code)

        results = _parse_organic(payload, depth)
        features = _extract_features(payload)
        now = datetime.now(tz=UTC)
        results_count = payload.get("search_information", {}).get("total_results")
        if isinstance(results_count, str):
            try:
                results_count = int(results_count.replace(",", ""))
            except ValueError:
                results_count = None

        return SerpResponse(
            keyword=keyword,
            location=location,
            language=language,
            device=device,
            results=results,
            features=features,
            results_count=results_count if isinstance(results_count, int) else None,
            provider=self.name,
            fetched_at=now,
            raw=payload,
        )

    def estimate_cost(self, keyword_count: int) -> ProviderCostEstimate:
        return ProviderCostEstimate(
            usd=_EST_USD_PER_SEARCH * keyword_count,
            request_units=keyword_count,
        )
