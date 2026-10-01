"""Đếm số request SerpAPI đã dùng trong tháng và chặn khi vượt trần.

Mỗi lần gọi SerpAPI tốn tiền thật (~0.0075 USD/search). `MONTHLY_SERP_REQUEST_CAP`
là phanh cuối cùng: vượt trần thì API từ chối thay vì tiếp tục đốt ngân sách.

Bộ đếm nằm ở Redis thay vì PostgreSQL vì `INCR` là atomic — hai request đồng
thời không thể cùng đọc một giá trị cũ rồi cùng ghi đè. Key hết hạn sau 70 ngày
nên không cần dọn thủ công; tháng cũ tự biến mất.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

import redis.asyncio as redis
from fastapi import HTTPException

from vaschools_mkt.core.config import settings

log = logging.getLogger(__name__)

# Giữ qua 2 kỳ hóa đơn để còn đối chiếu tháng trước khi cần.
_KEY_TTL_SECONDS = 70 * 24 * 3600


def _month_key(now: datetime | None = None) -> str:
    stamp = (now or datetime.now(tz=UTC)).strftime("%Y-%m")
    return f"serp:requests:{stamp}"


async def _client() -> redis.Redis:
    return redis.from_url(settings.redis_url, decode_responses=True)


async def current_usage() -> int:
    """Số request đã dùng trong tháng này. Redis chết thì trả 0."""
    client = await _client()
    try:
        value = await client.get(_month_key())
        return int(value) if value else 0
    except (redis.RedisError, ValueError) as exc:
        log.warning("Không đọc được bộ đếm SERP: %s", exc)
        return 0
    finally:
        await client.aclose()


async def consume(units: int = 1) -> int:
    """Ghi nhận `units` request vừa dùng. Trả tổng sau khi cộng.

    Gọi SAU khi provider trả kết quả: request lỗi không nên bị tính tiền.
    """
    client = await _client()
    try:
        key = _month_key()
        total = await client.incrby(key, units)
        # Chỉ đặt TTL lần đầu — tránh gia hạn vô tận mỗi lần tăng.
        if total == units:
            await client.expire(key, _KEY_TTL_SECONDS)
        return int(total)
    except redis.RedisError as exc:
        log.warning("Không ghi được bộ đếm SERP: %s", exc)
        return 0
    finally:
        await client.aclose()


async def assert_within_cap(units: int = 1) -> None:
    """Chặn trước khi gọi provider nếu request này sẽ vượt trần tháng."""
    cap = settings.monthly_serp_request_cap
    if cap <= 0:
        return

    used = await current_usage()
    if used + units > cap:
        log.warning("Chặn gọi SerpAPI: đã dùng %s/%s request tháng này", used, cap)
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "SERP_MONTHLY_CAP",
                    "message": (
                        f"Đã dùng hết trần {cap} request SerpAPI của tháng này "
                        f"({used} request). Tăng MONTHLY_SERP_REQUEST_CAP hoặc "
                        f"chờ sang tháng."
                    ),
                    "details": {"used": used, "cap": cap},
                }
            },
        )
