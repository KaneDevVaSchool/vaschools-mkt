"""Định nghĩa nguồn từ khóa trong DB — dùng cho API lọc và tài liệu nội bộ."""

from __future__ import annotations

# Nguồn được coi đáng tin cho báo cáo / bộ nền làm việc (không gồm seed YAML).
TRUSTED_KEYWORD_SOURCES: tuple[str, ...] = ("suggest", "gsc", "paa", "serp_title")

# Nguồn đã ngừng ghi mới; có thể còn trên DB cũ cho đến khi migrate.
DEPRECATED_KEYWORD_SOURCES: tuple[str, ...] = ("seed",)
