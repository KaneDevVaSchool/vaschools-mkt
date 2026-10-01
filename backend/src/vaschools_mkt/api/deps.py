"""Dependency FastAPI — session đăng nhập."""

from fastapi import HTTPException, Request

from vaschools_mkt.core.models import SessionUser

SESSION_USER_KEY = "user"


def get_current_user(request: Request) -> SessionUser:
    raw = request.session.get(SESSION_USER_KEY)
    if not raw:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "UNAUTHENTICATED", "message": "Chưa đăng nhập."}},
        )
    return SessionUser.model_validate(raw)
