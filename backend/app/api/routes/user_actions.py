from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user_action import UserAction
from app.db.session import get_session
from app.schemas.user_action import UserActionCreate, UserActionRead

router = APIRouter()


@router.post("/", response_model=UserActionRead, status_code=status.HTTP_201_CREATED)
async def create_action(
    *, session: AsyncSession = Depends(get_session), payload: UserActionCreate
) -> UserActionRead:
    """Persist a user action for analytics purposes."""

    data = payload.model_dump()
    if data.get("timestamp") is None:
        data["timestamp"] = datetime.now(timezone.utc)

    action = UserAction(**data)
    session.add(action)
    await session.commit()
    await session.refresh(action)

    return UserActionRead.model_validate(action)


@router.get("/popular")
async def read_popular(
    *,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=10, ge=1, le=50),
    action_type: str = Query(default="view", description="Count actions of this type only"),
) -> list[dict[str, int | None]]:
    """Return the most interacted-with targets based on user actions."""

    statement = (
        select(UserAction.target_id, func.count(UserAction.id).label("hits"))
        .where(UserAction.action_type == action_type, UserAction.target_id.isnot(None))
        .group_by(UserAction.target_id)
        .order_by(func.count(UserAction.id).desc())
        .limit(limit)
    )

    result = await session.execute(statement)
    rows = result.all()
    return [
        {"target_id": row.target_id, "action_count": int(row.hits)}  # type: ignore[misc]
        for row in rows
    ]
