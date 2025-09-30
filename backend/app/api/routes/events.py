from __future__ import annotations

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.event import Event
from app.db.session import get_session
from app.schemas.event import EventRead
from app.services.event_sync import sync_events

router = APIRouter()


def _apply_event_filters(
    statement: Select[tuple[Event]],
    guname: str | None,
    codename: str | None,
    is_free: str | None,
    search: str | None,
    start_after: date | None,
    end_before: date | None,
) -> Select[tuple[Event]]:
    if guname:
        statement = statement.where(Event.guname == guname)
    if codename:
        statement = statement.where(Event.codename == codename)
    if is_free:
        statement = statement.where(Event.is_free == is_free)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(Event.title.ilike(pattern))
    if start_after:
        start_dt = datetime.combine(start_after, time.min)
        statement = statement.where(Event.start_date >= start_dt)
    if end_before:
        end_dt = datetime.combine(end_before, time.max)
        statement = statement.where(Event.end_date <= end_dt)
    return statement


@router.get("/", response_model=list[EventRead])
async def list_events(
    *,
    session: AsyncSession = Depends(get_session),
    guname: str | None = Query(default=None, description="행사 지역 (자치구)"),
    codename: str | None = Query(default=None, description="행사 분류"),
    is_free: str | None = Query(default=None, description="유/무료 여부"),
    search: str | None = Query(default=None, description="행사명 텍스트 검색"),
    start_after: date | None = Query(default=None, description="이 날짜 이후 시작하는 행사"),
    end_before: date | None = Query(default=None, description="이 날짜 이전 종료하는 행사"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[EventRead]:
    """List events with optional filtering and pagination."""

    statement: Select[tuple[Event]] = select(Event)
    statement = _apply_event_filters(
        statement, guname, codename, is_free, search, start_after, end_before
    )
    statement = statement.order_by(Event.start_date.asc().nulls_last(), Event.id.asc())
    statement = statement.offset(offset).limit(limit)

    result = await session.execute(statement)
    events = result.scalars().all()
    return [EventRead.model_validate(event) for event in events]


@router.get("/{event_id}", response_model=EventRead)
async def get_event(*, session: AsyncSession = Depends(get_session), event_id: int) -> EventRead:
    """Retrieve a single event by identifier."""

    event = await session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    return EventRead.model_validate(event)


@router.post("/sync", status_code=status.HTTP_202_ACCEPTED)
async def trigger_event_sync(*, session: AsyncSession = Depends(get_session)) -> dict[str, int | str]:
    """Trigger a background synchronization with the Seoul public API.

    This endpoint currently performs the fetch inline and returns the number of
    discovered records. Revisit once a background task runner (Celery / RQ /
    APScheduler) is introduced.
    """

    processed = await sync_events(session)
    return {"status": "sync-started", "records_discovered": processed}
