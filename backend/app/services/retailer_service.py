import math
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.schemas.retailer import (
    RetailerCreate,
    RetailerUpdate,
    RetailerResponse,
    RetailerListResponse,
    DeliveryAddress,
)


class RetailerService:
    """
    Retailer Directory Management Service.
    Maintains Kirana store accounts, multi-address profiles, and phone numbers for caller ID matching.
    Strictly scoped to authenticated organization_id.
    """
    def __init__(self, db: AsyncDatabase):
        self.db = db

    async def create_retailer(self, org_id: ObjectId, payload: RetailerCreate) -> RetailerResponse:
        """Registers a new retailer account for the organization."""
        # Check uniqueness of primary phone within organization
        existing = await self.db.retailers.find_one({
            "organization_id": org_id,
            "primary_phone": payload.primary_phone
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Retailer with primary phone '{payload.primary_phone}' is already registered in your directory."
            )

        now = datetime.now(timezone.utc)
        addresses_data = [a.model_dump() for a in payload.delivery_addresses]
        
        # Ensure default address flag logic
        if addresses_data and not any(a.get("is_default") for a in addresses_data):
            addresses_data[0]["is_default"] = True

        retailer_doc = {
            "organization_id": org_id,
            "store_name": payload.store_name,
            "owner_name": payload.owner_name,
            "primary_phone": payload.primary_phone,
            "alternate_phone": payload.alternate_phone,
            "gstin": payload.gstin,
            "credit_limit": payload.credit_limit,
            "current_balance": payload.current_balance,
            "preferred_language": payload.preferred_language,
            "notes": payload.notes,
            "delivery_addresses": addresses_data,
            "is_active": payload.is_active,
            "created_at": now,
            "updated_at": now,
        }

        res = await self.db.retailers.insert_one(retailer_doc)
        return await self.get_retailer(org_id, res.inserted_id)

    async def get_retailer(self, org_id: ObjectId, retailer_id: ObjectId) -> RetailerResponse:
        """Retrieves a single retailer account."""
        doc = await self.db.retailers.find_one({
            "_id": retailer_id,
            "organization_id": org_id
        })
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found.")

        addresses = [DeliveryAddress(**a) for a in doc.get("delivery_addresses", [])]

        return RetailerResponse(
            id=str(doc["_id"]),
            organization_id=str(org_id),
            store_name=doc["store_name"],
            owner_name=doc["owner_name"],
            primary_phone=doc["primary_phone"],
            alternate_phone=doc.get("alternate_phone"),
            gstin=doc.get("gstin"),
            credit_limit=doc.get("credit_limit", 0.0),
            current_balance=doc.get("current_balance", 0.0),
            preferred_language=doc.get("preferred_language", "hi-IN"),
            notes=doc.get("notes"),
            delivery_addresses=addresses,
            is_active=doc.get("is_active", True),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        )

    async def list_retailers(
        self,
        org_id: ObjectId,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None
    ) -> RetailerListResponse:
        """Lists retailers with search filter and credit metrics."""
        query: Dict[str, Any] = {"organization_id": org_id, "is_active": True}

        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"store_name": {"$regex": s, "$options": "i"}},
                {"owner_name": {"$regex": s, "$options": "i"}},
                {"primary_phone": {"$regex": s, "$options": "i"}},
                {"gstin": {"$regex": s, "$options": "i"}},
                {"delivery_addresses.city": {"$regex": s, "$options": "i"}},
            ]

        total = await self.db.retailers.count_documents(query)
        pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        skip = (page - 1) * limit

        cursor = self.db.retailers.find(query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)

        # Aggregate total credit allocated
        total_credit_pipeline = [
            {"$match": {"organization_id": org_id, "is_active": True}},
            {"$group": {"_id": None, "total": {"$sum": "$credit_limit"}}}
        ]
        credit_agg = await self.db.retailers.aggregate(total_credit_pipeline).to_list(length=1)
        total_credit = credit_agg[0]["total"] if credit_agg else 0.0

        items: List[RetailerResponse] = []
        for doc in docs:
            addresses = [DeliveryAddress(**a) for a in doc.get("delivery_addresses", [])]
            items.append(RetailerResponse(
                id=str(doc["_id"]),
                organization_id=str(org_id),
                store_name=doc["store_name"],
                owner_name=doc["owner_name"],
                primary_phone=doc["primary_phone"],
                alternate_phone=doc.get("alternate_phone"),
                gstin=doc.get("gstin"),
                credit_limit=doc.get("credit_limit", 0.0),
                current_balance=doc.get("current_balance", 0.0),
                preferred_language=doc.get("preferred_language", "hi-IN"),
                notes=doc.get("notes"),
                delivery_addresses=addresses,
                is_active=doc.get("is_active", True),
                created_at=doc.get("created_at", datetime.now(timezone.utc)),
                updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
            ))

        return RetailerListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            total_credit_allocated=round(float(total_credit), 2)
        )

    async def update_retailer(
        self,
        org_id: ObjectId,
        retailer_id: ObjectId,
        payload: RetailerUpdate
    ) -> RetailerResponse:
        """Updates retailer profile and delivery addresses."""
        doc = await self.db.retailers.find_one({
            "_id": retailer_id,
            "organization_id": org_id
        })
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found.")

        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        if payload.primary_phone and payload.primary_phone != doc["primary_phone"]:
            conflict = await self.db.retailers.find_one({
                "organization_id": org_id,
                "primary_phone": payload.primary_phone,
                "_id": {"$ne": retailer_id}
            })
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Phone number '{payload.primary_phone}' is already assigned to another retailer."
                )
            update_fields["primary_phone"] = payload.primary_phone

        if payload.store_name is not None:
            update_fields["store_name"] = payload.store_name
        if payload.owner_name is not None:
            update_fields["owner_name"] = payload.owner_name
        if payload.alternate_phone is not None:
            update_fields["alternate_phone"] = payload.alternate_phone
        if payload.gstin is not None:
            update_fields["gstin"] = payload.gstin
        if payload.credit_limit is not None:
            update_fields["credit_limit"] = payload.credit_limit
        if payload.current_balance is not None:
            update_fields["current_balance"] = payload.current_balance
        if payload.preferred_language is not None:
            update_fields["preferred_language"] = payload.preferred_language
        if payload.notes is not None:
            update_fields["notes"] = payload.notes
        if payload.delivery_addresses is not None:
            update_fields["delivery_addresses"] = [a.model_dump() for a in payload.delivery_addresses]
        if payload.is_active is not None:
            update_fields["is_active"] = payload.is_active

        await self.db.retailers.update_one(
            {"_id": retailer_id, "organization_id": org_id},
            {"$set": update_fields}
        )

        return await self.get_retailer(org_id, retailer_id)

    async def delete_retailer(self, org_id: ObjectId, retailer_id: ObjectId) -> dict:
        """Deactivates a retailer."""
        res = await self.db.retailers.update_one(
            {"_id": retailer_id, "organization_id": org_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found.")
        return {"status": "success", "message": "Retailer deactivated."}
