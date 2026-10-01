"""Trích xuất gợi ý từ khóa từ payload SerpAPI (related, PAA)."""

from __future__ import annotations

from typing import Any


def _add_idea(
    out: list[dict[str, str]],
    seen: set[str],
    text: str | None,
    kind: str,
) -> None:
    if not text:
        return
    t = " ".join(str(text).split())
    if len(t) < 2:
        return
    key = t.casefold()
    if key in seen:
        return
    seen.add(key)
    out.append({"text": t, "kind": kind})


def extract_keyword_ideas(raw: dict[str, Any], *, seed_query: str) -> list[dict[str, str]]:
    """related_searches + related_questions từ JSON SerpAPI."""
    ideas: list[dict[str, str]] = []
    seen: set[str] = {seed_query.strip().casefold()} if seed_query.strip() else set()

    for block in raw.get("related_searches") or []:
        if not isinstance(block, dict):
            continue
        _add_idea(ideas, seen, block.get("query") or block.get("text"), "related_search")

    for block in raw.get("related_questions") or []:
        if not isinstance(block, dict):
            continue
        _add_idea(ideas, seen, block.get("question") or block.get("title"), "people_also_ask")

    return ideas
