from fastapi import APIRouter

from app.api.routes import events, weather, user_actions, images

api_router = APIRouter()

api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(user_actions.router, prefix="/actions", tags=["user-actions"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
