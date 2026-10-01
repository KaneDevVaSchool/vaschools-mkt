"""Tuần 1: migration + domain VAS + nạp keywords vào PostgreSQL.

Chạy (Docker Desktop bật, db/redis đã up):
  docker compose up -d db redis
  cd backend && python -m vaschools_mkt.scripts.bootstrap_week1
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import subprocess
import sys
from pathlib import Path

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert

from vaschools_mkt.core.config import settings
from vaschools_mkt.db.models import Domain, Keyword
from vaschools_mkt.db.session import async_session_factory, engine
from vaschools_mkt.scripts.expand_seed_keywords import run as expand_run

log = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parents[3]


async def check_db() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        log.error("Không kết nối được PostgreSQL (%s): %s", settings.database_url, exc)
        return False


def run_migrations() -> None:
    log.info("Chạy alembic upgrade head …")
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=_BACKEND_ROOT,
        check=True,
    )


async def seed_our_domain() -> None:
    row = {
        "domain": "vaschools.edu.vn",
        "is_ours": True,
        "include_subdomains": True,
        "brand_terms": ["vaschools", "va schools", "vietnam australia schools"],
        "review_status": "approved",
        "added_manually": True,
    }
    stmt = insert(Domain).values(row)
    stmt = stmt.on_conflict_do_nothing(index_elements=["domain"])
    async with async_session_factory() as session:
        await session.execute(stmt)
        await session.commit()


async def keyword_stats() -> int:
    async with async_session_factory() as session:
        result = await session.execute(select(func.count()).select_from(Keyword))
        return int(result.scalar_one())


async def main(skip_migrate: bool, skip_expand: bool, dry_run: bool) -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)

    if not await check_db():
        log.error(
            "Bật Docker Desktop rồi chạy: docker compose up -d db redis "
            "(DATABASE_URL=%s)",
            settings.database_url,
        )
        sys.exit(1)

    if not skip_migrate:
        run_migrations()
    await seed_our_domain()
    log.info("Domain vaschools.edu.vn đã có trong bảng domains")

    if not skip_expand:
        await expand_run(dry_run=dry_run, skip_suggest=False)

    count = await keyword_stats()
    log.info("Tổng keywords trong DB: %s", count)
    if count < 2000:
        log.warning("Chưa đạt mục tiêu tuần 1 (≥2.000). Chạy lại expand hoặc bổ sung GSC export.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap tuần 1")
    parser.add_argument("--skip-migrate", action="store_true")
    parser.add_argument("--skip-expand", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Không ghi keywords")
    args = parser.parse_args()
    asyncio.run(
        main(
            skip_migrate=args.skip_migrate,
            skip_expand=args.skip_expand,
            dry_run=args.dry_run,
        )
    )
