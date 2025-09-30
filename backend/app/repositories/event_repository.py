from __future__ import annotations

from typing import Iterable

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.event import Event


class EventRepository:
    """Repository for persisting and querying event records."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_many(self, payloads: Iterable[dict]) -> int:
        """Insert or update events using PostgreSQL upsert semantics."""

        payloads = list(payloads)
        if not payloads:
            return 0

        total_processed = 0

        def chunk(items: list[dict], size: int) -> Iterable[list[dict]]:
            for index in range(0, len(items), size):
                yield items[index : index + size]

        for batch in chunk(payloads, 500):
            insert_stmt = insert(Event).values(batch)
            update_columns = {
                column.key: getattr(insert_stmt.excluded, column.key)
                for column in Event.__table__.columns
                if column.key not in {"id", "created_at"}
            }
            statement = insert_stmt.on_conflict_do_update(
                index_elements=[Event.id],
                set_=update_columns,
            )
            result = await self.session.execute(statement)
            total_processed += result.rowcount or len(batch)

        await self.session.commit()
        return total_processed

    async def list_existing_ids(self) -> set[int]:
        """Return the set of event IDs currently stored."""

        statement = select(Event.id)
        result = await self.session.execute(statement)
        return set(result.scalars().all())
