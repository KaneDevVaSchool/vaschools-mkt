"""Tìm kiếm / khám phá từ khóa qua SerpAPI — tuần 1 (dev, có phí/request)."""

from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from vaschools_mkt.api.deps import get_current_user
from vaschools_mkt.api.provider_http import raise_provider_http
from vaschools_mkt.api.serp_access import assert_serp_search_allowed
from vaschools_mkt.core.config import settings
from vaschools_mkt.core.models import SessionUser
from vaschools_mkt.core.provenance import Provenance
from vaschools_mkt.core.serp_discovery import extract_keyword_ideas
from vaschools_mkt.providers.errors import ProviderError
from vaschools_mkt.providers.registry import get_serp_provider

router = APIRouter(prefix="/serp", tags=["serp"])


def _metric(value, provenance: Provenance, note: str | None = None):
    out: dict = {"value": value, "provenance": provenance.value}
    if note:
        out["note"] = note
    return out


class SerpSearchIn(BaseModel):
    q: str = Field(min_length=1, max_length=200)
    depth: int = Field(default=10, ge=1, le=20)


@router.post("/search")
async def serp_search(
    body: SerpSearchIn,
    _user: SessionUser = Depends(get_current_user),
):
    """Gọi Google SERP qua SerpAPI; trả organic + gợi ý (related, PAA)."""

    assert_serp_search_allowed()

    query = body.q.strip()
    provider = get_serp_provider()
    cost = provider.estimate_cost(1)

    try:
        responses = await provider.fetch_serp(
            [query],
            location=settings.serp_default_location,
            language=settings.serp_default_language,
            device="desktop",
            depth=body.depth,
        )
    except ProviderError as exc:
        raise_provider_http(exc)

    response = responses[0]
    ideas = extract_keyword_ideas(response.raw, seed_query=query)
    now = datetime.now(tz=UTC).isoformat()

    organic = [
        {
            "position": _metric(r.position, Provenance.OBSERVED),
            "domain": r.domain,
            "url": r.url,
            "title": r.title,
            "description": r.description,
        }
        for r in response.results
    ]

    return {
        "data": {
            "query": query,
            "provider": response.provider,
            "features": response.features,
            "results_count": _metric(response.results_count, Provenance.OBSERVED),
            "ideas": [
                {
                    "text": item["text"],
                    "kind": item["kind"],
                    "provenance": Provenance.OBSERVED.value,
                }
                for item in ideas
            ],
            "organic": organic,
            "estimated_cost_usd": str(cost.usd.quantize(Decimal("0.0001"))),
        },
        "meta": {"data_fetched_at": now, "is_stale": False},
    }
