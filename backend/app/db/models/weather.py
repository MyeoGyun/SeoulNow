from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Weather(Base):
    """Daily weather snapshot used to contextualize events."""

    __tablename__ = "weather"
    __table_args__ = (
        UniqueConstraint("date", "location", name="uq_weather_date_location"),
        {"sqlite_autoincrement": True},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    temp: Mapped[float | None] = mapped_column(Float, nullable=True)
    rain_prob: Mapped[float | None] = mapped_column(Float, nullable=True)
    pm10: Mapped[int | None] = mapped_column(Integer, nullable=True)
