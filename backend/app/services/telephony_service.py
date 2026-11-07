"""
Vyapaar सेतु — Telephony Configuration Service.
Manages organization-to-phone mapping, global phone uniqueness, Vobiz API verification,
and inbound call number-to-tenant resolution.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from app.core.config import settings
from app.integrations.vobiz.webhooks import normalize_e164
from app.integrations.vobiz.client import vobiz_client


class TelephonyService:
    """Service handling Vobiz phone number configuration and tenant resolution."""

    def __init__(self, db: AsyncDatabase):
        self.db = db

    def _format_phone_config(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Formats a MongoDB phone_config document for API response."""
        return {
            "id": str(doc["_id"]),
            "organization_id": str(doc["organization_id"]),
            "phone_number": doc.get("phone_number", ""),
            "provider": doc.get("provider", "VOBIZ"),
            "is_active": doc.get("is_active", True),
            "display_label": doc.get("display_label") or "Primary Wholesale Sales Line",
            "webhook_url": settings.inbound_webhook_url,
            "websocket_url": settings.websocket_stream_url,
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }

    async def get_phone_config(self, organization_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the active phone configuration for a specific organization."""
        doc = await self.db.phone_configs.find_one({"organization_id": organization_id})
        if not doc:
            # If VOBIZ_PHONE_NUMBER is configured in .env, automatically provision it for this organization
            # provided no other organization has claimed it
            if settings.VOBIZ_PHONE_NUMBER and settings.VOBIZ_PHONE_NUMBER.strip():
                normalized_env = normalize_e164(settings.VOBIZ_PHONE_NUMBER.strip())
                existing = await self.db.phone_configs.find_one({"phone_number": normalized_env})
                if not existing:
                    return await self.upsert_phone_config(
                        organization_id=organization_id,
                        phone_number=normalized_env,
                        is_active=True,
                        display_label="Primary Wholesale Sales Line (.env)",
                    )
            return None
        return self._format_phone_config(doc)

    async def upsert_phone_config(
        self,
        organization_id: str,
        phone_number: str,
        is_active: bool = True,
        display_label: Optional[str] = "Primary Wholesale Sales Line",
    ) -> Dict[str, Any]:
        """
        Assigns or updates a dedicated Vobiz business phone number for the organization.
        Enforces strict global uniqueness so two distributors cannot claim the same phone number.
        """
        normalized = normalize_e164(phone_number)
        if not normalized:
            raise ValueError("Invalid phone number format. Provide a valid Indian mobile or landline number.")

        # Check global uniqueness across other organizations
        existing = await self.db.phone_configs.find_one({
            "phone_number": normalized,
            "organization_id": {"$ne": organization_id}
        })
        if existing:
            raise ValueError(f"Phone number {normalized} is already assigned to another organization.")

        now = datetime.now(timezone.utc).isoformat()
        update_fields = {
            "organization_id": organization_id,
            "phone_number": normalized,
            "provider": "VOBIZ",
            "is_active": is_active,
            "display_label": display_label or "Primary Wholesale Sales Line",
            "updated_at": now,
        }

        result = await self.db.phone_configs.update_one(
            {"organization_id": organization_id},
            {"$set": update_fields, "$setOnInsert": {"created_at": now}},
            upsert=True
        )

        doc = await self.db.phone_configs.find_one({"organization_id": organization_id})
        return self._format_phone_config(doc)

    async def resolve_org_by_phone(self, called_phone: str) -> Optional[Dict[str, Any]]:
        """
        Resolves the target tenant organization based on the dialed Vobiz phone number ('To').
        Strict multi-tenant security: callers only reach the specific organization that owns the number.
        """
        normalized = normalize_e164(called_phone)
        if not normalized:
            return None

        # Primary check with normalized E.164
        doc = await self.db.phone_configs.find_one({
            "phone_number": normalized,
            "is_active": True
        })
        
        # Secondary fallback if stored without leading +
        if not doc and normalized.startswith("+"):
            doc = await self.db.phone_configs.find_one({
                "phone_number": normalized[1:],
                "is_active": True
            })

        # Fallback: if dialed number matches settings.VOBIZ_PHONE_NUMBER in .env and not yet bound,
        # auto-bind to the first active organization
        if not doc and settings.VOBIZ_PHONE_NUMBER:
            normalized_env = normalize_e164(settings.VOBIZ_PHONE_NUMBER.strip())
            if normalized == normalized_env:
                first_org = await self.db.organizations.find_one({"is_active": True})
                if first_org:
                    org_id = str(first_org["_id"])
                    await self.upsert_phone_config(
                        organization_id=org_id,
                        phone_number=normalized_env,
                        is_active=True,
                        display_label="Default Vobiz Business Line (.env)",
                    )
                    doc = await self.db.phone_configs.find_one({"organization_id": org_id})

        return doc

    async def test_connection(self) -> Dict[str, Any]:
        """Invokes Vobiz client credential check and returns diagnosis."""
        vobiz_result = await vobiz_client.test_connection()
        return {
            "status": vobiz_result["status"],
            "is_connected": vobiz_result["is_connected"],
            "message": vobiz_result["message"],
            "details": vobiz_result.get("details"),
            "provider": "VOBIZ",
            "auth_id_configured": bool(settings.VOBIZ_AUTH_ID),
        }

