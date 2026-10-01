# Triển khai

## Thành phần

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ frontend │  │   api    │  │  worker  │  │   beat   │
│  nginx   │  │ FastAPI  │  │  Celery  │  │ schedule │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     └─────────────┴─────────────┴─────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐         ┌─────▼────┐
   │PostgreSQL│         │  Redis   │
   └──────────┘         └──────────┘
```

`worker` và `beat` là hai container riêng: beat chỉ xếp lịch, worker thực thi.
Chạy nhiều worker được; **chỉ chạy một beat** — hai beat sẽ xếp lịch trùng và
đốt đôi quota.

## docker-compose.yml

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: vaschools_mkt
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  redis:
    image: redis:7-alpine

  api:
    build: ./backend
    command: uvicorn vaschools_mkt.api.main:app --host 0.0.0.0 --port 8000
    env_file: .env
    depends_on:
      db: { condition: service_healthy }

  worker:
    build: ./backend
    command: celery -A vaschools_mkt.jobs.app worker --loglevel=info --concurrency=4
    env_file: .env

  beat:
    build: ./backend
    command: celery -A vaschools_mkt.jobs.app beat --loglevel=info
    env_file: .env
    # ⚠ KHÔNG scale service này lên > 1

  frontend:
    build: ./frontend
    ports: ["80:80"]

volumes:
  pgdata:
```

Playwright cần image có sẵn browser — dùng `mcr.microsoft.com/playwright/python`
làm base cho worker, hoặc cài trong Dockerfile.

## Biến môi trường

```bash
# Core
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/vaschools_mkt
REDIS_URL=redis://redis:6379/0
API_KEY=                          # xác thực nội bộ
ENVIRONMENT=production            # development | production

# SERP  (mặc định fake — quên cấu hình thì không đốt tiền)
SERP_PROVIDER=fake
SERP_API_LOGIN=
SERP_API_PASSWORD=
SERP_DEFAULT_LOCATION=Vietnam
SERP_DEFAULT_LANGUAGE=vi

# Google Ads (Keyword Planner)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=

# PageSpeed
PAGESPEED_API_KEY=
PAGESPEED_STRATEGY=mobile
PAGESPEED_MAX_URLS=50

# Backlinks
BACKLINK_PROVIDER=fake
BACKLINK_API_KEY=

# GA4 / GSC
GA4_PROPERTY_ID=
GA4_CREDENTIALS_JSON=/secrets/ga4-sa.json
GSC_SITE_URL=https://vaschools.edu.vn/

# LLM
ANTHROPIC_API_KEY=
LLM_MODEL=claude-opus-5
LLM_MODEL_CHEAP=claude-haiku-4-5-20251001
LLM_MAX_URLS_PER_DAY=100

# Trần chi phí — BẮT BUỘC đặt
MONTHLY_SERP_REQUEST_CAP=20000
BACKLINK_MONTHLY_DOMAIN_CAP=15
```

`config.py` validate khi khởi động: thiếu biến bắt buộc thì app không start,
thay vì lỗi lúc chạy job giữa đêm.

Mọi provider mặc định `fake` — nguyên tắc an toàn: quên cấu hình gây mất chức
năng, không gây mất tiền.

## Quy trình triển khai

```bash
git pull
docker compose build
docker compose run --rm api alembic upgrade head    # migration TRƯỚC
docker compose up -d
docker compose logs -f api worker
```

Migration chạy riêng, không nhét vào entrypoint — nhiều container cùng chạy
migration sẽ xung đột.

## Bí mật

| Quy tắc |
|---|
| Không commit `.env` — chỉ `.env.example` |
| File credentials GA4 mount vào container, không copy vào image |
| API key xoay vòng khi có người rời dự án |
| Log không được in key (kiểm tra adapter) |

## Sao lưu

| Đối tượng | Tần suất | Vì sao |
|---|---|---|
| PostgreSQL | Hàng ngày, giữ 30 ngày | `serp_snapshots` là dữ liệu **đã trả tiền để có** — mất là phải crawl lại |
| Redis | Không cần | Chỉ chứa hàng đợi |

Ưu tiên khôi phục cao nhất là `serp_snapshots` và `keyword_metrics_raw`: hai
bảng này quy ra tiền thật.

## Môi trường phát triển

```bash
cp .env.example .env    # để nguyên SERP_PROVIDER=fake
docker compose up -d db redis
cd backend && pip install -e ".[dev]" && alembic upgrade head
uvicorn vaschools_mkt.api.main:app --reload
cd frontend && npm install && npm run dev
```

Với `fake` provider, toàn bộ ứng dụng chạy được mà không cần bất kỳ API key
nào — dev mới vào dự án chạy được ngay.
