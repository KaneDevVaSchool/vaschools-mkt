"""Contract test cho mọi SerpProvider."""

import pytest

from vaschools_mkt.providers.serp.fake import FakeSerpProvider

ALLOWED_FEATURES = {
    "featured_snippet",
    "people_also_ask",
    "local_pack",
    "image_pack",
    "video",
    "shopping",
    "knowledge_panel",
    "sitelinks",
    "top_ads",
    "bottom_ads",
}


@pytest.mark.parametrize(
    "provider",
    [FakeSerpProvider()],
)
async def test_serp_provider_contract(provider):
    keywords = ["trường quốc tế tphcm", "học phí trường song ngữ"]
    responses = await provider.fetch_serp(
        keywords,
        location="VN",
        language="vi",
        device="desktop",
        depth=50,
    )
    assert len(responses) == len(keywords)
    for resp, kw in zip(responses, keywords, strict=True):
        assert resp.keyword == kw
        assert resp.provider == provider.name
        assert resp.fetched_at.tzinfo is not None
        assert resp.raw
        assert all(f in ALLOWED_FEATURES for f in resp.features)
        positions = [r.position for r in resp.results]
        assert positions == sorted(positions)
        for r in resp.results:
            assert r.url.startswith("http")
            assert r.domain

    cost = provider.estimate_cost(len(keywords))
    assert cost.request_units == len(keywords)
    assert cost.usd >= 0


def test_serp_max_batch():
    provider = FakeSerpProvider()
    with pytest.raises(ValueError):
        import asyncio

        asyncio.run(
            provider.fetch_serp(
                [f"kw{i}" for i in range(101)],
                location="VN",
                language="vi",
                device="desktop",
            )
        )
