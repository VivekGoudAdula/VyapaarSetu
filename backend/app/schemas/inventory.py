from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class StockReceiveRequest(BaseModel):
    """Payload to record newly received inventory shipment."""
    product_id: str = Field(..., description="Target product ID")
    quantity_received: int = Field(..., gt=0, description="Quantity received in packaging units")
    supplier_invoice: Optional[str] = Field(None, max_length=100, description="Supplier invoice or GRN number")
    batch_number: Optional[str] = Field(None, max_length=100, description="Optional batch or lot number")
    notes: Optional[str] = Field(None, max_length=500, description="Audit notes")


class StockAdjustmentRequest(BaseModel):
    """Payload to record stock correction, return, or damaged stock."""
    product_id: str = Field(..., description="Target product ID")
    movement_type: str = Field(
        ...,
        description="MANUAL_ADJUSTMENT | STOCK_DAMAGED | STOCK_RETURNED | STOCK_CORRECTION"
    )
    quantity_delta: int = Field(
        ...,
        description="Positive or negative quantity change in packaging units"
    )
    reason: str = Field(..., min_length=2, max_length=200, description="Mandatory audit justification")
    notes: Optional[str] = Field(None, max_length=500)


class InventoryItemResponse(BaseModel):
    """Stock snapshot for a product."""
    id: str
    organization_id: str
    product_id: str
    product_name: str
    product_sku: str
    packaging_unit: str
    base_unit: str
    conversion_factor: int
    quantity_on_hand: int
    quantity_reserved: int
    quantity_available: int
    reorder_threshold: int
    status: str  # in_stock | low_stock | out_of_stock
    last_restocked_at: Optional[datetime] = None
    updated_at: datetime


class InventoryListResponse(BaseModel):
    """Paginated list of inventory balances with summary metrics."""
    items: List[InventoryItemResponse]
    total: int
    page: int
    limit: int
    pages: int
    total_skus: int
    low_stock_count: int
    out_of_stock_count: int


class InventoryLedgerItem(BaseModel):
    """Append-only audit record of an inventory movement."""
    id: str
    organization_id: str
    product_id: str
    movement_type: str
    quantity_delta: int
    quantity_before: int
    quantity_after: int
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_by_user_id: Optional[str] = None
    created_at: datetime


class InventoryLedgerListResponse(BaseModel):
    """Paginated inventory movement ledger history."""
    items: List[InventoryLedgerItem]
    total: int
    page: int
    limit: int
    pages: int

