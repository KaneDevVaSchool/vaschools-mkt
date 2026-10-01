"""CLI tuần 1: nạp seed + Google Suggest → bảng keywords.

Chạy:
  cd backend && python -m vaschools_mkt.scripts.expand_seed_keywords
  python -m vaschools_mkt.scripts.expand_seed_keywords --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import logging

from sqlalchemy.dialects.postgresql import insert

from vaschools_mkt.core.config import settings
from vaschools_mkt.core.keywords import normalize_keyword
from vaschools_mkt.db.models import Keyword
from vaschools_mkt.db.session import async_session_factory
from vaschools_mkt.ingestion.google_suggest import expand_queries
from vaschools_mkt.ingestion.seed_loader import collect_seed_queries, is_blocked, load_seed_config

log = logging.getLogger(__name__)


async def upsert_keywords(rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = insert(Keyword).values(rows)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["normalized_text", "location", "language"],
    )
    async with async_session_factory() as session:
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount or 0


async def run(*, dry_run: bool, skip_suggest: bool) -> None:
    logging.getLogger("httpx").setLevel(logging.WARNING)
    cfg = load_seed_config()
    defaults = cfg.get("defaults") or {}
    location = defaults.get("location", settings.serp_default_location)
    language = defaults.get("language", settings.serp_default_language)
    blocklist = cfg.get("blocklist_substrings") or []

    seeds = collect_seed_queries(cfg)
    log.info("Seed + tổ hợp: %s cụm", len(seeds))

    expanded: list[str] = []
    if not skip_suggest:
        expanded = await expand_queries(seeds, language=language)
        log.info("Google Suggest trả về: %s gợi ý mới", len(expanded))

    all_texts: list[str] = []
    seen: set[str] = set()
    for text in seeds + expanded:
        text = text.strip()
        if not text or is_blocked(text, blocklist):
            continue
        key = normalize_keyword(text)
        if key in seen:
            continue
        seen.add(key)
        all_texts.append(text)

    log.info("Tổng ứng viên sau lọc: %s", len(all_texts))
    if len(all_texts) < 2000:
        log.warning(
            "Chưa đạt mục tiêu ≥2.000 từ khóa — thêm GSC export hoặc mở rộng seed_keywords.yaml"
        )

    expanded_set = set(expanded)
    rows = [
        {
            "text": text,
            "normalized_text": normalize_keyword(text),
            "location": location,
            "language": language,
            "source": "suggest" if text in expanded_set else "seed",
            "tier": "standard",
        }
        for text in all_texts
    ]

    if dry_run:
        log.info("Dry-run: sẽ ghi %s dòng (không ghi DB)", len(rows))
        return

    inserted = await upsert_keywords(rows)
    log.info("Đã insert %s dòng mới (conflict bỏ qua)", inserted)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Mở rộng seed keyword qua Google Suggest")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ đếm, không ghi DB")
    parser.add_argument("--skip-suggest", action="store_true", help="Chỉ seed YAML, không gọi Suggest")
    args = parser.parse_args()
    asyncio.run(run(dry_run=args.dry_run, skip_suggest=args.skip_suggest))


if __name__ == "__main__":
    main()
