from __future__ import annotations

from typing import Iterable

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.weather import Weather


class WeatherRepository:
    """Repository handling persistence of weather snapshots."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_many(self, payloads: Iterable[dict]) -> int:
        payloads = list(payloads)
        if not payloads:
            return 0

        insert_stmt = insert(Weather).values(payloads)
        update_columns = {
            column.key: getattr(insert_stmt.excluded, column.key)
            for column in Weather.__table__.columns
            if column.key not in {"id"}
        }

        statement = insert_stmt.on_conflict_do_update(
            index_elements=[Weather.date, Weather.location],
            set_=update_columns,
        )

        result = await self.session.execute(statement)
        await self.session.commit()
        rowcount = result.rowcount
        if rowcount is None or rowcount < 0:
            return len(payloads)
        return rowcount
