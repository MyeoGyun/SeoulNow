from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.weather import Weather
from app.db.session import get_session
from app.schemas.weather import WeatherRead

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
