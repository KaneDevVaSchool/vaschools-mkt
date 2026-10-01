"""Model dùng chung. Không import gì khác trong package (xem repo-structure.md)."""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class User(BaseModel):
    """Người dùng đã xác thực qua Google Workspace.

    Giai đoạn demo: lưu in-memory (db/fake_store.py). Khi có DB thật, thay
    repository bên dưới — model này không cần sửa.
    """

    google_id: str
    email: EmailStr
    name: str
    avatar_url: str | None = None
    created_at: datetime
    last_login_at: datetime

    @property
    def email_domain(self) -> str:
        return self.email.split("@")[-1].lower()


class SessionUser(BaseModel):
    """Phần thông tin user trả về cho frontend. Không kèm dữ liệu nhạy cảm."""

    email: str
    name: str
    avatar_url: str | None = None
