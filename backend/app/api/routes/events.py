from __future__ import annotations

from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.event import Event
from app.db.session import get_session
from app.schemas.event import EventListResponse, EventLocation, EventRead, EventWithWeather
from app.schemas.weather import WeatherRead
from app.services.event_sync import EventSyncError, sync_events
from app.services.integration import get_event_with_weather

router = APIRouter()


def _apply_event_filters(
    statement: Select,
    guname: str | None,
    codename: str | None,
    is_free: str | None,
    search: str | None,
    start_after: date | None,
    end_before: date | None,
) -> Select:
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
        start_dt = datetime.combine(start_after, time.min, tzinfo=timezone.utc)
        statement = statement.where(Event.start_date >= start_dt)
    if end_before:
        end_dt = datetime.combine(end_before, time.max, tzinfo=timezone.utc)
        statement = statement.where(Event.end_date <= end_dt)
    return statement


@router.get("/", response_model=EventListResponse)
async def list_events(
    *,
    session: AsyncSession = Depends(get_session),
    guname: str | None = Query(default=None, description="행사 지역 (자치구)"),
    codename: str | None = Query(default=None, description="행사 분류"),
    is_free: str | None = Query(default=None, description="유/무료 여부"),
    search: str | None = Query(default=None, description="행사명 텍스트 검색"),
    start_after: date | None = Query(default=None, description="이 날짜 이후 시작하는 행사"),
    end_before: date | None = Query(default=None, description="이 날짜 이전 종료하는 행사"),
    limit: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
) -> EventListResponse:
    """List events with optional filtering and pagination."""

    base_statement: Select = select(Event)
    filtered_statement = _apply_event_filters(
        base_statement, guname, codename, is_free, search, start_after, end_before
    )

    count_statement: Select = _apply_event_filters(
        select(func.count()).select_from(Event),
        guname,
        codename,
        is_free,
        search,
        start_after,
        end_before,
    )
    total_result = await session.execute(count_statement)
    total = total_result.scalar_one()

    paginated_statement = filtered_statement.order_by(Event.start_date.asc().nulls_last(), Event.id.asc()).offset(offset)
    
    if limit is not None:
        paginated_statement = paginated_statement.limit(limit)
    result = await session.execute(paginated_statement)
    events = result.scalars().all()

    return EventListResponse(
        items=[EventRead.model_validate(event) for event in events],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/locations", response_model=list[EventLocation])
async def list_event_locations(
    *,
    session: AsyncSession = Depends(get_session),
    guname: str | None = Query(default=None, description="행사 지역 (자치구)"),
    codename: str | None = Query(default=None, description="행사 분류"),
    is_free: str | None = Query(default=None, description="유/무료 여부"),
    search: str | None = Query(default=None, description="행사명 텍스트 검색"),
    start_after: date | None = Query(default=None, description="이 날짜 이후 시작하는 행사"),
    end_before: date | None = Query(default=None, description="이 날짜 이전 종료하는 행사"),
    limit: int = Query(default=1000, ge=1, le=5000),
) -> list[EventLocation]:
    """Return event coordinates for map rendering."""

    statement: Select[tuple[Event]] = select(Event)
    statement = _apply_event_filters(
        statement, guname, codename, is_free, search, start_after, end_before
    )
    statement = statement.where(Event.lat.isnot(None), Event.lot.isnot(None))
    statement = statement.order_by(Event.start_date.asc().nulls_last(), Event.id.asc())
    statement = statement.limit(limit)

    result = await session.execute(statement)
    events = result.scalars().all()
    return [EventLocation.model_validate(event) for event in events]


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

    try:
        result = await sync_events(session)
    except EventSyncError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {"status": "sync-complete", **result}


@router.get("/{event_id}/with-weather", response_model=EventWithWeather)
async def read_event_with_weather(
    *,
    session: AsyncSession = Depends(get_session),
    event_id: int,
    location: str | None = Query(default=None, description="날씨 조회 시 사용될 지역 명"),
) -> EventWithWeather:
    """Fetch a single event along with the matching weather snapshot if available."""

    event, weather = await get_event_with_weather(
        session, event_id=event_id, location_override=location
    )
    weather_payload = WeatherRead.model_validate(weather) if weather else None
    return EventWithWeather(event=EventRead.model_validate(event), weather=weather_payload)
