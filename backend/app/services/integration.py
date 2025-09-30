from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.event import Event
from app.db.models.weather import Weather


async def get_event_with_weather(
    session: AsyncSession,
    *,
    event_id: int,
    location_override: str | None = None,
) -> tuple[Event, Weather | None]:
    """Return an event and the matching weather record, if available."""

    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    weather: Weather | None = None
    target_date: date | None = None

    if event.start_date:
        target_date = event.start_date.date()
    elif event.end_date:
        target_date = event.end_date.date()
    elif event.rgst_date:
        target_date = event.rgst_date

    if target_date is not None:
        location = location_override or event.guname or "서울"
        statement = select(Weather).where(Weather.date == target_date, Weather.location == location)
        result = await session.execute(statement)
        weather = result.scalar_one_or_none()

        if weather is None and location != "서울":
            statement = select(Weather).where(Weather.date == target_date, Weather.location == "서울")
            result = await session.execute(statement)
            weather = result.scalar_one_or_none()

    return event, weather
