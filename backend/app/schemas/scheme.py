from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class VolumeSlab(BaseModel):
    """Volume slab definition for tiered wholesale pricing."""
    min_quantity: int = Field(..., ge=1, description="Minimum order quantity for this tier")
    max_quantity: Optional[int] = Field(None, ge=1, description="Maximum order quantity (inclusive), null for unbounded")
    discount_percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage discount applied in this slab")


class SchemeBase(BaseModel):
    """Base schema for promotional trade schemes."""
    name: str = Field(..., min_length=2, max_length=150, description="Promotional scheme title")
    description: Optional[str] = Field(None, max_length=500, description="Details or marketing text")
    scheme_type: str = Field(
        ...,
        description="BUY_X_GET_Y | VOLUME_SLAB_DISCOUNT | PERCENTAGE_DISCOUNT | FIXED_AMOUNT_DISCOUNT"
    )
    applicable_product_ids: List[str] = Field(
        default_factory=list,
        description="List of target product IDs eligible for this promotion"
    )
    
    # Conditions
    buy_quantity: Optional[int] = Field(None, ge=1, description="For BUY_X_GET_Y: required purchase units")
    min_order_quantity: Optional[int] = Field(None, ge=1, description="Minimum threshold for discount activation")
    slabs: Optional[List[VolumeSlab]] = Field(None, description="Tiered volume discount slabs")
    
    # Benefits
    free_product_id: Optional[str] = Field(None, description="For BUY_X_GET_Y: product ID of free goods")
    free_quantity: Optional[int] = Field(None, ge=1, description="For BUY_X_GET_Y: quantity of free goods given per batch")
    discount_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Percentage discount")
    discount_amount: Optional[float] = Field(None, ge=0.0, description="Fixed rupee discount per unit or order")
    
    # Validity
    starts_at: datetime = Field(..., description="Start date/time of promotion")
    ends_at: Optional[datetime] = Field(None, description="End date/time of promotion (null for evergreen)")
    is_active: bool = Field(True, description="Whether scheme is currently active")

    @field_validator("scheme_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        valid_types = {
            "BUY_X_GET_Y",
            "VOLUME_SLAB_DISCOUNT",
            "PERCENTAGE_DISCOUNT",
            "FIXED_AMOUNT_DISCOUNT"
        }
        if v not in valid_types:
            raise ValueError(f"Scheme type must be one of: {', '.join(valid_types)}")
        return v


class SchemeCreate(SchemeBase):
    """Payload to create a new promotional scheme."""
    pass


class SchemeUpdate(BaseModel):
    """Payload to update an existing promotional scheme."""
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    applicable_product_ids: Optional[List[str]] = None
    buy_quantity: Optional[int] = Field(None, ge=1)
    min_order_quantity: Optional[int] = Field(None, ge=1)
    slabs: Optional[List[VolumeSlab]] = None
    free_product_id: Optional[str] = None
    free_quantity: Optional[int] = Field(None, ge=1)
    discount_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    discount_amount: Optional[float] = Field(None, ge=0.0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class SchemeResponse(SchemeBase):
    """Public representation of a trade scheme."""
    id: str
    organization_id: str
    status: str  # active | upcoming | expired
    applicable_product_names: List[str] = Field(default_factory=list)
    free_product_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SchemeListResponse(BaseModel):
    """Paginated list of trade promotional schemes."""
    items: List[SchemeResponse]
    total: int
    page: int
    limit: int
    pages: int
    active_count: int
    upcoming_count: int
    expired_count: int


# Line-item calculation schemas
class OrderLineItemInput(BaseModel):
    """Line item for scheme calculation."""
    product_id: str
    quantity: int = Field(..., ge=1, description="Quantity in packaging units")
    unit_price: float = Field(..., ge=0.0, description="Base wholesale unit price in INR")


class SchemeCalculationRequest(BaseModel):
    """Request to test and calculate applied promotions on order items."""
    items: List[OrderLineItemInput]


class AppliedSchemeBenefit(BaseModel):
    """Benefit yielded by an applied scheme."""
    scheme_id: str
    scheme_name: str
    scheme_type: str
    discount_amount: float = 0.0
    free_items: List[Dict[str, Any]] = Field(default_factory=list)
    applied_to_product_id: str


class CalculatedLineItem(BaseModel):
    """Line item calculation result."""
    product_id: str
    quantity: int
    unit_price: float
    gross_amount: float
    total_discount: float
    net_amount: float
    applied_schemes: List[AppliedSchemeBenefit] = Field(default_factory=list)


class SchemeCalculationResponse(BaseModel):
    """Summary of deterministic promotional scheme evaluation."""
    lines: List[CalculatedLineItem]
    subtotal: float
    total_savings: float
    final_total: float
    free_goods_summary: List[Dict[str, Any]] = Field(default_factory=list)
