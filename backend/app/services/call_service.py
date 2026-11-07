"""
Vyapaar सेतु — Call Management & State Machine Service.
Governs call lifecycle transitions, caller identification (Kirana directory matching),
audit trail recording in call_events, and strict organization-scoped call history.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from pymongo import DESCENDING, ASCENDING
from app.core.config import settings
from app.integrations.vobiz.xml_builder import build_stream_xml, build_reject_xml, build_hangup_xml
from app.integrations.vobiz.webhooks import parse_inbound_webhook_payload
from app.services.telephony_service import TelephonyService


class CallService:
    """Service handling telephony call sessions, event logging, and state transitions."""

    # Explicit monotonic call state categories
    TERMINAL_CALL_STATES = frozenset({"COMPLETED", "FAILED", "BUSY", "REJECTED", "NO_ANSWER", "CANCELLED"})
    ACTIVE_CALL_STATES = frozenset({"INITIATED", "RINGING", "IN_PROGRESS", "STREAMING"})

    def __init__(self, db: AsyncDatabase):
        self.db = db
        self.telephony_service = TelephonyService(db)

    def _format_call(self, doc: Dict[str, Any], events_count: int = 0) -> Dict[str, Any]:
        """Formats a MongoDB call document into an API response dict."""
        return {
            "id": str(doc["_id"]),
            "organization_id": str(doc.get("organization_id", "")),
            "vobiz_call_id": doc.get("vobiz_call_id", ""),
            "from_number": doc.get("from_number", ""),
            "to_number": doc.get("to_number", ""),
            "normalized_from_number": doc.get("normalized_from_number", ""),
            "normalized_to_number": doc.get("normalized_to_number", ""),
            "retailer_id": str(doc["retailer_id"]) if doc.get("retailer_id") else None,
            "retailer_name": doc.get("retailer_name"),
            "retailer_store_name": doc.get("retailer_store_name"),
            "caller_classification": doc.get("caller_classification", "UNKNOWN"),
            "call_status": doc.get("call_status", "INITIATED"),
            "stream_status": doc.get("stream_status", "PENDING"),
            "started_at": doc.get("started_at"),
            "ended_at": doc.get("ended_at"),
            "duration_seconds": int(doc.get("duration_seconds", 0)),
            "events_count": events_count or doc.get("events_count", 0),
            "created_at": doc.get("created_at"),
        }

    def _format_event(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Formats a MongoDB call_events document into an API response dict."""
        return {
            "id": str(doc["_id"]),
            "call_id": str(doc.get("call_id", "")),
            "vobiz_call_id": doc.get("vobiz_call_id", ""),
            "event_type": doc.get("event_type", ""),
            "previous_state": doc.get("previous_state"),
            "new_state": doc.get("new_state"),
            "event_timestamp": doc.get("event_timestamp", ""),
            "safe_metadata": doc.get("safe_metadata", {}),
        }

    async def log_call_event(
        self,
        organization_id: str,
        call_id: str,
        vobiz_call_id: str,
        event_type: str,
        previous_state: Optional[str] = None,
        new_state: Optional[str] = None,
        safe_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Appends an immutable audit event to call_events."""
        now = datetime.now(timezone.utc).isoformat()
        event_doc = {
            "organization_id": organization_id,
            "call_id": call_id,
            "vobiz_call_id": vobiz_call_id,
            "event_type": event_type,
            "previous_state": previous_state,
            "new_state": new_state,
            "event_timestamp": now,
            "safe_metadata": safe_metadata or {},
            "created_at": now,
        }
        res = await self.db.call_events.insert_one(event_doc)
        event_doc["_id"] = res.inserted_id
        return event_doc

    async def handle_inbound_call(self, raw_payload: Dict[str, Any]) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Processes an incoming Vobiz Answer Webhook.
        1. Validates called number ('To') and resolves organization.
        2. Matches caller ID ('From') against organization's retailer directory.
        3. Persists call record and logs initial event.
        4. Returns VobizXML with <Stream> instruction or <Reject>.
        """
        parsed = parse_inbound_webhook_payload(raw_payload)
        vobiz_call_id = parsed["vobiz_call_id"]
        to_number = parsed["to_number"]
        from_number = parsed["from_number"]
        normalized_from_10digit = parsed["normalized_from_10digit"]
        normalized_from_e164 = parsed["normalized_from_e164"]
        normalized_to_e164 = parsed["normalized_to_e164"]

        # 1. Resolve tenant organization from called number
        phone_config = await self.telephony_service.resolve_org_by_phone(to_number)
        if not phone_config:
            # Dialed number does not belong to any active organization
            return build_reject_xml("rejected"), None

        organization_id = str(phone_config["organization_id"])

        # 2. Check for duplicate/idempotent call delivery
        existing_call = await self.db.calls.find_one({"vobiz_call_id": vobiz_call_id})
        if existing_call:
            # Already created, return stream XML directly
            stream_xml = build_stream_xml(websocket_url=settings.websocket_stream_url)
            return stream_xml, existing_call

        # 3. Match caller against Retailer Directory (Kirana stockist lookup)
        retailer = None
        if normalized_from_10digit:
            retailer = await self.db.retailers.find_one({
                "organization_id": organization_id,
                "primary_phone": normalized_from_10digit,
                "is_active": True,
            })
        
        # Fallback check with full E.164 if 10-digit query didn't match
        if not retailer and normalized_from_e164:
            retailer = await self.db.retailers.find_one({
                "organization_id": organization_id,
                "primary_phone": normalized_from_e164,
                "is_active": True,
            })

        if retailer:
            caller_classification = "REGISTERED_RETAILER"
            retailer_id = str(retailer["_id"])
            retailer_name = retailer.get("owner_name") or retailer.get("store_name")
            retailer_store_name = retailer.get("store_name")
        else:
            caller_classification = "UNKNOWN"
            retailer_id = None
            retailer_name = None
            retailer_store_name = None

        # 4. Insert call session record
        now = datetime.now(timezone.utc).isoformat()
        call_doc = {
            "organization_id": organization_id,
            "vobiz_call_id": vobiz_call_id,
            "from_number": from_number,
            "to_number": to_number,
            "normalized_from_number": normalized_from_10digit or normalized_from_e164,
            "normalized_to_number": normalized_to_e164,
            "retailer_id": retailer_id,
            "retailer_name": retailer_name,
            "retailer_store_name": retailer_store_name,
            "caller_classification": caller_classification,
            "call_status": "INITIATED",
            "stream_status": "PENDING",
            "started_at": now,
            "ended_at": None,
            "duration_seconds": 0,
            "hangup_cause": None,
            "created_at": now,
            "updated_at": now,
        }

        insert_res = await self.db.calls.insert_one(call_doc)
        call_id = str(insert_res.inserted_id)
        call_doc["_id"] = insert_res.inserted_id

        # 5. Log audit trail event
        await self.log_call_event(
            organization_id=organization_id,
            call_id=call_id,
            vobiz_call_id=vobiz_call_id,
            event_type="INBOUND_ANSWER",
            previous_state=None,
            new_state="INITIATED",
            safe_metadata={
                "from": from_number,
                "to": to_number,
                "caller_classification": caller_classification,
                "retailer_matched": bool(retailer_id),
                "store_name": retailer_store_name,
            }
        )

        # 6. Build VobizXML with bidirectional WebSocket audio stream
        stream_xml = build_stream_xml(websocket_url=settings.websocket_stream_url)
        return stream_xml, call_doc

    async def handle_call_status_update(self, raw_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Handles post-call lifecycle webhook (e.g. CallStatus = completed, hangup, failed).
        Enforces state machine monotonicity: terminal states (COMPLETED, FAILED, BUSY, etc.)
        cannot be regressed to active states by delayed or out-of-order callbacks.
        """
        parsed = parse_inbound_webhook_payload(raw_payload)
        vobiz_call_id = parsed["vobiz_call_id"]
        status = parsed["call_status"].upper()
        duration = parsed["duration_seconds"]
        hangup_cause = parsed["hangup_cause"]

        if not vobiz_call_id:
            return None

        call = await self.db.calls.find_one({"vobiz_call_id": vobiz_call_id})
        if not call:
            return None

        call_id = str(call["_id"])
        org_id = str(call["organization_id"])
        prev_status = call.get("call_status", "INITIATED")

        # Monotonicity check: Prevent terminal state regression from out-of-order webhooks
        if prev_status in self.TERMINAL_CALL_STATES:
            # Call is already terminal. Update duration or hangup cause if provided, but never regress state
            now = datetime.now(timezone.utc).isoformat()
            patch_fields: Dict[str, Any] = {"updated_at": now}
            if duration > 0:
                patch_fields["duration_seconds"] = max(duration, int(call.get("duration_seconds", 0)))
            if hangup_cause and not call.get("hangup_cause"):
                patch_fields["hangup_cause"] = hangup_cause

            await self.db.calls.update_one(
                {"_id": call["_id"]},
                {"$set": patch_fields}
            )
            # Do not emit duplicate or regressive transition events
            return await self.db.calls.find_one({"_id": call["_id"]})

        # Idempotency check: if status has not changed, update duration without redundant event
        if status == prev_status:
            if duration > 0:
                await self.db.calls.update_one(
                    {"_id": call["_id"]},
                    {"$set": {"duration_seconds": max(duration, int(call.get("duration_seconds", 0)))}}
                )
            return call

        now = datetime.now(timezone.utc).isoformat()
        update_fields: Dict[str, Any] = {
            "call_status": status,
            "updated_at": now,
        }
        if duration > 0:
            update_fields["duration_seconds"] = max(duration, int(call.get("duration_seconds", 0)))
        if hangup_cause:
            update_fields["hangup_cause"] = hangup_cause

        is_now_terminal = status in self.TERMINAL_CALL_STATES
        if is_now_terminal:
            if not call.get("ended_at"):
                update_fields["ended_at"] = now
            if call.get("stream_status") == "STREAMING":
                update_fields["stream_status"] = "DISCONNECTED"

        # Atomic conditional update preventing concurrent race conditions
        filter_query = {"_id": call["_id"]}
        if not is_now_terminal:
            # Active state updates can only apply if the document has not become terminal
            filter_query["call_status"] = {"$nin": list(self.TERMINAL_CALL_STATES)}

        await self.db.calls.update_one(
            filter_query,
            {"$set": update_fields}
        )

        await self.log_call_event(
            organization_id=org_id,
            call_id=call_id,
            vobiz_call_id=vobiz_call_id,
            event_type="STATUS_UPDATE",
            previous_state=prev_status,
            new_state=status,
            safe_metadata={
                "duration_seconds": duration,
                "hangup_cause": hangup_cause,
                "terminal_transition": is_now_terminal,
            }
        )

        return await self.db.calls.find_one({"_id": call["_id"]})

    async def handle_stream_start(
        self,
        stream_id: str,
        vobiz_call_id: str,
        media_format: Dict[str, Any]
    ) -> None:
        """
        Invoked when Vobiz WebSocket audio stream is successfully established.
        Guards against overwriting terminal call status if stream connects late.
        """
        if not vobiz_call_id:
            return

        call = await self.db.calls.find_one({"vobiz_call_id": vobiz_call_id})
        if not call:
            return

        call_id = str(call["_id"])
        org_id = str(call["organization_id"])

        now = datetime.now(timezone.utc).isoformat()

        # Atomic conditional update: only update call_status to IN_PROGRESS if not already terminal
        await self.db.calls.update_one(
            {
                "_id": call["_id"],
                "call_status": {"$nin": list(self.TERMINAL_CALL_STATES)}
            },
            {
                "$set": {
                    "stream_status": "STREAMING",
                    "call_status": "IN_PROGRESS",
                    "stream_id": stream_id,
                    "updated_at": now,
                }
            }
        )

        # Always update stream_id and stream_status if call still active
        await self.db.calls.update_one(
            {"_id": call["_id"], "stream_status": "PENDING"},
            {"$set": {"stream_status": "STREAMING", "stream_id": stream_id, "updated_at": now}}
        )

        await self.log_call_event(
            organization_id=org_id,
            call_id=call_id,
            vobiz_call_id=vobiz_call_id,
            event_type="STREAM_START",
            previous_state=call.get("stream_status"),
            new_state="STREAMING",
            safe_metadata={
                "stream_id": stream_id,
                "media_format": media_format,
            }
        )

    async def handle_stream_stop(
        self,
        stream_id: str,
        vobiz_call_id: Optional[str] = None,
        telemetry_stats: Optional[Dict[str, Any]] = None
    ) -> None:
        """Invoked when Vobiz WebSocket audio stream is stopped or disconnected."""
        query: Dict[str, Any] = {}
        if vobiz_call_id:
            query = {"vobiz_call_id": vobiz_call_id}
        elif stream_id:
            query = {"stream_id": stream_id}
        else:
            return

        call = await self.db.calls.find_one(query)
        if not call:
            return

        call_id = str(call["_id"])
        org_id = str(call["organization_id"])

        now = datetime.now(timezone.utc).isoformat()
        await self.db.calls.update_one(
            {"_id": call["_id"]},
            {
                "$set": {
                    "stream_status": "DISCONNECTED",
                    "updated_at": now,
                }
            }
        )

        await self.log_call_event(
            organization_id=org_id,
            call_id=call_id,
            vobiz_call_id=call.get("vobiz_call_id", ""),
            event_type="STREAM_STOP",
            previous_state="STREAMING",
            new_state="DISCONNECTED",
            safe_metadata=telemetry_stats or {"stream_id": stream_id}
        )

    async def list_calls(
        self,
        organization_id: str,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        caller_classification: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves paginated call records scoped strictly to the authenticated organization.
        """
        filter_query: Dict[str, Any] = {"organization_id": organization_id}

        if status:
            filter_query["call_status"] = status.upper()
        if caller_classification:
            filter_query["caller_classification"] = caller_classification.upper()

        total = await self.db.calls.count_documents(filter_query)
        pages = max(1, (total + limit - 1) // limit)
        skip = (page - 1) * limit

        cursor = self.db.calls.find(filter_query).sort("created_at", DESCENDING).skip(skip).limit(limit)
        items_raw = await cursor.to_list(length=limit)

        items = []
        for call_doc in items_raw:
            call_id = str(call_doc["_id"])
            events_count = await self.db.call_events.count_documents({
                "organization_id": organization_id,
                "call_id": call_id
            })
            items.append(self._format_call(call_doc, events_count=events_count))

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        }

    async def get_call_detail(self, organization_id: str, call_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves detailed information and complete event timeline for a call.
        Enforces strict organization tenancy.
        """
        if not ObjectId.is_valid(call_id):
            return None

        call = await self.db.calls.find_one({
            "_id": ObjectId(call_id),
            "organization_id": organization_id,
        })
        if not call:
            return None

        # Fetch chronological events
        cursor = self.db.call_events.find({
            "organization_id": organization_id,
            "call_id": call_id,
        }).sort("event_timestamp", ASCENDING)
        events_raw = await cursor.to_list(length=200)

        events = [self._format_event(e) for e in events_raw]
        call_formatted = self._format_call(call, events_count=len(events))
        call_formatted["events"] = events

        return call_formatted

