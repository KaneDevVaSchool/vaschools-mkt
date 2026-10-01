"""Lưu trữ in-memory cho giai đoạn demo.

Thay bằng PostgreSQL + SQLAlchemy theo docs/03-data/database-schema.md khi
dựng module thật. Interface giữ nguyên nên service không cần sửa.
"""

from datetime import UTC, datetime

from vaschools_mkt.core.models import User

# google_id -> User
_users: dict[str, User] = {}
# email -> google_id, để tra theo email
_email_index: dict[str, str] = {}


def find_by_google_id(google_id: str) -> User | None:
    return _users.get(google_id)


def find_by_email(email: str) -> User | None:
    google_id = _email_index.get(email.lower())
    return _users.get(google_id) if google_id else None


def upsert(google_id: str, email: str, name: str, avatar_url: str | None) -> User:
    """Ưu tiên tra theo google_id (bất biến kể cả khi đổi email)."""
    now = datetime.now(UTC)
    existing = find_by_google_id(google_id) or find_by_email(email)

    user = User(
        google_id=google_id,
        email=email,
        name=name,
        avatar_url=avatar_url,
        created_at=existing.created_at if existing else now,
        last_login_at=now,
    )

    if existing and existing.email.lower() != email.lower():
        _email_index.pop(existing.email.lower(), None)

    _users[google_id] = user
    _email_index[email.lower()] = google_id
    return user


def count() -> int:
    return len(_users)
