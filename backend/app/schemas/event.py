from datetime import date as date_type, datetime
from typing import Optional

from app.schemas.base import ORMBase
from app.schemas.weather import WeatherRead


class EventBase(ORMBase):
    codename: Optional[str] = None
    guname: Optional[str] = None
    title: str
    date: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    place: Optional[str] = None
    org_name: Optional[str] = None
    use_trgt: Optional[str] = None
    use_fee: Optional[str] = None
    player: Optional[str] = None
    program: Optional[str] = None
    etc_desc: Optional[str] = None
    ticket: Optional[str] = None
    theme_code: Optional[str] = None
    org_link: Optional[str] = None
    main_img: Optional[str] = None
    hmpg_addr: Optional[str] = None
    rgst_date: Optional[date_type] = None
    lot: Optional[float] = None
    lat: Optional[float] = None
    is_free: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime


class EventWithWeather(ORMBase):
    event: EventRead
    weather: Optional[WeatherRead] = None


class EventLocation(ORMBase):
    id: int
    title: str
    lat: Optional[float] = None
    lot: Optional[float] = None
    guname: Optional[str] = None
    codename: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_free: Optional[str] = None


class EventListResponse(ORMBase):
    items: list[EventRead]
    total: int
    limit: int
    offset: int
