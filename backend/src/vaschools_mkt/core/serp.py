"""Model SERP nội bộ — mọi adapter chuẩn hóa về đây (xem provider-abstraction.md)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SerpResult(BaseModel):
    position: int
    url: str
    domain: str
    title: str
    description: str | None = None


class SerpResponse(BaseModel):
    keyword: str
    location: str
    language: str
    device: str
    results: list[SerpResult]
    features: list[str] = Field(default_factory=list)
    results_count: int | None = None
    provider: str
    fetched_at: datetime
    raw: dict


class KeywordVolumeMetrics(BaseModel):
    keyword: str
    search_volume: int | None = None
    cpc_micros: int | None = None
    competitive_density: float | None = None
    provider: str
    fetched_at: datetime
    raw: dict
    is_range_estimate: bool = False


class ProviderCostEstimate(BaseModel):
    usd: Decimal
    request_units: int
