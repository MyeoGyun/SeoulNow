from __future__ import annotations

from datetime import datetime
from typing import Any

from app.schemas.base import ORMBase


class UserActionBase(ORMBase):
    user_id: int | None = None
    action_type: str
    target_id: int | None = None
    timestamp: datetime | None = None
    metadata: dict[str, Any] | None = None


class UserActionCreate(UserActionBase):
    pass


class UserActionRead(UserActionBase):
    id: int
    timestamp: datetime
