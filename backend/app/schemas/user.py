from __future__ import annotations

from datetime import datetime

from app.schemas.base import ORMBase


class UserBase(ORMBase):
    username: str
    email: str


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: int
    created_at: datetime
