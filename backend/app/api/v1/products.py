from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, Query, Path, status
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Product Catalogue"])


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new wholesale product"
)
async def create_product(
    payload: ProductCreate,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Creates a new wholesale product in the organization's catalogue,
    initializes its inventory record, and records opening stock in the ledger.
    """
    service = ProductService(db)
    return await service.create_product(
        org_id=tenant.organization_id,
        user_id=tenant.user_id,
        payload=payload
    )


@router.get(
    "",
    response_model=ProductListResponse,
    summary="List organization products with real-time stock balances"
)
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for name, SKU, brand, or vernacular alias"),
    category: Optional[str] = Query(None, description="Category filter"),
    is_available: Optional[bool] = Query(None, description="Availability filter"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Lists wholesale products scoped strictly to the authenticated organization.
    Supports full-text vernacular search, category filtering, and pagination.
    """
    service = ProductService(db)
    return await service.list_products(
        org_id=tenant.organization_id,
        page=page,
        limit=limit,
        search=search,
        category=category,
        is_available=is_available
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Retrieve single product details and stock status"
)
async def get_product(
    product_id: str = Path(..., description="Target product ID"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Retrieves full details and inventory snapshot for a specific product."""
    service = ProductService(db)
    return await service.get_product(
        org_id=tenant.organization_id,
        product_id=ObjectId(product_id)
    )


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product details, pricing, or packaging unit"
)
async def update_product(
    payload: ProductUpdate,
    product_id: str = Path(..., description="Target product ID"),
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Updates wholesale product attributes with SKU collision protection."""
    service = ProductService(db)
    return await service.update_product(
        org_id=tenant.organization_id,
        product_id=ObjectId(product_id),
        payload=payload
    )


@router.delete(
    "/{product_id}",
    summary="Deactivate product in catalogue"
)
async def delete_product(
    product_id: str = Path(..., description="Target product ID"),
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """Soft-deactivates product to preserve historical ledger and order records."""
    service = ProductService(db)
    return await service.delete_product(
        org_id=tenant.organization_id,
        product_id=ObjectId(product_id)
    )
