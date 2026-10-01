"""Gọi thử provider (tuần 1) — đo chi phí ước tính, không đốt quota nếu để fake.

Chạy:
  cd backend && python -m vaschools_mkt.scripts.probe_providers
"""

from __future__ import annotations

import argparse
import asyncio
import logging

from vaschools_mkt.core.config import settings
from vaschools_mkt.providers.registry import get_keyword_planner_provider, get_serp_provider

log = logging.getLogger(__name__)

_DEFAULT_SAMPLE = ["trường quốc tế tphcm", "học phí trường song ngữ"]


async def main(keywords: list[str], depth: int) -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)

    serp = get_serp_provider()
    serp_cost = serp.estimate_cost(len(keywords))
    responses = await serp.fetch_serp(
        keywords,
        location=settings.serp_default_location,
        language=settings.serp_default_language,
        device="desktop",
        depth=depth,
    )
    log.info(
        "SERP provider=%s configured=%s cost_usd=%s results=%s",
        serp.name,
        settings.serp_provider_configured,
        serp_cost.usd,
        len(responses),
    )
    for resp in responses:
        top = resp.results[0].domain if resp.results else "—"
        log.info("  kw=%r organic=%s top=%s features=%s", resp.keyword, len(resp.results), top, resp.features)

    planner = get_keyword_planner_provider()
    planner_cost = planner.estimate_cost(len(keywords))
    metrics = await planner.fetch_metrics(
        keywords,
        location=settings.serp_default_location,
        language=settings.serp_default_language,
    )
    log.info(
        "Keyword planner=%s google_ads_configured=%s cost_usd=%s metrics=%s",
        planner.name,
        settings.google_ads_configured,
        planner_cost.usd,
        len(metrics),
    )

    if settings.serp_provider != "fake" and not settings.serp_provider_configured:
        log.error(
            "SERP_PROVIDER=%s chưa cấu hình đủ (SerpAPI: SERP_API_KEY; DataForSEO: LOGIN/PASSWORD)",
            settings.serp_provider,
        )
    if settings.keyword_planner_provider != "fake" and not settings.google_ads_configured:
        log.error("KEYWORD_PLANNER provider thật nhưng thiếu biến Google Ads")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gọi thử SERP / Keyword Planner")
    parser.add_argument(
        "--keywords",
        nargs="*",
        default=None,
        help="Từ khóa mẫu (mặc định 1 kw nếu SERP thật, 2 kw nếu fake)",
    )
    parser.add_argument("--depth", type=int, default=10, help="Số kết quả organic (max 100)")
    args = parser.parse_args()
    if args.keywords:
        sample = args.keywords
    elif settings.serp_provider == "fake":
        sample = _DEFAULT_SAMPLE
    else:
        sample = [_DEFAULT_SAMPLE[0]]
    asyncio.run(main(sample, depth=min(max(args.depth, 1), 100)))
