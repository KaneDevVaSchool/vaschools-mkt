"""Ghi kết quả SERP vào PostgreSQL (tuần 1: probe thủ công, tuần 2: batch job)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from vaschools_mkt.core.serp import SerpResponse
from vaschools_mkt.db.models import Domain, Keyword, Ranking, SerpSnapshot


def _parsed_results_payload(response: SerpResponse) -> list[dict]:
    return [
        {
            "position": r.position,
            "url": r.url,
            "domain": r.domain,
            "title": r.title,
            "description": r.description,
        }
        for r in response.results
    ]


def _domain_matches(result_domain: str, tracked: str, include_subdomains: bool) -> bool:
    rd = result_domain.lower().strip()
    td = tracked.lower().strip()
    if rd == td:
        return True
    if include_subdomains and (rd == td or rd.endswith(f".{td}")):
        return True
    return rd.endswith(f".{td}") or rd == td


async def persist_serp_response(
    session: AsyncSession,
    *,
    keyword_id: int,
    response: SerpResponse,
) -> SerpSnapshot:
    snapshot = SerpSnapshot(
        keyword_id=keyword_id,
        search_engine="google",
        location=response.location,
        language=response.language,
        device=response.device,
        provider=response.provider,
        results_count=response.results_count,
        raw=response.raw,
        parsed_results=_parsed_results_payload(response),
        serp_features=list(response.features),
        fetched_at=response.fetched_at,
    )
    session.add(snapshot)
    await session.flush()

    domains = (
        await session.execute(select(Domain).where(Domain.is_ours.is_(True)))
    ).scalars().all()

    for dom in domains:
        positions: list[int] = []
        best_pos: int | None = None
        best_url: str | None = None
        for r in response.results:
            if _domain_matches(r.domain, dom.domain, dom.include_subdomains):
                positions.append(r.position)
                if best_pos is None or r.position < best_pos:
                    best_pos = r.position
                    best_url = r.url
        if best_pos is None:
            continue
        session.add(
            Ranking(
                keyword_id=keyword_id,
                domain_id=dom.id,
                snapshot_id=snapshot.id,
                position=best_pos,
                url=best_url,
                all_positions=sorted(positions),
                observed_at=response.fetched_at,
            )
        )

    return snapshot


async def find_keyword_id_for_text(session: AsyncSession, text: str) -> int | None:
    trimmed = text.strip()
    if not trimmed:
        return None
    row = await session.execute(
        select(Keyword.id).where(Keyword.text.ilike(trimmed)).limit(1)
    )
    found = row.scalar_one_or_none()
    if found is not None:
        return int(found)
    row = await session.execute(
        select(Keyword.id).where(Keyword.text.ilike(f"%{trimmed}%")).limit(1)
    )
    found = row.scalar_one_or_none()
    return int(found) if found is not None else None
