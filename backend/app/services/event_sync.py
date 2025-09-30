from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import date, datetime, timezone
import hashlib
from urllib.parse import parse_qs, urlparse

from dateutil import parser as dateutil_parser

import httpx
from httpx import RequestError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.repositories import EventRepository


class EventSyncError(RuntimeError):
    """Raised when the event synchronization process encounters an unrecoverable error."""


API_PAGE_SIZE = 1000
DATASET_NAME = "culturalEventInfo"


def _build_request_url(start: int, end: int) -> str:
    settings = get_settings()
    base = settings.seoul_open_data_api_base.rstrip("/")
    return (
        f"{base}/{settings.seoul_open_data_api_key}/json/{DATASET_NAME}/{start}/{end}"
    )


async def fetch_seoul_events(client: httpx.AsyncClient) -> list[Mapping[str, object]]:
    """Fetch cultural event data from the Seoul public API with pagination."""

    start = 1
    end = API_PAGE_SIZE
    all_records: list[Mapping[str, object]] = []

    while True:
        url = _build_request_url(start, end)
        try:
            response = await client.get(url, timeout=30.0)
        except RequestError as exc:  # pragma: no cover - network failure
            raise EventSyncError(f"서울 열린데이터 API 호출 실패: {exc}") from exc
        response.raise_for_status()

        payload = response.json()
        items = payload.get("culturalEventInfo", {}).get("row", [])  # type: ignore[arg-type]

        if not isinstance(items, list):
            raise EventSyncError("Unexpected response shape from Seoul open data API")

        mapped_items = [item for item in items if isinstance(item, Mapping)]
        if not mapped_items:
            break

        all_records.extend(mapped_items)
        start = end + 1
        end = start + API_PAGE_SIZE - 1

    return all_records


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f"):
        try:
            parsed = datetime.strptime(value, fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    try:
        parsed = dateutil_parser.parse(value)
    except (ValueError, TypeError):
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
    return None


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y%m%d"):
        try:
            parsed = datetime.strptime(value, fmt)
            return parsed.date()
        except ValueError:
            continue
    return None


def transform_event(record: Mapping[str, object]) -> dict:
    """Map raw API fields to the Event model schema."""

    def get_str(key: str) -> str | None:
        value = record.get(key)
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def get_int(key: str) -> int | None:
        value = record.get(key)
        try:
            return int(value) if value is not None else None
        except (ValueError, TypeError):
            return None

    event_id = get_int("CULTCODE")
    if event_id is None:
        # Extract from homepage address query parameter ex) ?cultcode=12345
        hmpg_addr = get_str("HMPG_ADDR")
        if hmpg_addr:
            parsed = urlparse(hmpg_addr)
            query = parse_qs(parsed.query)
            for key in ("cultcode", "CULTCODE"):
                values = query.get(key)
                if values:
                    try:
                        event_id = int(values[0])
                        break
                    except (TypeError, ValueError):
                        continue
        if event_id is None:
            # Stable hash fallback based on title + start/end dates.
            digest_source = "|".join(
                filter(
                    None,
                    [
                        get_str("TITLE") or "",
                        get_str("STRTDATE") or "",
                        get_str("END_DATE") or "",
                        get_str("PLACE") or "",
                    ],
                )
            )
            digest = hashlib.sha1(digest_source.encode("utf-8"), usedforsecurity=False).hexdigest()
            event_id = int(digest[:12], 16)

    start_date = _parse_datetime(get_str("STRTDATE"))
    end_date = _parse_datetime(get_str("END_DATE"))
    timestamp = datetime.now(timezone.utc)

    transformed = {
        "id": event_id,
        "codename": get_str("CODENAME"),
        "guname": get_str("GUNAME"),
        "title": get_str("TITLE") or "제목 미정",
        "date": get_str("DATE"),
        "start_date": start_date,
        "end_date": end_date,
        "place": get_str("PLACE"),
        "org_name": get_str("ORG_NAME"),
        "use_trgt": get_str("USE_TRGT"),
        "use_fee": get_str("USE_FEE"),
        "player": get_str("PLAYER"),
        "program": get_str("PROGRAM"),
        "etc_desc": get_str("ETC_DESC"),
        "ticket": get_str("TICKET"),
        "theme_code": get_str("THEMECODE"),
        "org_link": get_str("ORG_LINK"),
        "main_img": get_str("MAIN_IMG"),
        "hmpg_addr": get_str("HMPG_ADDR"),
        "rgst_date": _parse_date(get_str("RGSTDATE")),
        "lot": _parse_float(get_str("LOT")),
        "lat": _parse_float(get_str("LAT")),
        "is_free": get_str("IS_FREE"),
        "created_at": timestamp,
        "updated_at": timestamp,
    }

    return transformed


def transform_events(records: Iterable[Mapping[str, object]]) -> list[dict]:
    transformed: list[dict] = []
    for record in records:
        try:
            transformed.append(transform_event(record))
        except EventSyncError:
            continue
    return transformed


async def sync_events(session: AsyncSession) -> dict[str, int]:
    """Fetch events from the public API and persist them into the database."""

    settings = get_settings()

    async with httpx.AsyncClient(verify=settings.external_api_verify_ssl) as client:
        raw_records = await fetch_seoul_events(client)

    payloads = transform_events(raw_records)

    repository = EventRepository(session)
    processed = await repository.upsert_many(payloads)

    return {"fetched": len(raw_records), "processed": processed}
