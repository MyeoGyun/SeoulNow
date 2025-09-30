from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.weather import Weather
from app.db.session import get_session
from app.schemas.weather import WeatherRead
from app.services.weather_sync import WeatherSyncError, sync_weather

router = APIRouter()


@router.get("/", response_model=WeatherRead)
async def read_weather(
    *,
    session: AsyncSession = Depends(get_session),
    query_date: date = Query(..., description="조회할 날짜"),
    location: str = Query("서울", description="지역 명")
) -> WeatherRead:
    """Retrieve stored weather data for a specific date and location."""

    statement = select(Weather).where(Weather.date == query_date, Weather.location == location)
    result = await session.execute(statement)
    weather = result.scalar_one_or_none()
    if weather is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weather data not found")

    return WeatherRead.model_validate(weather)


@router.post("/sync", status_code=status.HTTP_202_ACCEPTED)
async def trigger_weather_sync(
    *,
    session: AsyncSession = Depends(get_session),
    location: str | None = Query(default=None, description="기상 데이터 기준 지역명"),
    nx: int | None = Query(default=None, description="기상청 격자 X 좌표"),
    ny: int | None = Query(default=None, description="기상청 격자 Y 좌표"),
    base_datetime: datetime | None = Query(default=None, description="기준 시각 (선택)"),
) -> dict[str, int | str]:
    """Trigger weather data synchronisation from the KMA short-term forecast API."""

    try:
        result = await sync_weather(
            session,
            location=location,
            nx=nx,
            ny=ny,
            base_datetime=base_datetime,
        )
    except WeatherSyncError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {"status": "sync-complete", **result}
