"""SQLAlchemy ORM — schema v1 tuần 1."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Domain(Base):
    __tablename__ = "domains"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    domain: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    is_ours: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    include_subdomains: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    brand_terms: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    review_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")
    added_manually: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    rankings: Mapped[list["Ranking"]] = relationship(back_populates="domain")


class Keyword(Base):
    __tablename__ = "keywords"
    __table_args__ = (
        UniqueConstraint("normalized_text", "location", "language", name="uq_keywords_norm_loc_lang"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(Text, nullable=False)
    intent: Mapped[str | None] = mapped_column(Text)
    intent_confidence: Mapped[float | None] = mapped_column(Numeric(3, 2))
    tier: Mapped[str] = mapped_column(Text, nullable=False, default="standard")
    source: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    serp_snapshots: Mapped[list["SerpSnapshot"]] = relationship(back_populates="keyword")
    rankings: Mapped[list["Ranking"]] = relationship(back_populates="keyword")


class SerpSnapshot(Base):
    __tablename__ = "serp_snapshots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    keyword_id: Mapped[int] = mapped_column(ForeignKey("keywords.id"), nullable=False)
    search_engine: Mapped[str] = mapped_column(Text, nullable=False, default="google")
    location: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(Text, nullable=False)
    device: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    results_count: Mapped[int | None] = mapped_column(BigInteger)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)
    parsed_results: Mapped[dict] = mapped_column(JSONB, nullable=False)
    serp_features: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    keyword: Mapped["Keyword"] = relationship(back_populates="serp_snapshots")
    rankings: Mapped[list["Ranking"]] = relationship(back_populates="snapshot")


class Ranking(Base):
    __tablename__ = "rankings"
    __table_args__ = (
        UniqueConstraint("keyword_id", "domain_id", "snapshot_id", name="uq_ranking_kw_domain_snap"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    keyword_id: Mapped[int] = mapped_column(ForeignKey("keywords.id"), nullable=False)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), nullable=False)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("serp_snapshots.id"), nullable=False)
    position: Mapped[int | None] = mapped_column(Integer)
    url: Mapped[str | None] = mapped_column(Text)
    all_positions: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    keyword: Mapped["Keyword"] = relationship(back_populates="rankings")
    domain: Mapped["Domain"] = relationship(back_populates="rankings")
    snapshot: Mapped["SerpSnapshot"] = relationship(back_populates="rankings")
