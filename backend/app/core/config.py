from functools import lru_cache

from pydantic import Field
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
        default="https://api.seoul.go.kr/openapi",
        alias="SEOUL_OPEN_DATA_API_BASE",
    )
    seoul_open_data_api_key: str = Field(
        default="62716161486b6d6737334b53795872",
        alias="SEOUL_OPEN_DATA_API_KEY",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Provide a cached settings instance for dependency injection."""

    return Settings()  # type: ignore[call-arg]
