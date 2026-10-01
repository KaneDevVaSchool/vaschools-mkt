# Database Schema

PostgreSQL 15+. Nguyên tắc: **raw store bất biến, derived tính lại được.**

## Sơ đồ quan hệ

```
domains ──┬──► rankings ──────┐
          │                   ├──► traffic_estimates
          ├──► backlinks_raw  │
          ├──► crawl_pages ───┴──► audit_issues
          └──► ga4_raw

keywords ──┬──► keyword_metrics_raw
           ├──► serp_snapshots ──► rankings
           └──► keyword_clusters

crawl_pages ──► onpage_payloads ──► onpage_ideas ──► idea_reviews

ctr_curves (versioned) ──► traffic_estimates
job_runs (audit log mọi job)
```

## Bảng RAW — bất biến, append-only

### `serp_snapshots`

Bảng trung tâm. Phục vụ 6 tính năng, không được tách riêng theo module.

```sql
CREATE TABLE serp_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    keyword_id      BIGINT NOT NULL REFERENCES keywords(id),
    search_engine   TEXT NOT NULL DEFAULT 'google',
    location        TEXT NOT NULL,           -- 'VN', 'VN-HCM'
    language        TEXT NOT NULL,           -- 'vi'
    device          TEXT NOT NULL,           -- 'desktop' | 'mobile'
    provider        TEXT NOT NULL,           -- 'dataforseo' | 'serpapi'
    results_count   BIGINT,
    raw             JSONB NOT NULL,          -- response gốc, KHÔNG parse mất
    parsed_results  JSONB NOT NULL,          -- [{position, url, domain, title}]
    serp_features   TEXT[] NOT NULL DEFAULT '{}',
    fetched_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: một snapshot mỗi ngày cho mỗi tổ hợp
CREATE UNIQUE INDEX uq_serp_daily ON serp_snapshots (
    keyword_id, search_engine, location, language, device,
    (fetched_at::date)
);
CREATE INDEX ix_serp_keyword_time ON serp_snapshots (keyword_id, fetched_at DESC);
CREATE INDEX ix_serp_features ON serp_snapshots USING GIN (serp_features);
```

Giữ cả `raw` và `parsed_results`: đổi cách parse sau này không cần crawl lại.
Đây là khoản đầu tư lưu trữ đổi lấy khả năng không phải đốt quota lần hai.

### `keyword_metrics_raw`

```sql
CREATE TABLE keyword_metrics_raw (
    id                  BIGSERIAL PRIMARY KEY,
    keyword_id          BIGINT NOT NULL REFERENCES keywords(id),
    provider            TEXT NOT NULL,
    search_volume       INTEGER,             -- NULL = không có dữ liệu, KHÔNG phải 0
    cpc_micros          BIGINT,              -- VND × 10^6, tránh float
    currency            TEXT DEFAULT 'VND',
    competitive_density NUMERIC(3,2),
    keyword_difficulty  INTEGER,             -- NULL nếu không mua
    monthly_trend       JSONB,               -- [{month, volume}]
    fetched_at          TIMESTAMPTZ NOT NULL
);
CREATE INDEX ix_kmr_keyword_time ON keyword_metrics_raw (keyword_id, fetched_at DESC);
```

`cpc_micros` dùng số nguyên: tiền tệ không bao giờ lưu bằng float.

### `backlinks_raw`, `psi_raw`, `ga4_raw`

```sql
CREATE TABLE backlinks_raw (
    id                BIGSERIAL PRIMARY KEY,
    domain_id         BIGINT NOT NULL REFERENCES domains(id),
    provider          TEXT NOT NULL,
    total_backlinks   BIGINT,
    referring_domains INTEGER,
    authority_score   INTEGER,
    dofollow_ratio    NUMERIC(3,2),
    raw               JSONB NOT NULL,
    fetched_at        TIMESTAMPTZ NOT NULL
);

CREATE TABLE psi_raw (
    id          BIGSERIAL PRIMARY KEY,
    url         TEXT NOT NULL,
    device      TEXT NOT NULL,
    data_source TEXT NOT NULL,        -- 'field' | 'lab'
    lcp_ms      INTEGER, inp_ms INTEGER, cls NUMERIC(4,3),
    performance_score INTEGER,
    raw         JSONB NOT NULL,       -- giữ opportunities cho N4 UX Ideas
    fetched_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE ga4_raw (
    id                BIGSERIAL PRIMARY KEY,
    domain_id         BIGINT NOT NULL REFERENCES domains(id),
    date              DATE NOT NULL,
    landing_page      TEXT,
    organic_sessions  INTEGER,
    bounce_rate       NUMERIC(4,3),
    avg_engagement_s  INTEGER,
    raw               JSONB,
    UNIQUE (domain_id, date, landing_page)
);
```

## Bảng thực thể

```sql
CREATE TABLE domains (
    id                 BIGSERIAL PRIMARY KEY,
    domain             TEXT NOT NULL UNIQUE,      -- registrable, không www
    is_ours            BOOLEAN NOT NULL DEFAULT false,
    include_subdomains BOOLEAN NOT NULL DEFAULT false,
    brand_terms        TEXT[] NOT NULL DEFAULT '{}',
    review_status      TEXT NOT NULL DEFAULT 'pending_review',
    added_manually     BOOLEAN NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE keywords (
    id               BIGSERIAL PRIMARY KEY,
    text             TEXT NOT NULL,        -- nguyên bản, GIỮ DẤU tiếng Việt
    normalized_text  TEXT NOT NULL,
    location         TEXT NOT NULL,
    language         TEXT NOT NULL,
    intent           TEXT,                 -- informational|navigational|commercial|transactional
    intent_confidence NUMERIC(3,2),
    tier             TEXT NOT NULL DEFAULT 'standard',  -- priority|standard|archive
    source           TEXT,                 -- seed|suggest|paa|gsc|serp_title
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (normalized_text, location, language)
);
CREATE INDEX ix_keywords_tier ON keywords (tier) WHERE tier = 'priority';
CREATE INDEX ix_keywords_intent ON keywords (intent);
```

Khóa duy nhất trên `normalized_text` giữ nguyên dấu tiếng Việt — "học phí" và
"hoc phi" là hai từ khóa khác nhau. Xem
[keyword-overview.md](../02-modules/n1-keyword-research/keyword-overview.md).

## Bảng DERIVED — tính lại được

```sql
CREATE TABLE rankings (
    id             BIGSERIAL PRIMARY KEY,
    keyword_id     BIGINT NOT NULL REFERENCES keywords(id),
    domain_id      BIGINT NOT NULL REFERENCES domains(id),
    snapshot_id    BIGINT NOT NULL REFERENCES serp_snapshots(id),
    position       INTEGER,               -- NULL = ngoài Top 100, KHÔNG phải 101
    url            TEXT,
    all_positions  INTEGER[],             -- phát hiện cannibalization
    observed_at    TIMESTAMPTZ NOT NULL,
    UNIQUE (keyword_id, domain_id, snapshot_id)
);
CREATE INDEX ix_rankings_domain_time ON rankings (domain_id, observed_at DESC);

CREATE TABLE ctr_curves (
    id            BIGSERIAL PRIMARY KEY,
    version       TEXT NOT NULL UNIQUE,     -- 'v1', 'v2'…
    curve         JSONB NOT NULL,           -- {"1": 0.284, "2": 0.152, …}
    calibrated    BOOLEAN NOT NULL DEFAULT false,
    calibrated_at TIMESTAMPTZ,
    sample_size   INTEGER,
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE traffic_estimates (
    id             BIGSERIAL PRIMARY KEY,
    domain_id      BIGINT NOT NULL REFERENCES domains(id),
    keyword_id     BIGINT NOT NULL REFERENCES keywords(id),
    period         DATE NOT NULL,            -- tháng
    position       INTEGER,
    search_volume  INTEGER,
    est_traffic    INTEGER,
    est_value_vnd  BIGINT,
    is_branded     BOOLEAN,
    ctr_version    TEXT NOT NULL REFERENCES ctr_curves(version),
    computed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (domain_id, keyword_id, period, ctr_version)
);
```

`ctr_version` trong khóa duy nhất: cho phép giữ song song ước tính theo nhiều
version CTR, so sánh được trước/sau hiệu chỉnh mà không mất dữ liệu cũ.

## Bảng Site Audit

```sql
CREATE TABLE audits (
    id            BIGSERIAL PRIMARY KEY,
    domain_id     BIGINT NOT NULL REFERENCES domains(id),
    config        JSONB NOT NULL,
    status        TEXT NOT NULL,          -- queued|running|completed|failed
    pages_crawled INTEGER DEFAULT 0,
    site_health   INTEGER,
    started_at    TIMESTAMPTZ, finished_at TIMESTAMPTZ
);

CREATE TABLE crawl_pages (
    id           BIGSERIAL PRIMARY KEY,
    audit_id     BIGINT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    status_code  INTEGER,
    render_mode  TEXT,                    -- 'html' | 'js'
    depth        INTEGER,
    title        TEXT, meta_description TEXT,
    headings     JSONB, word_count INTEGER,
    schema_types TEXT[],
    content_hash TEXT,                    -- phát hiện duplicate_content
    dom_facts    JSONB,
    fetched_at   TIMESTAMPTZ NOT NULL,
    UNIQUE (audit_id, url)
);
CREATE INDEX ix_crawl_content_hash ON crawl_pages (audit_id, content_hash);

CREATE TABLE audit_issues (
    id          BIGSERIAL PRIMARY KEY,
    audit_id    BIGINT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    page_id     BIGINT REFERENCES crawl_pages(id) ON DELETE CASCADE,
    check_id    TEXT NOT NULL,
    severity    TEXT NOT NULL,            -- error|warning|notice
    category    TEXT NOT NULL,
    details     JSONB NOT NULL,           -- đủ để biết sửa ở đâu
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_issues_audit_sev ON audit_issues (audit_id, severity, check_id);
```

## Bảng N4

```sql
CREATE TABLE onpage_ideas (
    id                BIGSERIAL PRIMARY KEY,
    url               TEXT NOT NULL,
    group_name        TEXT NOT NULL,       -- technical|ux|semantic|content|serp_features|backlink|strategy
    title             TEXT NOT NULL,
    description       TEXT, action TEXT,
    impact            TEXT, effort TEXT,
    est_traffic_gain  INTEGER,
    priority_score    NUMERIC(5,2),
    evidence          JSONB NOT NULL,      -- dẫn về dữ liệu nguồn
    generated_by      TEXT NOT NULL,       -- 'rule' | 'llm'
    prompt_version    TEXT,                -- để so sánh chất lượng giữa version
    payload_hash      TEXT NOT NULL,       -- cache
    review_status     TEXT NOT NULL DEFAULT 'pending_review',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ideas_cache ON onpage_ideas (payload_hash, group_name);
CREATE INDEX ix_ideas_review ON onpage_ideas (review_status, group_name);

CREATE TABLE idea_reviews (
    id           BIGSERIAL PRIMARY KEY,
    idea_id      BIGINT NOT NULL REFERENCES onpage_ideas(id) ON DELETE CASCADE,
    reviewer     TEXT NOT NULL,
    status       TEXT NOT NULL,
    reason       TEXT,                     -- danh sách cố định, xem review-mechanism.md
    note         TEXT,
    edited_content JSONB,
    reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Bảng vận hành

```sql
CREATE TABLE job_runs (
    id                 BIGSERIAL PRIMARY KEY,
    job_name           TEXT NOT NULL,
    status             TEXT NOT NULL,
    items_requested    INTEGER, items_succeeded INTEGER, items_failed INTEGER,
    api_requests_made  INTEGER DEFAULT 0,
    estimated_cost_usd NUMERIC(10,4) DEFAULT 0,
    error_summary      TEXT,
    started_at         TIMESTAMPTZ NOT NULL,
    finished_at        TIMESTAMPTZ
);
CREATE INDEX ix_job_runs_name_time ON job_runs (job_name, started_at DESC);

CREATE TABLE quota_usage (
    id            BIGSERIAL PRIMARY KEY,
    provider      TEXT NOT NULL,
    period        DATE NOT NULL,           -- tháng
    requests_used INTEGER NOT NULL DEFAULT 0,
    requests_cap  INTEGER NOT NULL,
    cost_usd      NUMERIC(10,4) DEFAULT 0,
    UNIQUE (provider, period)
);
```

## Quy ước

| Quy ước | Lý do |
|---|---|
| `NULL` ≠ `0` | `search_volume NULL` = không có dữ liệu; `0` = thực sự bằng 0 |
| `position NULL` = ngoài Top 100 | Không dùng 101 |
| Tiền tệ lưu số nguyên (`_micros`, `_vnd`) | Không dùng float cho tiền |
| Mọi bảng raw có `provider` + `fetched_at` | Truy vết nguồn và thời điểm |
| Timestamp là `TIMESTAMPTZ` | Luôn có múi giờ |
| Bảng derived có version của mô hình | Tính lại và so sánh được |
| Không UPDATE bảng raw | Chỉ INSERT bản ghi mới |

## Lưu giữ dữ liệu

| Bảng | Giữ | Lý do |
|---|---|---|
| `serp_snapshots` | 24 tháng | Rank tracking dài hạn; `raw` JSONB nặng, cân nhắc nén sau 6 tháng |
| `keyword_metrics_raw` | 24 tháng | Theo dõi xu hướng volume |
| `crawl_pages` | 6 audit gần nhất | Nặng, giá trị giảm nhanh |
| `audit_issues` | Theo audit | — |
| `job_runs` | 12 tháng | Phân tích chi phí |
| `onpage_ideas` | Không xóa | Dữ liệu huấn luyện cho cải thiện prompt |
