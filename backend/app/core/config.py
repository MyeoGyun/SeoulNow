from functools import lru_cache
import json
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="Seoul Now API", alias="APP_NAME")
    api_prefix: str = Field(default="/api", alias="API_PREFIX")

    database_url: str = Field(
        default="postgresql+asyncpg://seoulnow:seoulnow@localhost:5432/seoulnow",
        alias="DATABASE_URL",
    )

    seoul_open_data_api_base: str = Field(
        default="http://openapi.seoul.go.kr:8088",
        alias="SEOUL_OPEN_DATA_API_BASE",
    )
    seoul_open_data_api_key: str = Field(
        default="62716161486b6d6737334b53795872",
        alias="SEOUL_OPEN_DATA_API_KEY",
    )

    kma_api_base: str = Field(
        default="https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0",
        alias="KMA_API_BASE",
    )
    kma_api_service_key: str = Field(
        default="PLEASE_PROVIDE_KMA_KEY",
        alias="KMA_API_SERVICE_KEY",
    )
    kma_default_location: str = Field(default="서울", alias="KMA_DEFAULT_LOCATION")
    kma_default_nx: int = Field(default=60, alias="KMA_DEFAULT_NX")
    kma_default_ny: int = Field(default=127, alias="KMA_DEFAULT_NY")

    external_api_verify_ssl: bool = Field(default=True, alias="EXTERNAL_API_VERIFY_SSL")
    cors_origins: Annotated[str | list[str], Field(alias="CORS_ORIGINS", default="http://localhost:3000")]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                try:
                    parsed = json.loads(stripped)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return [origin.strip() for origin in value if isinstance(origin, str) and origin.strip()]

    @property
    def allowed_cors_origins(self) -> list[str]:
        return self.cors_origins


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Provide a cached settings instance for dependency injection."""

    return Settings()  # type: ignore[call-arg]
