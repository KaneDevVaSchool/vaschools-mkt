"""Nạp và mở rộng bộ seed từ YAML + tổ hợp chiều."""

from __future__ import annotations

from itertools import product
from pathlib import Path
from string import Formatter

import yaml

from vaschools_mkt.core.keywords import normalize_keyword, strip_accents

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "seed_keywords.yaml"


def load_seed_config(path: Path | None = None) -> dict:
    p = path or _DATA_PATH
    with p.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def is_blocked(text: str, blocklist: list[str]) -> bool:
    lowered = text.casefold()
    return any(part.casefold() in lowered for part in blocklist)


def build_combinations(cfg: dict) -> list[str]:
    dims = cfg.get("dimensions") or {}
    templates = cfg.get("combination_templates") or []
    out: list[str] = []
    for tmpl in templates:
        fields = [fn for _, fn, _, _ in Formatter().parse(tmpl) if fn]
        if not fields:
            continue
        pools: list[list[str]] = []
        for field in fields:
            pool = dims.get(field)
            if not pool:
                pools = []
                break
            pools.append(pool)
        if not pools:
            continue
        for combo in product(*pools):
            mapping = dict(zip(fields, combo, strict=True))
            phrase = tmpl.format(**mapping).strip()
            if phrase and not is_blocked(phrase, cfg.get("blocklist_substrings") or []):
                out.append(phrase)
    return out


def collect_seed_queries(cfg: dict) -> list[str]:
    manual = list(cfg.get("manual_seeds") or [])
    combos = build_combinations(cfg)
    prefixes = list(cfg.get("suggest_prefixes") or [])
    candidates = manual + combos + prefixes

    unique: list[str] = []
    seen: set[str] = set()
    blocklist = cfg.get("blocklist_substrings") or []

    for text in candidates:
        text = text.strip()
        if not text or is_blocked(text, blocklist):
            continue
        key = normalize_keyword(text)
        if key in seen:
            continue
        seen.add(key)
        unique.append(text)

        # Biến thể không dấu (từ khóa riêng nếu khác bản gốc)
        ascii_variant = strip_accents(text).strip()
        if ascii_variant and ascii_variant != text:
            vkey = normalize_keyword(ascii_variant)
            if vkey not in seen and not is_blocked(ascii_variant, blocklist):
                seen.add(vkey)
                unique.append(ascii_variant)

    return unique
