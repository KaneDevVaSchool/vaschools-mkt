"""FastAPI app.

Khung demo: mới có auth + health. Các router N1–N4 thêm dần theo
docs/01-architecture/api-conventions.md.
"""

import logging
import os
from pathlib import Path

import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from vaschools_mkt.api.routers import auth, keywords, platform, serp
from vaschools_mkt.core.config import settings
from vaschools_mkt.db.session import engine

logging.basicConfig(
    level=logging.INFO,
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)
log = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Session cookie ký bằng secret_key — giữ trạng thái đăng nhập giữa các
# request và giữ OAuth state giữa redirect và callback.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    same_site="lax",  # cần "lax" để cookie sống sót qua redirect từ Google
    https_only=settings.is_production,
)

# SPA chạy ở cổng khác nên cần CORS. allow_credentials=True để cookie session
# đi kèm request từ frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(platform.router, prefix="/api/v1")
app.include_router(keywords.router, prefix="/api/v1")
app.include_router(serp.router, prefix="/api/v1")


@app.get("/health", tags=["ops"])
async def health():
    return {"status": "ok"}


@app.get("/health/deep", tags=["ops"])
async def health_deep():
    """Kiểm tra cấu hình và kết nối. Không gọi API tốn phí."""
    db_ok = False
    redis_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        log.warning("DB health check failed: %s", exc)
    try:
        client = redis.from_url(settings.redis_url)
        try:
            redis_ok = bool(await client.ping())
        finally:
            await client.aclose()
    except Exception as exc:
        log.warning("Redis health check failed: %s", exc)

    status = "ok" if db_ok and redis_ok else "degraded"
    return {
        "status": status,
        "environment": settings.environment,
        "database": db_ok,
        "redis": redis_ok,
        "google_configured": settings.google_configured,
        "allowed_domains": settings.allowed_domains,
        "serp_provider": settings.serp_provider,
        "serp_provider_configured": settings.serp_provider_configured,
        "keyword_planner_provider": settings.keyword_planner_provider,
        "google_ads_configured": settings.google_ads_configured,
        "backlink_provider": settings.backlink_provider,
    }


@app.on_event("startup")
async def _startup() -> None:
    if not settings.google_configured:
        log.warning("GOOGLE_CLIENT_ID/SECRET chưa cấu hình — đăng nhập sẽ không hoạt động")
    if settings.is_production and settings.secret_key.startswith("dev-only"):
        raise RuntimeError("SECRET_KEY mặc định không được dùng ở production")
    log.info("Khởi động %s (%s)", settings.app_name, settings.environment)


# --- SPA tĩnh ---
# Production: SPA build nằm cạnh backend và được serve cùng origin với API,
# nên không cần CORS và cookie session đi thẳng. Mount sau cùng để các router
# /api, /auth, /health giữ quyền ưu tiên.
# Dev: thư mục không tồn tại, bỏ qua — SPA chạy ở vite dev server.
def _find_spa_dir() -> Path:
    """Thư mục SPA build. SPA_DIR trong env thắng; nếu không, dò ngược lên cây.

    Local là <repo>/frontend/dist, production là <release>/static — dò thay vì
    hardcode độ sâu để không vỡ khi layout đổi.
    """
    if env_dir := os.getenv("SPA_DIR"):
        return Path(env_dir).resolve()
    here = Path(__file__).resolve()
    for parent in here.parents[:6]:
        for candidate in (parent / "static", parent / "frontend" / "dist"):
            if (candidate / "index.html").is_file():
                return candidate
    return here.parents[3] / "static"


_SPA_DIR = _find_spa_dir()

if (_SPA_DIR / "index.html").is_file():
    app.mount("/assets", StaticFiles(directory=_SPA_DIR / "assets"), name="spa-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """Client-side routing: mọi path không khớp router đều trả index.html.

        Trừ file tĩnh có thật ở gốc build (favicon, robots.txt, ...).
        """
        candidate = (_SPA_DIR / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(_SPA_DIR):
            return FileResponse(candidate)
        return FileResponse(_SPA_DIR / "index.html")

    log.info("SPA được serve từ %s", _SPA_DIR)
else:
    log.info("Không tìm thấy SPA build tại %s — chỉ serve API", _SPA_DIR)
