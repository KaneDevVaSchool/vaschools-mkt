"""Google Suggest (Autocomplete) — không cần API key."""

from __future__ import annotations

import asyncio
import json
import logging
from urllib.parse import quote

import httpx

log = logging.getLogger(__name__)

_SUGGEST_URL = "https://suggestqueries.google.com/complete/search"
_DEFAULT_UA = "vaschools-mkt/0.1 (+https://vaschools.edu.vn)"


async def fetch_suggestions(
    query: str,
    *,
    language: str = "vi",
    client: httpx.AsyncClient | None = None,
) -> list[str]:
    """Trả danh sách gợi ý (có thể rỗng nếu bị chặn tạm thời)."""
    params = {
        "client": "firefox",
        "q": query,
        "hl": language,
    }
    owns_client = client is None
    if owns_client:
        client = httpx.AsyncClient(timeout=15.0, headers={"User-Agent": _DEFAULT_UA})

    try:
        assert client is not None
        resp = await client.get(_SUGGEST_URL, params=params)
        resp.raise_for_status()
        data = json.loads(resp.text)
        if not isinstance(data, list) or len(data) < 2:
            return []
        suggestions = data[1]
        if not isinstance(suggestions, list):
            return []
        return [str(s).strip() for s in suggestions if str(s).strip()]
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        log.warning("Google Suggest lỗi cho %r: %s", query, exc)
        return []
    finally:
        if owns_client and client is not None:
            await client.aclose()


async def expand_queries(
    seeds: list[str],
    *,
    language: str = "vi",
    concurrency: int = 8,
    delay_s: float = 0.15,
) -> list[str]:
    """Gọi Suggest cho từng seed, gom kết quả duy nhất."""
    sem = asyncio.Semaphore(concurrency)
    seen: set[str] = set()
    ordered: list[str] = []

    async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": _DEFAULT_UA}) as client:

        async def one(seed: str) -> None:
            async with sem:
                suggestions = await fetch_suggestions(seed, language=language, client=client)
                await asyncio.sleep(delay_s)
                for s in suggestions:
                    key = s.casefold()
                    if key not in seen:
                        seen.add(key)
                        ordered.append(s)

        await asyncio.gather(*(one(s) for s in seeds))

    return ordered
