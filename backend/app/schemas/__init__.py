"""Pydantic schema definitions for API payloads."""

from .event import EventBase, EventCreate, EventRead, EventWithWeather, EventLocation  # noqa: F401
from .user import UserBase, UserCreate, UserRead  # noqa: F401
from .user_action import UserActionBase, UserActionCreate, UserActionRead  # noqa: F401
from .weather import WeatherBase, WeatherCreate, WeatherRead  # noqa: F401
