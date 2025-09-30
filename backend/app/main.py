from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/healthz", tags=["health"])
def read_health() -> dict[str, str]:
    """Simple healthcheck endpoint for monitoring."""
    return {"status": "ok"}
