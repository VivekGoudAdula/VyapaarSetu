from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, Query, Path, status
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_staff_or_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.inventory import (
    StockReceiveRequest,
    StockAdjustmentRequest,
    InventoryItemResponse,
    InventoryListResponse,
    InventoryLedgerListResponse,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory Ledger"])


@router.get(
    "",
    response_model=InventoryListResponse,
    summary="List inventory balances and stock alerts"
)
async def list_inventory(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: all | in_stock | low_stock | out_of_stock"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Returns inventory snapshots across all organization products,
    including real-time alerts for low stock and out-of-stock items.
    """
    service = InventoryService(db)
    return await service.list_inventory(
        org_id=tenant.organization_id,
        page=page,
        limit=limit,
        status_filter=status
    )


@router.get(
    "/{product_id}",
    response_model=InventoryItemResponse,
    summary="Retrieve inventory balance for a product"
)
async def get_inventory(
    product_id: str = Path(..., description="Target product ID"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Retrieves current stock on hand, reserved stock, and available units for a product."""
    service = InventoryService(db)
    return await service.get_inventory(
        org_id=tenant.organization_id,
        product_id=ObjectId(product_id)
    )


@router.post(
    "/receive",
    response_model=InventoryItemResponse,
    summary="Record newly received inventory shipment"
)
async def receive_stock(
    payload: StockReceiveRequest,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Atomically increments stock on hand and logs an immutable
    STOCK_RECEIVED event in the append-only ledger.
    """
    service = InventoryService(db)
    return await service.record_stock_received(
        org_id=tenant.organization_id,
        user_id=tenant.user_id,
        payload=payload
    )


@router.post(
    "/adjust",
    response_model=InventoryItemResponse,
    summary="Record manual stock adjustment or damaged stock"
)
async def adjust_stock(
    payload: StockAdjustmentRequest,
    tenant: TenantContext = Depends(require_staff_or_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Applies manual inventory corrections, damaged goods write-offs, or returns.
    Enforces that resulting inventory cannot drop below zero.
    """
    service = InventoryService(db)
    return await service.record_stock_adjustment(
        org_id=tenant.organization_id,
        user_id=tenant.user_id,
        payload=payload
    )


@router.get(
    "/{product_id}/ledger",
    response_model=InventoryLedgerListResponse,
    summary="View movement ledger audit history for a product"
)
async def get_product_ledger(
    product_id: str = Path(..., description="Target product ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """Returns chronological audit trail of all stock movements for the product."""
    service = InventoryService(db)
    return await service.list_product_ledger(
        org_id=tenant.organization_id,
        product_id=ObjectId(product_id),
        page=page,
        limit=limit
    )
