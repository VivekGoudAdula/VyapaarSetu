import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.db.mongodb import mongo_manager

logger = logging.getLogger("vyapaar_setu.health")
router = APIRouter(tags=["Health & Telemetry"])


class HealthResponse(BaseModel):
    """
    Public health check response model.
    Adheres to security best practices: provides operational availability status
    without exposing internal infrastructure, topology, driver internals, or credentials.
    """
    status: str
    service: str
    version: str
    database: str
    timestamp: str


@router.get("/health", response_model=HealthResponse)
async def check_health(response: Response):
    """
    Public system health check endpoint.
    Performs a genuine administrative ping against the isolated database.
    Returns HTTP 200 when database is operational, or HTTP 503 if unreachable.
    Internal error details are preserved in secure server logs.
    """
    is_db_connected, db_error = await mongo_manager.ping()
    now_iso = datetime.now(timezone.utc).isoformat()

    if is_db_connected:
        return HealthResponse(
            status="ok",
            service="vyapaar-setu-api",
            version=settings.APP_VERSION,
            database="connected",
            timestamp=now_iso,
        )

    # Degraded mode: Database connection check failed
    logger.error(f"Health check failed - Database unavailable: {db_error}")
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(
        status="degraded",
        service="vyapaar-setu-api",
        version=settings.APP_VERSION,
        database="disconnected",
        timestamp=now_iso,
    )


@router.get("/api/v1/ping")
async def ping_liveness():
    """Lightweight liveness probe for load balancers."""
    return {"ping": "pong", "service": "vyapaar-setu-api"}
