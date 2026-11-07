import math
import re
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.core.config import settings
from app.integrations.twilio.client import INDIA_VOICE_NOTICE, TRIAL_ACCOUNT_NOTICE
from app.integrations.twilio.twiml_builder import get_default_media_stream_url
from app.schemas.telephony import (
    PhoneConfigResponse,
    PhoneConfigUpdate,
    VoicePersonaConfig,
    CallResponse,
    CallDetailResponse,
    CallEventResponse,
    CallListResponse,
)

logger = logging.getLogger(__name__)

# Monotonic status ranks to prevent out-of-order webhook regression
STATUS_RANK = {
    "QUEUED": 0,
    "RINGING": 1,
    "IN_PROGRESS": 2,
    "COMPLETED": 3,
    "BUSY": 3,
    "FAILED": 3,
    "NO_ANSWER": 3,
    "CANCELED": 3
}


class TelephonyService:
    """
    Business service for Twilio Telephony configuration, call lifecycle orchestration,
    retailer caller ID resolution, and call event auditing.
    Strictly enforces multi-tenant organization isolation.
    """

    def __init__(self, db: AsyncDatabase):
        self.db = db

    def _get_webhook_urls(self) -> Dict[str, str]:
        """Construct the canonical inbound webhook and websocket URLs for Twilio."""
        base = settings.PUBLIC_BASE_URL.rstrip("/")
        webhook_url = f"{base}/api/v1/webhooks/twilio/inbound-call"
        websocket_url = get_default_media_stream_url()
        return {
            "webhook_url": webhook_url,
            "websocket_url": websocket_url
        }

    async def get_or_create_config(self, org_id: ObjectId) -> PhoneConfigResponse:
        """
        Fetch the telephony configuration for an organization.
        If no configuration exists, automatically initializes a default record.
        """
        doc = await self.db.phone_configs.find_one({"organization_id": org_id})

        if not doc:
            now = datetime.now(timezone.utc)
            default_phone = settings.TWILIO_PHONE_NUMBER or ""
            doc = {
                "organization_id": org_id,
                "provider": "TWILIO",
                "phone_number": default_phone,
                "is_active": True,
                "voice_persona": {
                    "greeting_name": None,
                    "default_language": "hi-IN",
                    "agent_gender": "FEMALE",
                    "fallback_forward_phone": None
                },
                "created_at": now,
                "updated_at": now
            }
            # Only insert if no conflict on default phone number
            if default_phone:
                existing_phone = await self.db.phone_configs.find_one({"phone_number": default_phone})
                if existing_phone:
                    doc["phone_number"] = ""

            await self.db.phone_configs.insert_one(doc)

        urls = self._get_webhook_urls()
        persona_data = doc.get("voice_persona", {})

        return PhoneConfigResponse(
            organization_id=str(doc["organization_id"]),
            provider=doc.get("provider", "TWILIO"),
            phone_number=doc.get("phone_number", ""),
            is_active=doc.get("is_active", True),
            voice_persona=VoicePersonaConfig(**persona_data),
            webhook_url=urls["webhook_url"],
            websocket_url=urls["websocket_url"],
            india_voice_notice=INDIA_VOICE_NOTICE,
            trial_notice=TRIAL_ACCOUNT_NOTICE,
            created_at=doc["created_at"],
            updated_at=doc["updated_at"]
        )

    async def update_config(
        self,
        org_id: ObjectId,
        payload: PhoneConfigUpdate
    ) -> PhoneConfigResponse:
        """
        Update an organization's phone number and voice persona settings.
        Enforces global uniqueness of phone_number across all organizations.
        """
        phone_num = payload.phone_number.strip()

        # Check if another organization is already using this phone number
        if phone_num:
            conflict = await self.db.phone_configs.find_one({
                "phone_number": phone_num,
                "organization_id": {"$ne": org_id}
            })
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Phone number '{phone_num}' is already assigned to another distributor organization."
                )

        now = datetime.now(timezone.utc)
        update_data = {
            "phone_number": phone_num,
            "is_active": payload.is_active,
            "updated_at": now
        }
        if payload.voice_persona is not None:
            update_data["voice_persona"] = payload.voice_persona.model_dump()

        result = await self.db.phone_configs.find_one_and_update(
            {"organization_id": org_id},
            {"$set": update_data},
            upsert=True,
            return_document=True
        )

        urls = self._get_webhook_urls()
        persona_data = result.get("voice_persona", {})

        return PhoneConfigResponse(
            organization_id=str(result["organization_id"]),
            provider=result.get("provider", "TWILIO"),
            phone_number=result.get("phone_number", ""),
            is_active=result.get("is_active", True),
            voice_persona=VoicePersonaConfig(**persona_data),
            webhook_url=urls["webhook_url"],
            websocket_url=urls["websocket_url"],
            india_voice_notice=INDIA_VOICE_NOTICE,
            trial_notice=TRIAL_ACCOUNT_NOTICE,
            created_at=result.get("created_at", now),
            updated_at=result.get("updated_at", now)
        )

    async def resolve_inbound_call(
        self,
        from_phone: str,
        to_phone: str,
        call_sid: str,
        account_sid: str = ""
    ) -> Dict[str, Any]:
        """
        Handle an incoming Twilio voice call webhook:
        1. Resolve tenant organization by the called Twilio number (`to_phone`).
        2. Match caller ID (`from_phone`) to a registered Kirana retailer directory entry.
        3. Idempotently initialize call document and audit log event.
        """
        clean_to = to_phone.strip()
        clean_from = from_phone.strip()

        # Step 1: Match organization by assigned phone number
        config_doc = await self.db.phone_configs.find_one({
            "phone_number": clean_to,
            "is_active": True
        })

        if not config_doc:
            logger.warning(
                f"Inbound call to '{clean_to}' rejected: No active organization configured with this number."
            )
            return {
                "allowed": False,
                "reason": "UNASSIGNED_OR_INACTIVE_NUMBER",
                "message": "This number is not currently configured for an active Vyapaar सेतु organization."
            }

        org_id = config_doc["organization_id"]

        # Step 2: Match caller to registered retailers in this organization
        # Handle 10-digit Indian mobile formats (+919876543210 or 9876543210)
        from_digits = re.sub(r"\D", "", clean_from)
        ten_digit = from_digits[-10:] if len(from_digits) >= 10 else from_digits

        retailer_query = {
            "organization_id": org_id,
            "$or": [
                {"primary_phone": clean_from},
                {"primary_phone": ten_digit},
                {"alternate_phone": clean_from},
                {"alternate_phone": ten_digit}
            ]
        }
        retailer = await self.db.retailers.find_one(retailer_query)

        retailer_id: Optional[str] = str(retailer["_id"]) if retailer else None
        retailer_name: str = retailer.get("store_name", "Unknown Retailer") if retailer else "Unknown Retailer"

        # Step 3: Idempotent call record creation
        existing_call = await self.db.calls.find_one({"call_sid": call_sid})
        if existing_call:
            call_id = str(existing_call["_id"])
            logger.info(f"Duplicate inbound call webhook for CallSid {call_sid}, reusing call_id {call_id}")
        else:
            now = datetime.now(timezone.utc)
            call_doc = {
                "call_sid": call_sid,
                "account_sid": account_sid,
                "organization_id": org_id,
                "from_phone": clean_from,
                "to_phone": clean_to,
                "retailer_id": retailer_id,
                "retailer_name": retailer_name,
                "status": "RINGING",
                "start_time": now,
                "end_time": None,
                "duration_seconds": 0,
                "call_outcome": "IN_PROGRESS",
                "recording_url": None,
                "created_at": now,
                "updated_at": now
            }
            insert_result = await self.db.calls.insert_one(call_doc)
            call_id = str(insert_result.inserted_id)

            # Persist initial audit event
            await self.db.call_events.insert_one({
                "call_id": call_id,
                "organization_id": str(org_id),
                "event_type": "INBOUND_CALL_RECEIVED",
                "payload": {
                    "call_sid": call_sid,
                    "from_phone": clean_from,
                    "to_phone": clean_to,
                    "retailer_id": retailer_id,
                    "retailer_name": retailer_name
                },
                "created_at": now
            })

        return {
            "allowed": True,
            "call_id": call_id,
            "organization_id": str(org_id),
            "retailer_id": retailer_id,
            "retailer_name": retailer_name,
            "voice_persona": config_doc.get("voice_persona", {})
        }

    async def handle_call_status_update(
        self,
        call_sid: str,
        twilio_status: str,
        duration: Optional[int] = None,
        recording_url: Optional[str] = None,
        error_code: Optional[str] = None
    ) -> None:
        """
        Update call document when Twilio posts status callbacks.
        Guarantees monotonic status progression to avoid race conditions.
        """
        # Map Twilio call statuses to platform enum
        status_map = {
            "queued": "QUEUED",
            "ringing": "RINGING",
            "in-progress": "IN_PROGRESS",
            "completed": "COMPLETED",
            "busy": "BUSY",
            "failed": "FAILED",
            "no-answer": "NO_ANSWER",
            "canceled": "CANCELED"
        }
        normalized_status = status_map.get(twilio_status.lower(), "IN_PROGRESS")

        call = await self.db.calls.find_one({"call_sid": call_sid})
        if not call:
            logger.warning(f"Status update received for unknown CallSid {call_sid}")
            return

        current_status = call.get("status", "QUEUED")
        current_rank = STATUS_RANK.get(current_status, 0)
        new_rank = STATUS_RANK.get(normalized_status, 0)

        # Do not regress if a completed/failed notification arrived before in-progress
        if new_rank < current_rank:
            logger.info(
                f"Ignoring out-of-order status callback '{normalized_status}' for {call_sid} (currently '{current_status}')"
            )
            return

        now = datetime.now(timezone.utc)
        update_fields: Dict[str, Any] = {
            "status": normalized_status,
            "updated_at": now
        }

        if duration is not None:
            update_fields["duration_seconds"] = int(duration)

        if recording_url:
            update_fields["recording_url"] = recording_url

        if normalized_status in ["COMPLETED", "BUSY", "FAILED", "NO_ANSWER", "CANCELED"]:
            update_fields["end_time"] = now
            update_fields["call_outcome"] = normalized_status

        await self.db.calls.update_one(
            {"_id": call["_id"]},
            {"$set": update_fields}
        )

        # Log status transition event
        await self.db.call_events.insert_one({
            "call_id": str(call["_id"]),
            "organization_id": str(call["organization_id"]),
            "event_type": "CALL_STATUS_CHANGED",
            "payload": {
                "old_status": current_status,
                "new_status": normalized_status,
                "twilio_status": twilio_status,
                "duration_seconds": duration,
                "error_code": error_code
            },
            "created_at": now
        })

    async def list_calls(
        self,
        org_id: ObjectId,
        page: int = 1,
        limit: int = 15,
        status_filter: Optional[str] = None
    ) -> CallListResponse:
        """
        List paginated calls strictly scoped to authenticated organization.
        """
        page = max(1, page)
        limit = min(max(1, limit), 100)
        skip = (page - 1) * limit

        query: Dict[str, Any] = {"organization_id": org_id}
        if status_filter:
            query["status"] = status_filter.upper()

        total = await self.db.calls.count_documents(query)
        pages = math.ceil(total / limit) if total > 0 else 1

        cursor = self.db.calls.find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)

        # Calculate today's summary metrics
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        total_today = await self.db.calls.count_documents({
            "organization_id": org_id,
            "created_at": {"$gte": today_start}
        })

        active_count = await self.db.calls.count_documents({
            "organization_id": org_id,
            "status": {"$in": ["RINGING", "IN_PROGRESS"]}
        })

        items = [
            CallResponse(
                id=str(d["_id"]),
                call_sid=d.get("call_sid", ""),
                organization_id=str(d["organization_id"]),
                from_phone=d.get("from_phone", ""),
                to_phone=d.get("to_phone", ""),
                retailer_id=d.get("retailer_id"),
                retailer_name=d.get("retailer_name", "Unknown Retailer"),
                status=d.get("status", "IN_PROGRESS"),
                start_time=d.get("start_time"),
                end_time=d.get("end_time"),
                duration_seconds=d.get("duration_seconds", 0),
                call_outcome=d.get("call_outcome", "IN_PROGRESS"),
                recording_url=d.get("recording_url"),
                created_at=d["created_at"]
            )
            for d in docs
        ]

        return CallListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            total_calls_today=total_today,
            active_calls_count=active_count
        )

    async def get_call_detail(
        self,
        org_id: ObjectId,
        call_id: str
    ) -> CallDetailResponse:
        """
        Fetch full details and audit event trail for a specific call.
        Enforces tenant isolation by checking both _id and organization_id.
        """
        if not ObjectId.is_valid(call_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid call ID format.")

        call = await self.db.calls.find_one({
            "_id": ObjectId(call_id),
            "organization_id": org_id
        })

        if not call:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call record not found.")

        # Fetch chronological audit events
        events_cursor = self.db.call_events.find({
            "call_id": call_id
        }).sort("created_at", 1)
        event_docs = await events_cursor.to_list(length=200)

        events = [
            CallEventResponse(
                id=str(e["_id"]),
                call_id=str(e["call_id"]),
                event_type=e.get("event_type", "UNKNOWN"),
                payload=e.get("payload", {}),
                created_at=e["created_at"]
            )
            for e in event_docs
        ]

        return CallDetailResponse(
            id=str(call["_id"]),
            call_sid=call.get("call_sid", ""),
            organization_id=str(call["organization_id"]),
            from_phone=call.get("from_phone", ""),
            to_phone=call.get("to_phone", ""),
            retailer_id=call.get("retailer_id"),
            retailer_name=call.get("retailer_name", "Unknown Retailer"),
            status=call.get("status", "IN_PROGRESS"),
            start_time=call.get("start_time"),
            end_time=call.get("end_time"),
            duration_seconds=call.get("duration_seconds", 0),
            call_outcome=call.get("call_outcome", "IN_PROGRESS"),
            recording_url=call.get("recording_url"),
            created_at=call["created_at"],
            events=events
        )
