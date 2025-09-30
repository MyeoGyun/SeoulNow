from __future__ import annotations

from datetime import date
from typing import Optional

from app.schemas.base import ORMBase


class WeatherBase(ORMBase):
    date: date
    location: str
    temp: Optional[float] = None
    rain_prob: Optional[float] = None
    pm10: Optional[int] = None


class WeatherCreate(WeatherBase):
    pass


class WeatherRead(WeatherBase):
    id: int
