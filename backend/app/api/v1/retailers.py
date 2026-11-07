from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, Query, Path, status
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.retailer import (
    RetailerCreate,
    RetailerUpdate,
    RetailerResponse,
    RetailerListResponse,
)
from app.services.retailer_service import RetailerService

router = APIRouter(prefix="/retailers", tags=["Retailer Directory"])


@router.post(
    "",
    response_model=RetailerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Kirana store retailer"
)
async def create_retailer(
    payload: RetailerCreate,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Registers a new retailer account with verified 10-digit primary phone,
    credit limits, and multiple delivery addresses.
    """
    service = RetailerService(db)
    return await service.create_retailer(
        org_id=tenant.organization_id,
        payload=payload
    )


@router.get(
    "",
    response_model=RetailerListResponse,
    summary="List registered retailers"
)
async def list_retailers(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by store name, owner, phone, or GSTIN"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Lists retailers for the organization with search filter and credit allocation metrics."""
    service = RetailerService(db)
    return await service.list_retailers(
        org_id=tenant.organization_id,
        page=page,
        limit=limit,
        search=search
    )


@router.get(
    "/{retailer_id}",
    response_model=RetailerResponse,
    summary="Retrieve single retailer account"
)
async def get_retailer(
    retailer_id: str = Path(..., description="Target retailer ID"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Retrieves full retailer profile, address book, and balance details."""
    service = RetailerService(db)
    return await service.get_retailer(
        org_id=tenant.organization_id,
        retailer_id=ObjectId(retailer_id)
    )


@router.put(
    "/{retailer_id}",
    response_model=RetailerResponse,
    summary="Update retailer account and delivery locations"
)
async def update_retailer(
    payload: RetailerUpdate,
    retailer_id: str = Path(..., description="Target retailer ID"),
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Updates retailer contact, credit, addresses, or language preference."""
    service = RetailerService(db)
    return await service.update_retailer(
        org_id=tenant.organization_id,
        retailer_id=ObjectId(retailer_id),
        payload=payload
    )


@router.delete(
    "/{retailer_id}",
    summary="Deactivate retailer account"
)
async def delete_retailer(
    retailer_id: str = Path(..., description="Target retailer ID"),
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Deactivates a retailer account."""
    service = RetailerService(db)
    return await service.delete_retailer(
        org_id=tenant.organization_id,
        retailer_id=ObjectId(retailer_id)
    )
