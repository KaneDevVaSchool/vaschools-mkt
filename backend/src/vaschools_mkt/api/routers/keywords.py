"""Đọc từ khóa nền — tuần 1 (chưa có volume/SERP)."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from vaschools_mkt.api.deps import get_current_user
from vaschools_mkt.core.models import SessionUser
from vaschools_mkt.db.models import Keyword
from vaschools_mkt.db.session import async_session_factory

router = APIRouter(prefix="/keywords", tags=["keywords"])

MAX_PER_PAGE = 100


@router.get("")
async def list_keywords(
    _user: SessionUser = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=MAX_PER_PAGE),
    source: str | None = None,
    q: str | None = Query(None, min_length=1, max_length=200),
):
    per_page = min(per_page, MAX_PER_PAGE)
    offset = (page - 1) * per_page

    async with async_session_factory() as session:
        base = select(Keyword)
        count_stmt = select(func.count()).select_from(Keyword)

        if source:
            base = base.where(Keyword.source == source)
            count_stmt = count_stmt.where(Keyword.source == source)
        if q:
            like = f"%{q.strip()}%"
            base = base.where(Keyword.text.ilike(like))
            count_stmt = count_stmt.where(Keyword.text.ilike(like))

        total = int((await session.execute(count_stmt)).scalar_one())
        rows = (
            await session.execute(
                base.order_by(Keyword.id.desc()).offset(offset).limit(per_page)
            )
        ).scalars().all()

    total_pages = max(1, (total + per_page - 1) // per_page)
    now = datetime.now(tz=UTC).isoformat()

    return {
        "data": [
            {
                "id": kw.id,
                "text": kw.text,
                "source": kw.source,
                "tier": kw.tier,
                "location": kw.location,
                "language": kw.language,
                "intent": kw.intent,
                "created_at": kw.created_at.isoformat() if kw.created_at else None,
            }
            for kw in rows
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
        },
        "meta": {"data_fetched_at": now, "is_stale": False},
    }
