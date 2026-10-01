"""Factory chọn provider theo env."""

from vaschools_mkt.core.config import settings
from vaschools_mkt.providers.base import KeywordPlannerProvider, SerpProvider
from vaschools_mkt.providers.keyword_planner.fake import FakeKeywordPlannerProvider
from vaschools_mkt.providers.serp.fake import FakeSerpProvider
from vaschools_mkt.providers.serp.serpapi import SerpApiProvider


def get_serp_provider() -> SerpProvider:
    mapping: dict[str, type[SerpProvider]] = {
        "fake": FakeSerpProvider,
        "serpapi": SerpApiProvider,
    }
    cls = mapping.get(settings.serp_provider)
    if cls is None:
        msg = f"SERP_PROVIDER không hỗ trợ: {settings.serp_provider!r}"
        raise ValueError(msg)
    return cls()


def get_keyword_planner_provider() -> KeywordPlannerProvider:
    mapping: dict[str, type[KeywordPlannerProvider]] = {
        "fake": FakeKeywordPlannerProvider,
    }
    cls = mapping.get(settings.keyword_planner_provider)
    if cls is None:
        msg = f"KEYWORD_PLANNER_PROVIDER không hỗ trợ: {settings.keyword_planner_provider!r}"
        raise ValueError(msg)
    return cls()
