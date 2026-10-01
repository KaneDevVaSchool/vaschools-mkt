from vaschools_mkt.ingestion.seed_loader import collect_seed_queries, is_blocked, load_seed_config


def test_blocklist_filters_jobs():
    assert is_blocked("trường quốc tế tuyển dụng", ["tuyển dụng"])
    assert not is_blocked("trường quốc tế tphcm", ["tuyển dụng"])


def test_collect_seed_has_manual_and_combos():
    cfg = load_seed_config()
    seeds = collect_seed_queries(cfg)
    assert "trường quốc tế tphcm" in seeds
    assert len(seeds) >= 50
