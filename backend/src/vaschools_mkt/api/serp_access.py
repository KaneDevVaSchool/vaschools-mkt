"""Kiểm tra quyền gọi SerpAPI từ API (tuần 1 — development)."""

from fastapi import HTTPException

from vaschools_mkt.core.config import settings


def assert_serp_search_allowed() -> None:
    if settings.environment != "development":
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Tìm kiếm SerpAPI chỉ bật trong môi trường development.",
                }
            },
        )
    if settings.serp_provider == "fake":
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "SERP_FAKE",
                    "message": "Đặt SERP_PROVIDER=serpapi và SERP_API_KEY trong .env.",
                }
            },
        )
    if not settings.serp_provider_configured:
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "PROVIDER_NOT_CONFIGURED",
                    "message": "Thiếu cấu hình SerpAPI (SERP_API_KEY).",
                }
            },
        )
