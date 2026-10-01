"""Schema v1 tuần 1: domains, keywords, serp_snapshots, rankings.

Revision ID: 001_week1
Revises:
Create Date: 2026-03-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_week1"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "domains",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("domain", sa.Text(), nullable=False),
        sa.Column("is_ours", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("include_subdomains", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("brand_terms", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("review_status", sa.Text(), nullable=False, server_default="pending_review"),
        sa.Column("added_manually", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("domain"),
    )

    op.create_table(
        "keywords",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("normalized_text", sa.Text(), nullable=False),
        sa.Column("location", sa.Text(), nullable=False),
        sa.Column("language", sa.Text(), nullable=False),
        sa.Column("intent", sa.Text(), nullable=True),
        sa.Column("intent_confidence", sa.Numeric(3, 2), nullable=True),
        sa.Column("tier", sa.Text(), nullable=False, server_default="standard"),
        sa.Column("source", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("normalized_text", "location", "language", name="uq_keywords_norm_loc_lang"),
    )
    op.create_index(
        "ix_keywords_tier",
        "keywords",
        ["tier"],
        unique=False,
        postgresql_where=sa.text("tier = 'priority'"),
    )
    op.create_index("ix_keywords_intent", "keywords", ["intent"], unique=False)

    op.create_table(
        "serp_snapshots",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("keyword_id", sa.BigInteger(), nullable=False),
        sa.Column("search_engine", sa.Text(), nullable=False, server_default="google"),
        sa.Column("location", sa.Text(), nullable=False),
        sa.Column("language", sa.Text(), nullable=False),
        sa.Column("device", sa.Text(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("results_count", sa.BigInteger(), nullable=True),
        sa.Column("raw", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("parsed_results", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("serp_features", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["keyword_id"], ["keywords.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_serp_keyword_time",
        "serp_snapshots",
        ["keyword_id", "fetched_at"],
        unique=False,
        postgresql_ops={"fetched_at": "DESC"},
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_serp_daily ON serp_snapshots (
            keyword_id, search_engine, location, language, device,
            ((fetched_at AT TIME ZONE 'UTC')::date)
        )
        """
    )
    op.execute(
        "CREATE INDEX ix_serp_features ON serp_snapshots USING GIN (serp_features)"
    )

    op.create_table(
        "rankings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("keyword_id", sa.BigInteger(), nullable=False),
        sa.Column("domain_id", sa.BigInteger(), nullable=False),
        sa.Column("snapshot_id", sa.BigInteger(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("all_positions", postgresql.ARRAY(sa.Integer()), nullable=True),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["domain_id"], ["domains.id"]),
        sa.ForeignKeyConstraint(["keyword_id"], ["keywords.id"]),
        sa.ForeignKeyConstraint(["snapshot_id"], ["serp_snapshots.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("keyword_id", "domain_id", "snapshot_id", name="uq_ranking_kw_domain_snap"),
    )
    op.create_index(
        "ix_rankings_domain_time",
        "rankings",
        ["domain_id", "observed_at"],
        unique=False,
        postgresql_ops={"observed_at": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("ix_rankings_domain_time", table_name="rankings")
    op.drop_table("rankings")
    op.execute("DROP INDEX IF EXISTS ix_serp_features")
    op.execute("DROP INDEX IF EXISTS uq_serp_daily")
    op.drop_index("ix_serp_keyword_time", table_name="serp_snapshots")
    op.drop_table("serp_snapshots")
    op.drop_index("ix_keywords_intent", table_name="keywords")
    op.drop_index("ix_keywords_tier", table_name="keywords")
    op.drop_table("keywords")
    op.drop_table("domains")
