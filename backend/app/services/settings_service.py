from typing import Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.schemas.settings import (
    BusinessSettingsUpdate,
    BusinessSettingsResponse,
    OperatingHoursConfig,
    DeliveryAreaConfig,
)


class SettingsService:
    """
    Business Operating Settings Service.
    Configures wholesale operating hours, minimum order values, delivery pincodes, and business profile.
    Strictly scoped to authenticated organization_id.
    """
    def __init__(self, db: AsyncDatabase):
        self.db = db

    async def get_settings(self, org_id: ObjectId) -> BusinessSettingsResponse:
        """Retrieves active organization settings and operating schedules."""
        org = await self.db.organizations.find_one({"_id": org_id})
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

        settings = org.get("settings", {})
        contact = org.get("contact", {})

        hours_raw = settings.get("operating_hours")
        operating_hours = OperatingHoursConfig(**hours_raw) if hours_raw else OperatingHoursConfig()

        areas_raw = settings.get("delivery_areas")
        delivery_areas = DeliveryAreaConfig(**areas_raw) if areas_raw else DeliveryAreaConfig()

        return BusinessSettingsResponse(
            organization_id=str(org_id),
            organization_name=org.get("name", "Wholesale Hub"),
            legal_name=org.get("legal_name"),
            trade_name=org.get("trade_name") or org.get("name"),
            gstin=org.get("gstin"),
            category=org.get("category"),
            contact_phone=contact.get("phone"),
            contact_email=contact.get("email"),
            minimum_order_value=float(settings.get("minimum_order_value", 0.0)),
            order_cutoff_time=settings.get("order_cutoff_time", "18:00"),
            default_language=settings.get("default_language", "hi-IN"),
            supported_languages=settings.get("supported_languages", ["hi-IN", "te-IN", "en-IN"]),
            operating_hours=operating_hours,
            delivery_areas=delivery_areas,
        )

    async def update_settings(
        self,
        org_id: ObjectId,
        payload: BusinessSettingsUpdate
    ) -> BusinessSettingsResponse:
        """Updates organization operating configuration."""
        org = await self.db.organizations.find_one({"_id": org_id})
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

        set_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        # Update profile attributes if specified
        if payload.profile:
            p = payload.profile
            if p.legal_name is not None:
                set_fields["legal_name"] = p.legal_name
            if p.trade_name is not None:
                set_fields["trade_name"] = p.trade_name
            if p.gstin is not None:
                set_fields["gstin"] = p.gstin.strip().upper() if p.gstin else None
            if p.category is not None:
                set_fields["category"] = p.category
            if p.contact_phone is not None:
                set_fields["contact.phone"] = p.contact_phone
            if p.contact_email is not None:
                set_fields["contact.email"] = p.contact_email

        # Update nested settings fields
        if payload.operating_hours is not None:
            set_fields["settings.operating_hours"] = payload.operating_hours.model_dump()
        if payload.delivery_areas is not None:
            set_fields["settings.delivery_areas"] = payload.delivery_areas.model_dump()
        if payload.minimum_order_value is not None:
            set_fields["settings.minimum_order_value"] = round(payload.minimum_order_value, 2)
        if payload.order_cutoff_time is not None:
            set_fields["settings.order_cutoff_time"] = payload.order_cutoff_time
        if payload.default_language is not None:
            set_fields["settings.default_language"] = payload.default_language
        if payload.supported_languages is not None:
            set_fields["settings.supported_languages"] = payload.supported_languages

        await self.db.organizations.update_one(
            {"_id": org_id},
            {"$set": set_fields}
        )

        return await self.get_settings(org_id)

