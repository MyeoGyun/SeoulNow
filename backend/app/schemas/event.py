from __future__ import annotations

from datetime import date, datetime

from app.schemas.base import ORMBase


class EventBase(ORMBase):
    codename: str | None = None
    guname: str | None = None
    title: str
    date: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    place: str | None = None
    org_name: str | None = None
    use_trgt: str | None = None
    use_fee: str | None = None
    player: str | None = None
    program: str | None = None
    etc_desc: str | None = None
    ticket: str | None = None
    theme_code: str | None = None
    org_link: str | None = None
    main_img: str | None = None
    hmpg_addr: str | None = None
    rgst_date: date | None = None
    lot: float | None = None
    lat: float | None = None
    is_free: str | None = None


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime
