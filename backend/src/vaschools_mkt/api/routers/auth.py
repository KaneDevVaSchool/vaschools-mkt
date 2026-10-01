"""Google Workspace SSO.

Controller mỏng: chỉ điều phối request/redirect. Business logic nằm ở
auth_service (theo pattern Controller → Service của va-workspace).
"""

import logging
from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse

from vaschools_mkt.api import auth_service
from vaschools_mkt.core.config import settings
from vaschools_mkt.core.models import SessionUser

log = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])

oauth = OAuth()
if settings.google_configured:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

SESSION_USER_KEY = "user"
SESSION_REDIRECT_KEY = "login.redirect"


def _frontend_url(path: str, **query: str | None) -> str:
    q = {k: v for k, v in query.items() if v}
    base = f"{settings.frontend_url}{path}"
    return f"{base}?{urlencode(q)}" if q else base


def _fail_login(message: str) -> RedirectResponse:
    return RedirectResponse(_frontend_url("/login", error=message))


@router.get("/auth/google/redirect")
async def google_redirect(request: Request):
    """Chuyển hướng sang Google consent screen."""
    if not settings.google_configured:
        return _fail_login("Đăng nhập Google chưa được cấu hình trên máy chủ.")

    # Đã đăng nhập rồi → về thẳng trang chủ, không chạy lại OAuth.
    if request.session.get(SESSION_USER_KEY):
        return RedirectResponse(_frontend_url("/"))

    request.session[SESSION_REDIRECT_KEY] = auth_service.sanitize_redirect(
        request.query_params.get("redirect")
    )

    domains = settings.allowed_domains
    return await oauth.google.authorize_redirect(
        request,
        settings.google_redirect_uri,
        # hd: gợi ý Google lọc sẵn theo domain tổ chức (chỉ là gợi ý UI —
        # việc chặn thật vẫn do auth_service.domain_allowed làm).
        hd=domains[0] if domains else None,
        prompt="select_account",
    )


@router.get("/auth/google/callback")
async def google_callback(request: Request):
    """Nhận callback từ Google, xác thực và tạo session."""
    if not settings.google_configured:
        return _fail_login("Đăng nhập Google chưa được cấu hình.")

    if request.query_params.get("error"):
        return _fail_login("Bạn đã hủy đăng nhập bằng Google.")

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as exc:
        log.warning("Google OAuth thất bại: %s", exc)
        return _fail_login("Phiên đăng nhập đã hết hạn. Vui lòng thử lại.")

    claims = token.get("userinfo") or {}

    try:
        user = auth_service.authenticate(claims)
    except auth_service.MissingEmail:
        return _fail_login("Không lấy được email từ tài khoản Google.")
    except auth_service.EmailDomainNotAllowed:
        allowed = ", ".join(settings.allowed_domains)
        return _fail_login(f"Chỉ tài khoản thuộc {allowed} mới được đăng nhập.")

    request.session[SESSION_USER_KEY] = SessionUser(
        email=user.email, name=user.name, avatar_url=user.avatar_url
    ).model_dump()

    redirect = request.session.pop(SESSION_REDIRECT_KEY, None)
    return RedirectResponse(_frontend_url("/auth/callback", status="ok", redirect=redirect))


@router.get("/auth/me")
async def me(request: Request):
    """Frontend gọi khi khởi động để biết đã đăng nhập chưa."""
    user = request.session.get(SESSION_USER_KEY)
    if not user:
        return JSONResponse(
            {"error": {"code": "UNAUTHENTICATED", "message": "Chưa đăng nhập."}},
            status_code=401,
        )
    return {"data": user}


@router.post("/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return {"data": {"message": "Đã đăng xuất."}}
