from vaschools_mkt.core.serp_discovery import extract_keyword_ideas


def test_extract_keyword_ideas_dedupes_seed():
    raw = {
        "related_searches": [{"query": "mầm non quốc tế"}, {"query": "mầm non quốc tế"}],
        "related_questions": [{"question": "Học phí trường quốc tế?"}],
    }
    ideas = extract_keyword_ideas(raw, seed_query="trường quốc tế")
    texts = [i["text"] for i in ideas]
    assert "mầm non quốc tế" in texts
    assert "Học phí trường quốc tế?" in texts
    assert texts.count("mầm non quốc tế") == 1
