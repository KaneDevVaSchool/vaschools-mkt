# Tech Stack

## Chốt

| Lớp | Công nghệ | Phiên bản | Lý do |
|---|---|---|---|
| Backend | **Python** | 3.11+ | Hệ sinh thái crawl/xử lý dữ liệu mạnh; đồng bộ với `vaschools-crawl` đã có |
| API framework | **FastAPI** | 0.110+ | Async native (quan trọng khi gọi hàng loạt API ngoài), type hint + OpenAPI tự sinh |
| Validation | **Pydantic** | v2 | Model dùng chung cho API contract, adapter response, LLM output |
| DB | **PostgreSQL** | 15+ | JSONB cho SERP snapshot thô, index tốt, đã nêu trong tài liệu gốc |
| ORM / migration | **SQLAlchemy 2.0 + Alembic** | — | Async support, migration có version |
| Queue | **Celery + Redis** | — | Batch 100 keyword/request, retry, rate limit, scheduled crawl |
| HTTP client | **httpx** | — | Async, timeout/retry rõ ràng |
| Crawl HTML | **httpx + selectolax** | — | selectolax nhanh hơn BeautifulSoup đáng kể ở quy mô site audit |
| Headless browser | **Playwright** | — | Trang render bằng JS (N2 crawl đối thủ, N3 site audit) |
| LLM SDK | **anthropic** (Python SDK) | — | Intent classification, clustering, 7 nhóm ý tưởng |
| Frontend | **React + TypeScript** | 18+, TS 5+ | Theo chốt của team |
| Build tool | **Vite** | 5+ | — |
| Data fetching | **TanStack Query** | v5 | Cache, refetch, trạng thái loading/error cho bảng dữ liệu lớn |
| Bảng dữ liệu | **TanStack Table** | v8 | Sort/filter/phân trang phía client cho Keyword Overview 100 dòng |
| Biểu đồ | **Recharts** | — | Rank tracking theo thời gian, phân bố intent |
| Routing | **React Router** | v6 | — |
| Test backend | **pytest + pytest-asyncio** | — | — |
| Test frontend | **Vitest + Testing Library** | — | — |
| Lint/format | **ruff** (Python), **ESLint + Prettier** (TS) | — | — |
| Container | **Docker + Docker Compose** | — | — |

## Vì sao Python backend

1. Đã có `vaschools-crawl` (Python) với pipeline crawl, fingerprint, classifier
   và storage — **N3 Site Audit tái sử dụng được phần lớn**. Xem
   [repo-structure.md](repo-structure.md) mục "Tái sử dụng vaschools-crawl".
2. Xử lý dữ liệu theo lô (batch 100 keyword, tính CTR, clustering) tự nhiên hơn
   trong Python.
3. Async I/O phù hợp workload chủ yếu là chờ API ngoài.

## Vì sao tách frontend React riêng

Backend thuần API JSON, frontend là SPA độc lập. Lý do: tầng ingestion và
analytics chạy theo job nền, không gắn với request/response của người dùng —
ghép server-render vào sẽ làm rối vòng đời.

## Thư viện KHÔNG dùng

| Không dùng | Thay bằng | Lý do |
|---|---|---|
| Scrapy | httpx + Playwright | Scrapy áp đặt vòng đời riêng, khó ghép vào Celery job đã có |
| BeautifulSoup | selectolax | Chậm hơn nhiều ở quy mô site audit |
| Redux | TanStack Query + useState | Phần lớn state là server state; Redux thừa |
| Component library nặng (MUI/AntD) | Component tự viết + CSS variables | Giữ bundle nhẹ, chủ động về design token |

## Biến môi trường bắt buộc

Xem [deployment.md](../07-ops/deployment.md) cho danh sách đầy đủ. Tối thiểu:

```
DATABASE_URL
REDIS_URL
SERP_PROVIDER              # dataforseo | serpapi
SERP_API_KEY
GOOGLE_ADS_*               # cho Keyword Planner
PAGESPEED_API_KEY
BACKLINK_PROVIDER_API_KEY
GA4_PROPERTY_ID
GA4_CREDENTIALS_JSON
ANTHROPIC_API_KEY
MONTHLY_SERP_REQUEST_CAP   # trần quota, xem cost-model.md
```

Không commit file `.env`. Mẫu để ở `.env.example`.
