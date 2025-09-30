from __future__ import annotations

from datetime import date

from app.schemas.base import ORMBase


class WeatherBase(ORMBase):
    date: date
    location: str
    temp: float | None = None
    rain_prob: float | None = None
    pm10: int | None = None


class WeatherCreate(WeatherBase):
    pass


class WeatherRead(WeatherBase):
    id: int
