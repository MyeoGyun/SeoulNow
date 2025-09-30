from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from datetime import date, datetime, timedelta, timezone
from statistics import fmean
from typing import Any, Mapping

import httpx
from httpx import RequestError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.repositories import WeatherRepository

KST = timezone(timedelta(hours=9))
KMA_BASE_HOURS = (2, 5, 8, 11, 14, 17, 20, 23)


class WeatherSyncError(RuntimeError):
    """Raised when the weather synchronisation process fails."""


def _determine_base_datetime(reference: datetime | None = None) -> tuple[str, str, date]:
    now = reference.astimezone(KST) if reference else datetime.now(KST)

    for hour in reversed(KMA_BASE_HOURS):
        if now.hour >= hour:
            base_date = now.date()
            base_time = f"{hour:02d}00"
            break
    else:
        base_date = (now - timedelta(days=1)).date()
        base_time = f"{KMA_BASE_HOURS[-1]:02d}00"

    return base_date.strftime("%Y%m%d"), base_time, base_date


async def fetch_short_term_forecast(
    client: httpx.AsyncClient,
    *,
    base_date: str,
    base_time: str,
    nx: int,
    ny: int,
) -> list[Mapping[str, Any]]:
    settings = get_settings()

    params = {
        "serviceKey": settings.kma_api_service_key,
        "pageNo": 1,
        "numOfRows": 1000,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    url = f"{settings.kma_api_base}/getVilageFcst"
    try:
        response = await client.get(url, params=params, timeout=30.0)
    except RequestError as exc:  # pragma: no cover - network failure
        raise WeatherSyncError(f"기상청 API 호출 실패: {exc}") from exc
    response.raise_for_status()

    payload = response.json()
    response_body = payload.get("response", {}).get("body", {})
    header = payload.get("response", {}).get("header", {})

    if header.get("resultCode") != "00":
        raise WeatherSyncError(header.get("resultMsg", "Unknown error from KMA API"))

    items = response_body.get("items", {}).get("item", [])
    if not isinstance(items, list):
        raise WeatherSyncError("Unexpected response structure from KMA API")

    return [item for item in items if isinstance(item, Mapping)]


def _safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def transform_forecast(
    items: Iterable[Mapping[str, Any]], *, location: str
) -> list[dict[str, Any]]:
    daily_buckets: dict[date, dict[str, Any]] = defaultdict(lambda: {"temps": [], "rain_probs": [], "pm10": None})

    for item in items:
        fcst_date_str = item.get("fcstDate")
        if not isinstance(fcst_date_str, str):
            continue
        try:
            forecast_date = datetime.strptime(fcst_date_str, "%Y%m%d").date()
        except ValueError:
            continue

        bucket = daily_buckets[forecast_date]
        category = item.get("category")
        value = item.get("fcstValue")

        if category == "TMP":
            temp_value = _safe_float(value)
            if temp_value is not None:
                bucket["temps"].append(temp_value)
        elif category == "POP":
            rain_value = _safe_float(value)
            if rain_value is not None:
                bucket["rain_probs"].append(rain_value)
        elif category == "PM10":
            bucket["pm10"] = int(value) if str(value).isdigit() else bucket["pm10"]

    payloads: list[dict[str, Any]] = []
    for forecast_date, stats in daily_buckets.items():
        temps = stats["temps"]
        rain_probs = stats["rain_probs"]

        payloads.append(
            {
                "date": forecast_date,
                "location": location,
                "temp": fmean(temps) if temps else None,
                "rain_prob": max(rain_probs) if rain_probs else None,
                "pm10": stats["pm10"],
            }
        )

    return payloads


async def sync_weather(
    session: AsyncSession,
    *,
    location: str | None = None,
    nx: int | None = None,
    ny: int | None = None,
    base_datetime: datetime | None = None,
) -> dict[str, int]:
    settings = get_settings()

    loc = location or settings.kma_default_location
    nx_value = nx if nx is not None else settings.kma_default_nx
    ny_value = ny if ny is not None else settings.kma_default_ny

    base_date, base_time, _ = _determine_base_datetime(base_datetime)

    async with httpx.AsyncClient(verify=settings.external_api_verify_ssl) as client:
        items = await fetch_short_term_forecast(
            client,
            base_date=base_date,
            base_time=base_time,
            nx=nx_value,
            ny=ny_value,
        )

    payloads = transform_forecast(items, location=loc)

    repository = WeatherRepository(session)
    processed = await repository.upsert_many(payloads)

    return {
        "fetched": len(items),
        "days": len(payloads),
        "processed": processed,
    }
