from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Event(Base):
    """Event model representing cultural activities in Seoul."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    codename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guname: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    date: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    place: Mapped[str | None] = mapped_column(String(255), nullable=True)
    org_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    use_trgt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    use_fee: Mapped[str | None] = mapped_column(Text, nullable=True)
    player: Mapped[str | None] = mapped_column(Text, nullable=True)
    program: Mapped[str | None] = mapped_column(Text, nullable=True)
    etc_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    ticket: Mapped[str | None] = mapped_column(String(255), nullable=True)
    theme_code: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    org_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    main_img: Mapped[str | None] = mapped_column(Text, nullable=True)
    hmpg_addr: Mapped[str | None] = mapped_column(Text, nullable=True)
    rgst_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    lot: Mapped[float | None] = mapped_column(Float, nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_free: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
