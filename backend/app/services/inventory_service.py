import math
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.schemas.inventory import (
    StockReceiveRequest,
    StockAdjustmentRequest,
    InventoryItemResponse,
    InventoryListResponse,
    InventoryLedgerItem,
    InventoryLedgerListResponse,
)
from app.services.product_service import compute_stock_status


class InventoryService:
    """
    Dedicated Inventory & Stock Ledger Service.
    Enforces atomic updates, append-only ledger records, non-negative stock invariants,
    and strict organization boundary isolation.
    """
    def __init__(self, db: AsyncDatabase):
        self.db = db

    async def list_inventory(
        self,
        org_id: ObjectId,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = None
    ) -> InventoryListResponse:
        """
        Retrieves paginated inventory balances along with real-time aggregated metrics.
        """
        base_query: Dict[str, Any] = {"organization_id": org_id}
        query = dict(base_query)
        if status_filter and status_filter != "all":
            query["status"] = status_filter

        # Compute summary metrics for the organization
        total_skus = await self.db.inventory.count_documents(base_query)
        low_stock_count = await self.db.inventory.count_documents({
            "organization_id": org_id,
            "status": "low_stock"
        })
        out_of_stock_count = await self.db.inventory.count_documents({
            "organization_id": org_id,
            "status": "out_of_stock"
        })

        total = await self.db.inventory.count_documents(query)
        pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        skip = (page - 1) * limit

        cursor = self.db.inventory.find(query).sort("updated_at", -1).skip(skip).limit(limit)
        inv_docs = await cursor.to_list(length=limit)

        # Bulk load products for enriched details
        product_ids = [doc["product_id"] for doc in inv_docs]
        products_map: Dict[ObjectId, dict] = {}
        if product_ids:
            prod_cursor = self.db.products.find({
                "organization_id": org_id,
                "_id": {"$in": product_ids}
            })
            prods = await prod_cursor.to_list(length=len(product_ids))
            products_map = {p["_id"]: p for p in prods}

        items: List[InventoryItemResponse] = []
        for inv in inv_docs:
            p = products_map.get(inv["product_id"], {})
            pkg = p.get("packaging", {})
            q_on_hand = inv.get("quantity_on_hand", 0)
            q_reserved = inv.get("quantity_reserved", 0)
            q_avail = inv.get("quantity_available", q_on_hand - q_reserved)
            threshold = inv.get("reorder_threshold", 10)
            status_val = inv.get("status") or compute_stock_status(q_avail, threshold)

            items.append(InventoryItemResponse(
                id=str(inv["_id"]),
                organization_id=str(org_id),
                product_id=str(inv["product_id"]),
                product_name=p.get("name", "Unknown Product"),
                product_sku=p.get("sku", "N/A"),
                packaging_unit=pkg.get("packaging_unit", "CARTON"),
                base_unit=pkg.get("base_unit", "PIECE"),
                conversion_factor=pkg.get("conversion_factor", 1),
                quantity_on_hand=q_on_hand,
                quantity_reserved=q_reserved,
                quantity_available=q_avail,
                reorder_threshold=threshold,
                status=status_val,
                last_restocked_at=inv.get("last_restocked_at"),
                updated_at=inv.get("updated_at", datetime.now(timezone.utc)),
            ))

        return InventoryListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            total_skus=total_skus,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count
        )

    async def get_inventory(self, org_id: ObjectId, product_id: ObjectId) -> InventoryItemResponse:
        """Retrieves inventory state for a single product."""
        inv = await self.db.inventory.find_one({
            "organization_id": org_id,
            "product_id": product_id
        })
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory record not found for this product."
            )

        p = await self.db.products.find_one({
            "_id": product_id,
            "organization_id": org_id
        }) or {}
        pkg = p.get("packaging", {})

        q_on_hand = inv.get("quantity_on_hand", 0)
        q_reserved = inv.get("quantity_reserved", 0)
        q_avail = inv.get("quantity_available", q_on_hand - q_reserved)
        threshold = inv.get("reorder_threshold", 10)
        status_val = inv.get("status") or compute_stock_status(q_avail, threshold)

        return InventoryItemResponse(
            id=str(inv["_id"]),
            organization_id=str(org_id),
            product_id=str(product_id),
            product_name=p.get("name", "Unknown Product"),
            product_sku=p.get("sku", "N/A"),
            packaging_unit=pkg.get("packaging_unit", "CARTON"),
            base_unit=pkg.get("base_unit", "PIECE"),
            conversion_factor=pkg.get("conversion_factor", 1),
            quantity_on_hand=q_on_hand,
            quantity_reserved=q_reserved,
            quantity_available=q_avail,
            reorder_threshold=threshold,
            status=status_val,
            last_restocked_at=inv.get("last_restocked_at"),
            updated_at=inv.get("updated_at", datetime.now(timezone.utc)),
        )

    async def record_stock_received(
        self,
        org_id: ObjectId,
        user_id: ObjectId,
        payload: StockReceiveRequest
    ) -> InventoryItemResponse:
        """
        Records inbound stock receipt, updates on-hand and available quantity,
        and appends an immutable audit entry to the inventory ledger.
        """
        try:
            p_oid = ObjectId(payload.product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID.")

        inv = await self.db.inventory.find_one({
            "organization_id": org_id,
            "product_id": p_oid
        })
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found.")

        now = datetime.now(timezone.utc)
        qty_before = inv.get("quantity_on_hand", 0)
        qty_after = qty_before + payload.quantity_received
        q_reserved = inv.get("quantity_reserved", 0)
        avail_after = qty_after - q_reserved
        threshold = inv.get("reorder_threshold", 10)
        new_status = compute_stock_status(avail_after, threshold)

        # 1. Atomic update to inventory balance
        await self.db.inventory.update_one(
            {"_id": inv["_id"], "organization_id": org_id},
            {
                "$set": {
                    "quantity_on_hand": qty_after,
                    "quantity_available": avail_after,
                    "status": new_status,
                    "last_restocked_at": now,
                    "updated_at": now,
                }
            }
        )

        # 2. Append immutable record to ledger
        reason_text = f"Stock shipment received"
        if payload.supplier_invoice:
            reason_text += f" (Invoice: {payload.supplier_invoice})"
        if payload.batch_number:
            reason_text += f" [Batch: {payload.batch_number}]"

        ledger_doc = {
            "organization_id": org_id,
            "product_id": p_oid,
            "movement_type": "STOCK_RECEIVED",
            "quantity_delta": payload.quantity_received,
            "quantity_before": qty_before,
            "quantity_after": qty_after,
            "reason": reason_text,
            "notes": payload.notes,
            "created_by_user_id": user_id,
            "created_at": now,
        }
        await self.db.inventory_ledger.insert_one(ledger_doc)

        return await self.get_inventory(org_id, p_oid)

    async def record_stock_adjustment(
        self,
        org_id: ObjectId,
        user_id: ObjectId,
        payload: StockAdjustmentRequest
    ) -> InventoryItemResponse:
        """
        Records manual stock adjustments (damage, stock count correction, customer returns).
        Enforces that resulting inventory cannot be negative.
        """
        valid_types = {"MANUAL_ADJUSTMENT", "STOCK_DAMAGED", "STOCK_RETURNED", "STOCK_CORRECTION"}
        if payload.movement_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Movement type must be one of: {', '.join(valid_types)}"
            )

        try:
            p_oid = ObjectId(payload.product_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID.")

        inv = await self.db.inventory.find_one({
            "organization_id": org_id,
            "product_id": p_oid
        })
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found.")

        qty_before = inv.get("quantity_on_hand", 0)
        qty_after = qty_before + payload.quantity_delta

        # Enforce non-negative inventory rule
        if qty_after < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid adjustment. Resulting stock cannot be negative. Current stock is {qty_before}."
            )

        now = datetime.now(timezone.utc)
        q_reserved = inv.get("quantity_reserved", 0)
        avail_after = max(0, qty_after - q_reserved)
        threshold = inv.get("reorder_threshold", 10)
        new_status = compute_stock_status(avail_after, threshold)

        # 1. Update inventory
        await self.db.inventory.update_one(
            {"_id": inv["_id"], "organization_id": org_id},
            {
                "$set": {
                    "quantity_on_hand": qty_after,
                    "quantity_available": avail_after,
                    "status": new_status,
                    "updated_at": now,
                }
            }
        )

        # 2. Append to ledger
        ledger_doc = {
            "organization_id": org_id,
            "product_id": p_oid,
            "movement_type": payload.movement_type,
            "quantity_delta": payload.quantity_delta,
            "quantity_before": qty_before,
            "quantity_after": qty_after,
            "reason": payload.reason,
            "notes": payload.notes,
            "created_by_user_id": user_id,
            "created_at": now,
        }
        await self.db.inventory_ledger.insert_one(ledger_doc)

        return await self.get_inventory(org_id, p_oid)

    async def list_product_ledger(
        self,
        org_id: ObjectId,
        product_id: ObjectId,
        page: int = 1,
        limit: int = 20
    ) -> InventoryLedgerListResponse:
        """Retrieves chronological movement ledger history for a product."""
        query = {"organization_id": org_id, "product_id": product_id}
        total = await self.db.inventory_ledger.count_documents(query)
        pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        skip = (page - 1) * limit

        cursor = self.db.inventory_ledger.find(query).sort("created_at", -1).skip(skip).limit(limit)
        records = await cursor.to_list(length=limit)

        items = [
            InventoryLedgerItem(
                id=str(r["_id"]),
                organization_id=str(org_id),
                product_id=str(r["product_id"]),
                movement_type=r["movement_type"],
                quantity_delta=r["quantity_delta"],
                quantity_before=r["quantity_before"],
                quantity_after=r["quantity_after"],
                reason=r.get("reason"),
                notes=r.get("notes"),
                created_by_user_id=str(r["created_by_user_id"]) if r.get("created_by_user_id") else None,
                created_at=r["created_at"],
            )
            for r in records
        ]

        return InventoryLedgerListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )

