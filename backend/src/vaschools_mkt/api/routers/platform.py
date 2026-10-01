"""Trạng thái hạ tầng — tuần 1."""

from datetime import UTC, datetime
from decimal import Decimal

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError

from vaschools_mkt.api.deps import get_current_user
from vaschools_mkt.api.provider_http import raise_provider_http
from vaschools_mkt.core.config import settings
from vaschools_mkt.core.models import SessionUser
from vaschools_mkt.core.provenance import Provenance
from vaschools_mkt.db.models import Domain, Keyword, SerpSnapshot
from vaschools_mkt.db.session import async_session_factory, engine
from vaschools_mkt.ingestion.serp_persist import find_keyword_id_for_text, persist_serp_response
from vaschools_mkt.providers.errors import ProviderError
from vaschools_mkt.providers.registry import get_serp_provider

router = APIRouter(prefix="/platform", tags=["platform"])


def _metric(value: int | str | bool | None, provenance: Provenance, note: str | None = None):
    out: dict = {"value": value, "provenance": provenance.value}
    if note:
        out["note"] = note
    return out


async def _db_ok() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def _redis_ok() -> bool:
    try:
        client = redis.from_url(settings.redis_url)
        try:
            return bool(await client.ping())
        finally:
            await client.aclose()
    except Exception:
        return False


@router.get("/status")
async def platform_status(
    _user: SessionUser = Depends(get_current_user),
):
    db_ok = await _db_ok()
    redis_ok = await _redis_ok()
    keyword_total = 0
    serp_snapshot_total = 0
    by_source: dict[str, int] = {}
    our_domain: str | None = None

    if db_ok:
        async with async_session_factory() as session:
            total = await session.execute(select(func.count()).select_from(Keyword))
            keyword_total = int(total.scalar_one())

            snap = await session.execute(select(func.count()).select_from(SerpSnapshot))
            serp_snapshot_total = int(snap.scalar_one())

            rows = await session.execute(
                select(Keyword.source, func.count())
                .group_by(Keyword.source)
                .order_by(func.count().desc())
            )
            for source, count in rows.all():
                key = source or "unknown"
                by_source[key] = int(count)

            dom = await session.execute(
                select(Domain.domain).where(Domain.is_ours.is_(True)).limit(1)
            )
            our_domain = dom.scalar_one_or_none()

    now = datetime.now(tz=UTC).isoformat()
    week1_goal = keyword_total >= 2000

    return {
        "data": {
            "week": 1,
            "database": _metric(db_ok, Provenance.MEASURED),
            "redis": _metric(redis_ok, Provenance.MEASURED),
            "keyword_total": _metric(
                keyword_total,
                Provenance.MEASURED,
                None if week1_goal else "Mục tiêu tuần 1: ≥ 2.000 từ khóa nền",
            ),
            "keywords_by_source": by_source,
            "week1_seed_goal_met": _metric(week1_goal, Provenance.MEASURED),
            "our_domain": our_domain,
            "serp_provider": settings.serp_provider,
            "serp_provider_configured": settings.serp_provider_configured,
            "serp_snapshot_total": _metric(serp_snapshot_total, Provenance.MEASURED),
            "google_ads_configured": settings.google_ads_configured,
            "environment": settings.environment,
        },
        "meta": {"data_fetched_at": now, "is_stale": False},
    }


class SerpProbeIn(BaseModel):
    keyword: str = Field(default="trường quốc tế tphcm", min_length=1, max_length=200)
    depth: int = Field(default=10, ge=1, le=20)
    persist: bool = True


@router.post("/serp-probe")
async def serp_probe(
    body: SerpProbeIn,
    _user: SessionUser = Depends(get_current_user),
):
    """Gọi SerpAPI thật (tuần 1). Chỉ bật ở development — production dùng job batch tuần 2+."""

    if settings.environment != "development":
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Probe SERP chỉ dùng trong môi trường development.",
                }
            },
        )
    if settings.serp_provider == "fake":
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "SERP_FAKE",
                    "message": "Đặt SERP_PROVIDER=serpapi và SERP_API_KEY trong .env.",
                }
            },
        )
    if not settings.serp_provider_configured:
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "PROVIDER_NOT_CONFIGURED",
                    "message": "Thiếu cấu hình SerpAPI (SERP_API_KEY).",
                }
            },
        )

    provider = get_serp_provider()
    cost = provider.estimate_cost(1)

    try:
        responses = await provider.fetch_serp(
            [body.keyword.strip()],
            location=settings.serp_default_location,
            language=settings.serp_default_language,
            device="desktop",
            depth=body.depth,
        )
    except ProviderError as exc:
        raise_provider_http(exc)

    response = responses[0]
    top = response.results[0] if response.results else None
    snapshot_id: int | None = None
    persist_note: str | None = None

    if body.persist:
        async with async_session_factory() as session:
            keyword_id = await find_keyword_id_for_text(session, body.keyword)
            if keyword_id is None:
                persist_note = "Không lưu snapshot — không tìm thấy từ khóa trong DB."
            else:
                try:
                    snap = await persist_serp_response(
                        session,
                        keyword_id=keyword_id,
                        response=response,
                    )
                    await session.commit()
                    snapshot_id = snap.id
                except IntegrityError:
                    await session.rollback()
                    persist_note = "Snapshot hôm nay đã tồn tại (1 lần/ngày/từ khóa)."

    now = datetime.now(tz=UTC).isoformat()
    return {
        "data": {
            "keyword": response.keyword,
            "provider": response.provider,
            "organic_count": len(response.results),
            "features": response.features,
            "results_count": _metric(response.results_count, Provenance.OBSERVED),
            "top_organic": {
                "position": top.position,
                "domain": top.domain,
                "url": top.url,
                "title": top.title,
            }
            if top
            else None,
            "estimated_cost_usd": str(cost.usd.quantize(Decimal("0.0001"))),
            "snapshot_id": snapshot_id,
            "persist_note": persist_note,
        },
        "meta": {"data_fetched_at": now, "is_stale": False},
    }
