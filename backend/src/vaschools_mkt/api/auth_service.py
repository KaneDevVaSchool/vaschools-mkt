"""Xác thực Google OAuth: kiểm domain → tìm/tạo user → lưu.

Port logic từ va-workspace (Modules/Identity/App/Services/GoogleAuthenticator.php),
rút gọn: không employee linking, không lockout, không role bootstrap.
"""

from typing import Any

from vaschools_mkt.core.config import settings
from vaschools_mkt.core.models import User
from vaschools_mkt.db import fake_store


class EmailDomainNotAllowed(Exception):
    """Email không thuộc domain được phép đăng nhập."""

    def __init__(self, email: str) -> None:
        self.email = email
        super().__init__(f"Domain không được phép: {email}")


class MissingEmail(Exception):
    """Google không trả về email — không thể xác thực."""


def domain_allowed(email: str) -> bool:
    domains = settings.allowed_domains
    if not domains:
        # Chưa cấu hình domain nào → chặn tất cả (an toàn theo mặc định).
        return False
    return email.strip().lower().split("@")[-1] in domains


def authenticate(claims: dict[str, Any]) -> User:
    """Nhận userinfo từ Google, trả về User đã lưu.

    Raises:
        MissingEmail: Google không trả email.
        EmailDomainNotAllowed: email ngoài domain cho phép.
    """
    email = str(claims.get("email") or "").strip().lower()
    if not email:
        raise MissingEmail

    if not domain_allowed(email):
        raise EmailDomainNotAllowed(email)

    return fake_store.upsert(
        google_id=str(claims.get("sub") or ""),
        email=email,
        name=str(claims.get("name") or email.split("@")[0]),
        avatar_url=claims.get("picture"),
    )


def sanitize_redirect(redirect: str | None) -> str | None:
    """Chỉ cho phép quay về path nội bộ (SPA), chặn open-redirect."""
    if not isinstance(redirect, str):
        return None
    value = redirect.strip()
    if not value.startswith("/") or value.startswith("//"):
        return None
    # Chặn scheme/host giả trong path (open redirect).
    lower = value.lower()
    if lower.startswith("/\\") or "://" in value.split("?", 1)[0]:
        return None
    return value
