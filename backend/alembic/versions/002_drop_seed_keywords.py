"""Xóa từ khóa nguồn seed (YAML/tổ hợp) — chỉ giữ nguồn đáng tin trong kho.

Revision ID: 002_drop_seed
Revises: 001_week1
Create Date: 2026-10-29
"""

from typing import Sequence, Union

from alembic import op

revision: str = "002_drop_seed"
down_revision: Union[str, None] = "001_week1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM keywords WHERE source = 'seed'")


def downgrade() -> None:
    # Không khôi phục dữ liệu đã xóa.
    pass
