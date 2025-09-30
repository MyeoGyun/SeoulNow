from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from app.schemas.base import ORMBase


class UserActionBase(ORMBase):
    user_id: Optional[int] = None
    action_type: str
    target_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    metadata: Optional[dict[str, Any]] = None


class UserActionCreate(UserActionBase):
    pass


class UserActionRead(UserActionBase):
    id: int
    timestamp: datetime
