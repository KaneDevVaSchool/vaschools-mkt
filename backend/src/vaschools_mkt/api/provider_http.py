"""Map lỗi provider → HTTP (dùng cho probe tuần 1, không dùng cho endpoint đọc thông thường)."""

from fastapi import HTTPException

from vaschools_mkt.providers.errors import (
    ProviderAuthError,
    ProviderError,
    ProviderNotConfigured,
    ProviderQuotaExceeded,
    ProviderRateLimited,
    ProviderSchemaError,
    ProviderUnavailable,
)


def raise_provider_http(exc: ProviderError) -> None:
    if isinstance(exc, ProviderNotConfigured):
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "PROVIDER_NOT_CONFIGURED",
                    "message": str(exc),
                }
            },
        ) from exc
    if isinstance(exc, ProviderAuthError):
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "PROVIDER_AUTH",
                    "message": "SerpAPI từ chối API key. Kiểm tra SERP_API_KEY trong .env.",
                }
            },
        ) from exc
    if isinstance(exc, ProviderQuotaExceeded):
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "PROVIDER_QUOTA",
                    "message": str(exc),
                }
            },
        ) from exc
    if isinstance(exc, ProviderRateLimited):
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "PROVIDER_RATE_LIMIT",
                    "message": str(exc),
                }
            },
        ) from exc
    if isinstance(exc, ProviderSchemaError):
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "PROVIDER_SCHEMA",
                    "message": str(exc),
                }
            },
        ) from exc
    if isinstance(exc, ProviderUnavailable):
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "PROVIDER_UNAVAILABLE",
                    "message": str(exc),
                }
            },
        ) from exc
    raise HTTPException(
        status_code=502,
        detail={"error": {"code": "PROVIDER_ERROR", "message": str(exc)}},
    ) from exc
