from __future__ import annotations

from collections.abc import Mapping

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings


class EventSyncError(RuntimeError):
    """Raised when the event synchronization process encounters an unrecoverable error."""


async def fetch_seoul_events(client: httpx.AsyncClient) -> list[Mapping[str, object]]:
    """Fetch cultural event data from the Seoul public API.

    This is a lightweight placeholder implementation that documents the
    integration contract. The actual payload parsing and pagination handling
    should be implemented once the external API format is finalised.
    """

    settings = get_settings()

    url = (
        f"{settings.seoul_open_data_api_base}/cultureInfo/{settings.seoul_open_data_api_key}/json/1/100"
    )

    response = await client.get(url, timeout=30.0)
    response.raise_for_status()

    payload = response.json()
    # The OA-15486 dataset nests records under the "culturalEventInfo" key.
    records = payload.get("culturalEventInfo", {}).get("row", [])  # type: ignore[arg-type]

    if not isinstance(records, list):  # Defensive: the API sometimes returns dicts when empty.
        raise EventSyncError("Unexpected response shape from Seoul open data API")

    return [record for record in records if isinstance(record, Mapping)]


async def sync_events(session: AsyncSession) -> int:
    """Fetch events from the public API and persist them into the database.

    Returns the number of records processed. The persistence logic is left as a
    follow-up task and should replace the placeholder once the data model is
    confirmed.
    """

    async with httpx.AsyncClient() as client:
        records = await fetch_seoul_events(client)

    # TODO: Transform and upsert records into the events table.
    # For now we simply return the count so the endpoint has a meaningful
    # response without touching the database state.
    return len(records)
