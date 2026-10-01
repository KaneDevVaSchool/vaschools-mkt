"""Cấu hình đọc từ biến môi trường.

Validate ngay khi khởi động — thiếu biến bắt buộc thì app không start, thay vì
lỗi lúc chạy job giữa đêm (xem docs/07-ops/deployment.md).
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Core ---
    environment: Literal["development", "production"] = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/vaschools_mkt"
    redis_url: str = "redis://localhost:6379/0"
    app_name: str = "VA Schools — Marketing Intelligence"
    # URL của frontend (SPA). OAuth callback redirect về đây.
    frontend_url: str = "http://localhost:5173"
    # URL của chính backend này. Dùng để dựng redirect_uri gửi sang Google.
    backend_url: str = "http://localhost:8000"

    # Khoá ký session cookie. Bắt buộc đổi ở production.
    secret_key: str = "dev-only-insecure-change-me"

    # --- Google OAuth ---
    # Lấy từ va-workspace/.env để demo. Xem docs/04-integrations/.
    google_client_id: str = ""
    google_client_secret: str = ""
    # Chỉ email thuộc các domain này mới đăng nhập được.
    # Danh sách rỗng = chặn tất cả (an toàn theo mặc định).
    google_allowed_domains: str = "vaschools.edu.vn,hcm.vaschools.edu.vn"

    # --- Providers (mặc định fake: quên cấu hình thì mất chức năng,
    #     không mất tiền — xem docs/04-integrations/provider-abstraction.md) ---
    serp_provider: str = "fake"
    serp_api_key: str = ""
    serp_api_login: str = ""
    serp_api_password: str = ""
    serp_default_location: str = "VN"
    serp_default_language: str = "vi"
    backlink_provider: str = "fake"

    keyword_planner_provider: str = "fake"
    google_ads_developer_token: str = ""
    google_ads_client_id: str = ""
    google_ads_client_secret: str = ""
    google_ads_refresh_token: str = ""
    google_ads_customer_id: str = ""

    # --- Trần chi phí ---
    monthly_serp_request_cap: int = Field(default=20000, ge=0)

    @field_validator("frontend_url", "backend_url")
    @classmethod
    def _strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/")

    @property
    def allowed_domains(self) -> list[str]:
        return [d.strip().lower() for d in self.google_allowed_domains.split(",") if d.strip()]

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id) and bool(self.google_client_secret)

    @property
    def google_redirect_uri(self) -> str:
        return f"{self.backend_url}/auth/google/callback"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def database_url_sync(self) -> str:
        """URL cho Alembic (driver sync)."""
        url = self.database_url
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    @property
    def serp_provider_configured(self) -> bool:
        if self.serp_provider == "fake":
            return True
        if self.serp_provider == "serpapi":
            return bool(self.serp_api_key)
        if self.serp_provider == "dataforseo":
            return bool(self.serp_api_login) and bool(self.serp_api_password)
        return False

    @property
    def google_ads_configured(self) -> bool:
        return all(
            [
                self.google_ads_developer_token,
                self.google_ads_client_id,
                self.google_ads_client_secret,
                self.google_ads_refresh_token,
                self.google_ads_customer_id,
            ]
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
