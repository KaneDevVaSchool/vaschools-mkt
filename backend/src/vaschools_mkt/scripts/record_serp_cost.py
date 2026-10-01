"""Ghi lại chi phí ước tính 1 lần gọi SerpAPI (tuần 1 — đối chiếu cuối tháng).

Chạy:
  cd backend && python -m vaschools_mkt.scripts.record_serp_cost
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from vaschools_mkt.core.config import settings
from vaschools_mkt.providers.registry import get_serp_provider

log = logging.getLogger(__name__)
_OUT = Path(__file__).resolve().parents[3] / "data" / "serp_cost_log.jsonl"


async def run(keywords: list[str], depth: int) -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)

    provider = get_serp_provider()
    cost = provider.estimate_cost(len(keywords))
    started = datetime.now(tz=UTC)
    responses = await provider.fetch_serp(
        keywords,
        location=settings.serp_default_location,
        language=settings.serp_default_language,
        device="desktop",
        depth=depth,
    )
    record = {
        "at": started.isoformat(),
        "provider": provider.name,
        "keyword_count": len(keywords),
        "depth": depth,
        "estimated_usd": str(cost.usd),
        "request_units": cost.request_units,
        "results": [
            {
                "keyword": r.keyword,
                "organic_count": len(r.results),
                "features": r.features,
            }
            for r in responses
        ],
    }
    _OUT.parent.mkdir(parents=True, exist_ok=True)
    with _OUT.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    log.info("Đã ghi %s", _OUT)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--keywords", nargs="+", default=["trường quốc tế tphcm"])
    parser.add_argument("--depth", type=int, default=10)
    args = parser.parse_args()
    asyncio.run(run(args.keywords, depth=min(max(args.depth, 1), 100)))
