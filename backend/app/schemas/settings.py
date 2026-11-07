from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class OperatingHoursDay(BaseModel):
    """Daily schedule for warehouse and order acceptance."""
    is_open: bool = Field(True)
    open_time: str = Field("08:00", description="Opening time in 24h format HH:MM")
    close_time: str = Field("20:00", description="Closing time in 24h format HH:MM")


class OperatingHoursConfig(BaseModel):
    """Full weekly operating schedule."""
    monday: OperatingHoursDay = Field(default_factory=OperatingHoursDay)
    tuesday: OperatingHoursDay = Field(default_factory=OperatingHoursDay)
    wednesday: OperatingHoursDay = Field(default_factory=OperatingHoursDay)
    thursday: OperatingHoursDay = Field(default_factory=OperatingHoursDay)
    friday: OperatingHoursDay = Field(default_factory=OperatingHoursDay)
    saturday: OperatingHoursDay = Field(default_factory=lambda: OperatingHoursDay(is_open=True, open_time="08:00", close_time="21:00"))
    sunday: OperatingHoursDay = Field(default_factory=lambda: OperatingHoursDay(is_open=False, open_time="08:00", close_time="14:00"))


class DeliveryAreaConfig(BaseModel):
    """Configuration for serviced delivery geographic zones."""
    cities: List[str] = Field(default_factory=list, description="Serviced cities or towns")
    states: List[str] = Field(default_factory=list, description="Serviced Indian states")
    pin_codes: List[str] = Field(default_factory=list, description="Whitelisted postal PIN codes")
    delivery_notes: Optional[str] = Field(None, max_length=500, description="Dispatch and transport guidelines")


class BusinessProfileUpdate(BaseModel):
    """Update organization profile data."""
    legal_name: Optional[str] = Field(None, max_length=150)
    trade_name: Optional[str] = Field(None, max_length=150)
    gstin: Optional[str] = None
    category: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class BusinessSettingsUpdate(BaseModel):
    """Payload to update business operating settings."""
    profile: Optional[BusinessProfileUpdate] = None
    operating_hours: Optional[OperatingHoursConfig] = None
    delivery_areas: Optional[DeliveryAreaConfig] = None
    minimum_order_value: Optional[float] = Field(None, ge=0.0)
    order_cutoff_time: Optional[str] = Field(None, description="Daily order acceptance cut-off time HH:MM")
    default_language: Optional[str] = Field(None, description="Default conversational language (e.g. hi-IN)")
    supported_languages: Optional[List[str]] = None


class BusinessSettingsResponse(BaseModel):
    """Consolidated business operating configuration response."""
    organization_id: str
    organization_name: str
    legal_name: Optional[str] = None
    trade_name: Optional[str] = None
    gstin: Optional[str] = None
    category: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    minimum_order_value: float = 0.0
    order_cutoff_time: Optional[str] = "18:00"
    default_language: str = "hi-IN"
    supported_languages: List[str] = Field(default_factory=lambda: ["hi-IN", "te-IN", "en-IN"])
    operating_hours: OperatingHoursConfig = Field(default_factory=OperatingHoursConfig)
    delivery_areas: DeliveryAreaConfig = Field(default_factory=DeliveryAreaConfig)

