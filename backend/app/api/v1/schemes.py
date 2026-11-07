from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, Query, Path, status
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.scheme import (
    SchemeCreate,
    SchemeUpdate,
    SchemeResponse,
    SchemeListResponse,
    SchemeCalculationRequest,
    SchemeCalculationResponse,
)
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/schemes", tags=["Promotional Schemes"])


@router.post(
    "",
    response_model=SchemeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create promotional trade scheme"
)
async def create_scheme(
    payload: SchemeCreate,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Creates a new trade promotion (Buy X Get Y, Volume Slab Discount, or Percentage Discount).
    """
    service = SchemeService(db)
    return await service.create_scheme(
        org_id=tenant.organization_id,
        payload=payload
    )


@router.get(
    "",
    response_model=SchemeListResponse,
    summary="List trade schemes with active/upcoming/expired breakdown"
)
async def list_schemes(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: all | active | upcoming | expired"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Lists organization promotional schemes categorized by live validity state."""
    service = SchemeService(db)
    return await service.list_schemes(
        org_id=tenant.organization_id,
        page=page,
        limit=limit,
        status_filter=status
    )


@router.get(
    "/{scheme_id}",
    response_model=SchemeResponse,
    summary="Retrieve single scheme details"
)
async def get_scheme(
    scheme_id: str = Path(..., description="Target scheme ID"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Retrieves full configuration and target products for a specific scheme."""
    service = SchemeService(db)
    return await service.get_scheme(
        org_id=tenant.organization_id,
        scheme_id=ObjectId(scheme_id)
    )


@router.put(
    "/{scheme_id}",
    response_model=SchemeResponse,
    summary="Update trade promotional scheme"
)
async def update_scheme(
    payload: SchemeUpdate,
    scheme_id: str = Path(..., description="Target scheme ID"),
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Updates promotional parameters, slabs, or dates."""
    service = SchemeService(db)
    return await service.update_scheme(
        org_id=tenant.organization_id,
        scheme_id=ObjectId(scheme_id),
        payload=payload
    )


@router.delete(
    "/{scheme_id}",
    summary="Deactivate trade scheme"
)
async def delete_scheme(
    scheme_id: str = Path(..., description="Target scheme ID"),
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Deactivates promotional scheme."""
    service = SchemeService(db)
    return await service.delete_scheme(
        org_id=tenant.organization_id,
        scheme_id=ObjectId(scheme_id)
    )


@router.post(
    "/calculate",
    response_model=SchemeCalculationResponse,
    summary="Evaluate trade schemes on order line items"
)
async def calculate_schemes(
    payload: SchemeCalculationRequest,
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Deterministic calculation engine endpoint.
    Takes line items, identifies eligible schemes, and calculates exact discounts and free goods.
    """
    service = SchemeService(db)
    return await service.calculate_order_schemes(
        org_id=tenant.organization_id,
        request=payload
    )

