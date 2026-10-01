"""Nhãn nguồn dữ liệu.

Quy tắc quan trọng nhất của dự án: rủi ro lớn nhất không phải số liệu sai, mà
là số liệu ƯỚC TÍNH bị đọc nhầm thành số liệu THẬT khi trình bày với lãnh đạo.

Nhãn gắn ở tầng dữ liệu, không ở tầng UI — để không thể bị quên khi thêm màn
hình mới. Xem docs/01-architecture/data-provenance.md.
"""

from enum import Enum
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field


class Provenance(str, Enum):
    """Xếp theo thứ tự tin cậy giảm dần."""

    MEASURED = "MEASURED"  # Đo trực tiếp từ hệ thống VAS (GA4, GSC)
    OBSERVED = "OBSERVED"  # Quan sát trực tiếp từ SERP thật
    VENDOR = "VENDOR"  # Nhà cung cấp trả về, ta không tính lại
    ESTIMATED = "ESTIMATED"  # Tự tính bằng mô hình nội bộ


# Thứ tự tin cậy. Số nhỏ hơn = đáng tin hơn.
_RANK: dict[Provenance, int] = {
    Provenance.MEASURED: 0,
    Provenance.OBSERVED: 1,
    Provenance.VENDOR: 2,
    Provenance.ESTIMATED: 3,
}

# Nhãn hiển thị trên UI (tiếng Việt).
DISPLAY_LABEL: dict[Provenance, str] = {
    Provenance.MEASURED: "Thật",
    Provenance.OBSERVED: "Quan sát",
    Provenance.VENDOR: "Nhà cung cấp",
    Provenance.ESTIMATED: "Ước tính",
}


def combine(*sources: Provenance) -> Provenance:
    """Một số liệu dẫn xuất mang nhãn THẤP NHẤT trong các đầu vào của nó.

    Volume(VENDOR) × CTR(ESTIMATED) → ESTIMATED.
    """
    if not sources:
        raise ValueError("combine() cần ít nhất một nguồn")
    return max(sources, key=lambda p: _RANK[p])


T = TypeVar("T")


class Metric(BaseModel, Generic[T]):
    """Một số liệu kèm nhãn nguồn.

    Mọi hàm trong analytics/ phải trả về đối tượng này, không trả số trần.

    `value=None` nghĩa là KHÔNG CÓ DỮ LIỆU — không bao giờ thay bằng 0 hay
    một con số tự ước lượng.
    """

    value: T | None = None
    provenance: Provenance
    unit: str | None = None
    note: str | None = None
    # Công thức tính, hiển thị trong tooltip cho số ESTIMATED.
    formula: str | None = None

    def model_post_init(self, __context: Any) -> None:
        if self.value is None and self.note is None:
            # Ép người viết code giải thích vì sao không có dữ liệu.
            object.__setattr__(self, "note", "Không có dữ liệu")


def measured(value: T, **kw: Any) -> Metric[T]:
    return Metric(value=value, provenance=Provenance.MEASURED, **kw)


def observed(value: T, **kw: Any) -> Metric[T]:
    return Metric(value=value, provenance=Provenance.OBSERVED, **kw)


def vendor(value: T | None, **kw: Any) -> Metric[T]:
    return Metric(value=value, provenance=Provenance.VENDOR, **kw)


def estimated(value: T | None, **kw: Any) -> Metric[T]:
    return Metric(value=value, provenance=Provenance.ESTIMATED, **kw)


class Meta(BaseModel):
    """Khối meta đi kèm mọi response.

    `data_fetched_at` bắt buộc: "số này cũ chưa" là câu hỏi thường trực khi
    trình bày báo cáo.
    """

    data_fetched_at: str | None = None
    is_stale: bool = False
    note: str | None = None


class ListResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: dict[str, int] = Field(default_factory=dict)
    meta: Meta = Field(default_factory=Meta)


class ItemResponse(BaseModel, Generic[T]):
    data: T
    meta: Meta = Field(default_factory=Meta)
