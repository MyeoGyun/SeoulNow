from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from dateutil import parser


def parse_datetime(value: str | None) -> datetime | None:
    """Parse an ISO-like datetime string from the API into UTC-aware datetime."""

    if not value:
        return None
    try:
        dt = parser.parse(value)
    except (ValueError, TypeError):
        return None
    if not dt.tzinfo:
        return dt.replace(tzinfo=datetime.utcnow().astimezone().tzinfo)
    return dt.astimezone(tz=None)


class EventRecordTransformer:
    """Transform raw Seoul Open Data API rows into DB-ready dictionaries."""

    EVENT_ID_FIELD = "CODENAME_SEQ"

    def __init__(self, record: Mapping[str, Any]) -> None:
        self.record = record

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self._int_field("CODENAME_SEQ"),
            "codename": self._str_field("CODENAME"),
            "guname": self._str_field("GUNAME"),
            "title": self._str_field("TITLE", required=True),
            "date": self._str_field("DATE"),
            "start_date": parse_datetime(self._str_field("STRTDATE")),
            "end_date": parse_datetime(self._str_field("END_DATE")),
            "place": self._str_field("PLACE"),
            "org_name": self._str_field("ORG_NAME"),
            "use_trgt": self._str_field("USE_TRGT"),
            "use_fee": self._str_field("USE_FEE"),
            "player": self._str_field("PLAYER"),
            "program": self._str_field("PROGRAM"),
            "etc_desc": self._str_field("ETC_DESC"),
            "ticket": self._str_field("TICKET"),
            "theme_code": self._str_field("THEME_CODE"),
            "org_link": self._str_field("ORG_LINK"),
            "main_img": self._str_field("MAIN_IMG"),
            "hmpg_addr": self._str_field("HMPG_ADDR"),
            "rgst_date": self._parse_date("RGSTDATE"),
            "lot": self._float_field("LOT"),
            "lat": self._float_field("LAT"),
            "is_free": self._str_field("IS_FREE"),
        }

    def _str_field(self, key: str, required: bool = False) -> str | None:
        value = self.record.get(key)
        if isinstance(value, str):
            value = value.strip()
            if value:
                return value
        if required:
            raise ValueError(f"Missing required field: {key}")
        return None

    def _int_field(self, key: str) -> int:
        value = self.record.get(key)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
        raise ValueError(f"Invalid integer field: {key} -> {value}")

    def _float_field(self, key: str) -> float | None:
        value = self.record.get(key)
        if value in (None, ""):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _parse_date(self, key: str):
        value = self.record.get(key)
        if not value:
            return None
        try:
            dt = parser.parse(str(value)).date()
        except (ValueError, TypeError):
            return None
        return dt
