from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class PackagingUnitConfig(BaseModel):
    """Packaging unit configuration for wholesale packaging hierarchies."""
    base_unit: str = Field(
        ...,
        description="Smallest consumer sale unit (e.g., PIECE, PACKET, KG, LITRE, G, ML)"
    )
    packaging_unit: str = Field(
        ...,
        description="Wholesale trade packaging unit (e.g., CARTON, BOX, BORI, CASE, PETI, BAG)"
    )
    conversion_factor: int = Field(
        1,
        ge=1,
        description="Number of base units contained in one wholesale packaging unit"
    )


class ProductBase(BaseModel):
    """Common attributes for wholesale products."""
    sku: str = Field(..., min_length=2, max_length=50, description="Stock Keeping Unit code")
    name: str = Field(..., min_length=2, max_length=150, description="Product commercial name")
    brand: Optional[str] = Field(None, max_length=100, description="Brand or manufacturer")
    category: str = Field("General", max_length=100, description="Product category")
    description: Optional[str] = Field(None, max_length=1000, description="Product description")
    
    # Packaging and conversion
    packaging: PackagingUnitConfig = Field(
        default_factory=lambda: PackagingUnitConfig(
            base_unit="PIECE",
            packaging_unit="CARTON",
            conversion_factor=1
        )
    )

    # Decimal-safe monetary fields (INR)
    mrp: float = Field(..., ge=0.0, description="Maximum Retail Price per base unit in INR")
    base_wholesale_price: float = Field(..., ge=0.0, description="Wholesale trade price per packaging unit in INR")
    min_order_quantity: int = Field(1, ge=1, description="Minimum order quantity in packaging units")
    
    # Compliance & Tax
    hsn_code: Optional[str] = Field(None, max_length=20, description="HSN/SAC code for GST")
    tax_rate_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Applicable GST rate percentage")
    
    # Vernacular search aliases (e.g. 'fortune tel', 'pouch 1 litre')
    aliases: List[str] = Field(default_factory=list, description="Vernacular search synonyms for voice matching")
    is_available: bool = Field(True, description="Whether product is active and visible for orders")

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("SKU cannot be empty")
        return cleaned

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Product name cannot be empty")
        return cleaned

    @field_validator("mrp", "base_wholesale_price")
    @classmethod
    def round_currency(cls, v: float) -> float:
        return round(float(v), 2)


class ProductCreate(ProductBase):
    """Payload for creating a new wholesale product."""
    initial_stock: int = Field(0, ge=0, description="Initial stock on hand in packaging units")
    low_stock_threshold: int = Field(10, ge=0, description="Threshold below which low-stock alerts trigger")


class ProductUpdate(BaseModel):
    """Payload for updating an existing wholesale product."""
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    brand: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    packaging: Optional[PackagingUnitConfig] = None
    mrp: Optional[float] = Field(None, ge=0.0)
    base_wholesale_price: Optional[float] = Field(None, ge=0.0)
    min_order_quantity: Optional[int] = Field(None, ge=1)
    hsn_code: Optional[str] = Field(None, max_length=20)
    tax_rate_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    aliases: Optional[List[str]] = None
    is_available: Optional[bool] = None

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().upper()
            if not cleaned:
                raise ValueError("SKU cannot be empty")
            return cleaned
        return v


class ProductResponse(ProductBase):
    """Public representation of a product with inventory snapshot."""
    id: str = Field(..., description="Unique product ID")
    organization_id: str = Field(..., description="Owner organization ID")
    current_stock: int = Field(0, description="Available stock on hand in packaging units")
    reserved_stock: int = Field(0, description="Committed stock in packaging units")
    available_stock: int = Field(0, description="Available uncommitted stock in packaging units")
    stock_status: str = Field("out_of_stock", description="in_stock | low_stock | out_of_stock")
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    """Paginated list of wholesale products."""
    items: List[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int
    categories: List[str] = Field(default_factory=list)
