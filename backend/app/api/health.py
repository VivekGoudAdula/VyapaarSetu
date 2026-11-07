from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.db.mongodb import mongo_manager

router = APIRouter(tags=["Health & Telemetry"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    error: Optional[str] = None
    timestamp: str


@router.get("/health", response_model=HealthResponse)
async def check_health(response: Response):
    """
    Comprehensive system health check.
    Genuinely pings the configured MongoDB instance.
    Returns HTTP 200 when database is connected, or HTTP 503 if unreachable.
    """
    is_db_connected, db_error = await mongo_manager.ping()
    now_iso = datetime.now(timezone.utc).isoformat()

    if is_db_connected:
        return HealthResponse(
            status="ok",
            service="vyapaar-setu-api",
            version=settings.APP_VERSION,
            database="connected",
            error=None,
            timestamp=now_iso,
        )

    # Degraded mode: FastAPI server is online, but database is unavailable
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(
        status="degraded",
        service="vyapaar-setu-api",
        version=settings.APP_VERSION,
        database="disconnected",
        error=db_error or "Unable to reach MongoDB instance",
        timestamp=now_iso,
    )


@router.get("/api/v1/ping")
async def ping_liveness():
    """Lightweight liveness probe for load balancers."""
    return {"ping": "pong", "service": "vyapaar-setu-api"}

