"""Chuẩn hóa từ khóa — giữ dấu tiếng Việt trong text gốc."""

import re
import unicodedata


def normalize_keyword(text: str) -> str:
    """Khóa duy nhất: lowercase + gom khoảng trắng, không bỏ dấu."""
    collapsed = re.sub(r"\s+", " ", text.strip().lower())
    return collapsed


def strip_accents(text: str) -> str:
    """Sinh biến thể không dấu (seed riêng, không ghi đè bản có dấu)."""
    normalized = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
