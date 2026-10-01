# Cấu trúc repo

## Cây thư mục

```
vaschools-mkt/
├── docs/                         ← bộ tài liệu này
├── backend/
│   ├── pyproject.toml
│   ├── alembic/                  migration
│   └── src/vaschools_mkt/
│       ├── core/                 ⚠ KHÔNG import gì khác trong package
│       │   ├── models.py         Pydantic model dùng chung
│       │   ├── provenance.py     enum + wrapper nhãn nguồn (BẮT BUỘC)
│       │   ├── config.py         đọc env, validate khi khởi động
│       │   └── urls.py           chuẩn hóa URL/domain
│       │
│       ├── providers/            LỚP ADAPTER — chỗ duy nhất gọi API ngoài
│       │   ├── base.py           các Protocol/ABC
│       │   ├── serp/             dataforseo.py · serpapi.py · fake.py
│       │   ├── keyword_planner/  google_ads.py · fake.py
│       │   ├── backlinks/        <provider>.py · fake.py
│       │   ├── pagespeed/        psi.py · fake.py
│       │   └── ga4/              ga4.py · fake.py
│       │
│       ├── ingestion/            ghi vào raw store
│       │   ├── serp_ingest.py
│       │   ├── volume_ingest.py
│       │   ├── backlink_ingest.py
│       │   ├── psi_ingest.py
│       │   └── ga4_ingest.py
│       │
│       ├── crawler/              N3 site audit + N2 crawl đối thủ
│       │   ├── frontier.py       hàng đợi URL, dedupe, giới hạn độ sâu
│       │   ├── fetcher.py        httpx + fallback Playwright
│       │   ├── parser.py         selectolax → DomFacts
│       │   └── robots.py         tuân thủ robots.txt (BẮT BUỘC)
│       │
│       ├── analytics/            ⚠ HÀM THUẦN — không I/O, không HTTP
│       │   ├── ctr_model.py
│       │   ├── traffic_estimator.py
│       │   ├── traffic_value.py
│       │   ├── match_type.py
│       │   ├── competitor_detector.py
│       │   ├── branded.py
│       │   ├── cluster_builder.py
│       │   ├── rank_history.py
│       │   └── audit_rules/      một file một nhóm rule
│       │
│       ├── llm/
│       │   ├── client.py         wrapper + retry + đếm token
│       │   ├── prompts/          template .md có version
│       │   ├── intent.py
│       │   ├── content_gap.py
│       │   └── ideas/            7 file, một nhóm ý tưởng mỗi file
│       │
│       ├── jobs/                 Celery task + scheduler
│       │   ├── app.py
│       │   ├── schedules.py
│       │   └── tasks/
│       │
│       ├── db/
│       │   ├── models.py         SQLAlchemy
│       │   ├── session.py
│       │   └── repositories/     chỗ duy nhất viết query
│       │
│       └── api/
│           ├── main.py
│           ├── deps.py
│           └── routers/          n1_keywords.py · n2_competitors.py
│                                 n3_audit.py · n4_onpage.py · admin.py
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/                  client sinh từ OpenAPI + hook TanStack Query
│       ├── components/
│       │   ├── ui/               nguyên thủy dùng chung
│       │   └── ProvenanceBadge/  ⚠ dùng ở MỌI chỗ hiển thị số liệu
│       ├── features/
│       │   ├── keywords/         N1
│       │   ├── competitors/      N2
│       │   ├── audit/            N3
│       │   └── onpage/           N4
│       ├── routes/
│       └── styles/               design token (CSS variables)
│
├── tests/
│   ├── fixtures/                 response SERP/PSI/GA4 đã ghi lại
│   ├── unit/
│   └── integration/
│
├── docker-compose.yml
└── .env.example
```

## Quy tắc import (bắt buộc)

```
core        ←  không import gì khác trong package
providers   ←  chỉ import core
ingestion   ←  providers, core, db
crawler     ←  core
analytics   ←  chỉ core          ⚠ KHÔNG import providers/db/llm
llm         ←  core
jobs        ←  tất cả
api         ←  db, analytics, llm, core   ⚠ KHÔNG import providers trực tiếp
```

Đồ thị import phải phi chu trình. Hai ràng buộc quan trọng nhất:

- **`analytics` không được import `providers` hay `db`.** Nếu một hàm analytics
  cần dữ liệu, dữ liệu được **truyền vào** làm tham số. Đây là điều khiến toàn
  bộ tầng analytics test được bằng fixture, không cần API thật.
- **`api` không gọi `providers` trực tiếp.** Request người dùng đọc từ DB. Mọi
  lời gọi ra ngoài nằm trong job nền — nếu không, một request của người dùng
  có thể đốt quota SERP API.

## Tái sử dụng `vaschools-crawl`

`../vaschools-crawl` đã có pipeline crawl hoàn chỉnh (frontier, http client,
parser, classifier, robots/sitemap discovery, reporting). **N3 Site Audit nên
kế thừa thay vì viết lại.**

Cách làm, theo thứ tự ưu tiên:

1. **Import như thư viện** nếu `vaschools-crawl` cài được bằng `pip install -e`.
   Giữ hai repo tách biệt, `vaschools-mkt` khai báo nó là dependency.
2. **Copy có chọn lọc** (`crawler/`, `discovery/`, `core/models.py`) vào
   `backend/src/vaschools_mkt/crawler/` nếu cần sửa nhiều.

Đánh giá cụ thể ở tuần 4, trước khi viết dòng crawler nào. Những khái niệm
đáng mang sang dù chọn cách nào:

- `UrlRecord` là composition của các lát fact có **một writer duy nhất**
  (fetch/dom/provenance/classification) — mô hình này rất hợp với site audit.
- Classification hai pha: pha 1 rẻ theo URL pattern để quyết định chính sách
  crawl, pha 2 là hàm thuần chạy một lần trên toàn bộ record.
- Renderer đọc chung một `ReportModel` nên không thể mâu thuẫn nhau.

## Quy ước đặt tên

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Module/file Python | `snake_case` | `traffic_estimator.py` |
| Class Python | `PascalCase` | `SerpProvider` |
| Bảng DB | `snake_case`, số nhiều | `serp_snapshots` |
| Cột chỉ số | theo cột "Dùng trong code" trong [glossary.md](../00-overview/glossary.md) | `search_volume` |
| Endpoint API | `kebab-case`, số nhiều | `/api/v1/keyword-clusters` |
| Component React | `PascalCase`, một thư mục một component | `ProvenanceBadge/` |
| Prompt template | `<mục đích>.v<N>.md` | `strategy_ideas.v2.md` |
