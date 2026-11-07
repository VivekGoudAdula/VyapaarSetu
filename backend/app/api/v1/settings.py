from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.settings import (
    BusinessSettingsUpdate,
    BusinessSettingsResponse,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Business Operating Settings"])


@router.get(
    "",
    response_model=BusinessSettingsResponse,
    summary="Get business operating configuration"
)
async def get_settings(
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Retrieves business profile, weekly operating hours, delivery areas, and minimum order rules."""
    service = SettingsService(db)
    return await service.get_settings(tenant.organization_id)


@router.put(
    "",
    response_model=BusinessSettingsResponse,
    summary="Update business operating configuration"
)
async def update_settings(
    payload: BusinessSettingsUpdate,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Updates operating hours, delivery zones, order policies, or trade profile."""
    service = SettingsService(db)
    return await service.update_settings(
        org_id=tenant.organization_id,
        payload=payload
    )

