import math
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.schemas.scheme import (
    SchemeCreate,
    SchemeUpdate,
    SchemeResponse,
    SchemeListResponse,
    VolumeSlab,
    SchemeCalculationRequest,
    SchemeCalculationResponse,
    CalculatedLineItem,
    AppliedSchemeBenefit,
)


def compute_scheme_status(doc: dict, now: datetime) -> str:
    """Computes whether a trade scheme is currently active, upcoming, or expired."""
    if not doc.get("is_active", True):
        return "expired"

    starts_at = doc.get("starts_at")
    ends_at = doc.get("ends_at")

    # Ensure tz-aware comparisons
    if starts_at and starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    if ends_at and ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)

    if starts_at and starts_at > now:
        return "upcoming"
    if ends_at and ends_at < now:
        return "expired"

    return "active"


class SchemeService:
    """
    Trade Promotional Schemes and Discount Calculation Engine.
    Handles Buy X Get Y, Volume Slab Discounts, and Flat Discounts.
    All operations are strictly scoped to the authenticated organization.
    """
    def __init__(self, db: AsyncDatabase):
        self.db = db

    async def create_scheme(self, org_id: ObjectId, payload: SchemeCreate) -> SchemeResponse:
        """Creates a new promotional scheme for the organization."""
        now = datetime.now(timezone.utc)

        # Parse and validate target products
        applicable_oids = []
        for pid in payload.applicable_product_ids:
            try:
                applicable_oids.append(ObjectId(pid))
            except Exception:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid product ID: {pid}")

        free_oid = None
        if payload.free_product_id:
            try:
                free_oid = ObjectId(payload.free_product_id)
            except Exception:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid free product ID.")

        slabs_data = [s.model_dump() for s in payload.slabs] if payload.slabs else None

        scheme_doc = {
            "organization_id": org_id,
            "name": payload.name,
            "description": payload.description,
            "scheme_type": payload.scheme_type,
            "applicable_product_ids": applicable_oids,
            "buy_quantity": payload.buy_quantity,
            "min_order_quantity": payload.min_order_quantity,
            "slabs": slabs_data,
            "free_product_id": free_oid,
            "free_quantity": payload.free_quantity,
            "discount_percentage": payload.discount_percentage,
            "discount_amount": payload.discount_amount,
            "starts_at": payload.starts_at,
            "ends_at": payload.ends_at,
            "is_active": payload.is_active,
            "created_at": now,
            "updated_at": now,
        }

        res = await self.db.schemes.insert_one(scheme_doc)
        return await self.get_scheme(org_id, res.inserted_id)

    async def get_scheme(self, org_id: ObjectId, scheme_id: ObjectId) -> SchemeResponse:
        """Retrieves a single scheme with populated product names."""
        doc = await self.db.schemes.find_one({
            "_id": scheme_id,
            "organization_id": org_id
        })
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Promotional scheme not found."
            )

        now = datetime.now(timezone.utc)
        status_val = compute_scheme_status(doc, now)

        # Resolve product names
        product_oids = doc.get("applicable_product_ids", [])
        product_names = []
        if product_oids:
            prods = await self.db.products.find(
                {"_id": {"$in": product_oids}, "organization_id": org_id},
                {"name": 1}
            ).to_list(length=len(product_oids))
            product_names = [p["name"] for p in prods]

        free_prod_name = None
        if doc.get("free_product_id"):
            fp = await self.db.products.find_one(
                {"_id": doc["free_product_id"], "organization_id": org_id},
                {"name": 1}
            )
            if fp:
                free_prod_name = fp.get("name")

        slabs_objs = None
        if doc.get("slabs"):
            slabs_objs = [VolumeSlab(**s) for s in doc["slabs"]]

        return SchemeResponse(
            id=str(doc["_id"]),
            organization_id=str(org_id),
            name=doc["name"],
            description=doc.get("description"),
            scheme_type=doc["scheme_type"],
            applicable_product_ids=[str(p) for p in product_oids],
            applicable_product_names=product_names,
            buy_quantity=doc.get("buy_quantity"),
            min_order_quantity=doc.get("min_order_quantity"),
            slabs=slabs_objs,
            free_product_id=str(doc["free_product_id"]) if doc.get("free_product_id") else None,
            free_product_name=free_prod_name,
            free_quantity=doc.get("free_quantity"),
            discount_percentage=doc.get("discount_percentage"),
            discount_amount=doc.get("discount_amount"),
            starts_at=doc["starts_at"],
            ends_at=doc.get("ends_at"),
            is_active=doc.get("is_active", True),
            status=status_val,
            created_at=doc.get("created_at", now),
            updated_at=doc.get("updated_at", now),
        )

    async def list_schemes(
        self,
        org_id: ObjectId,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = None
    ) -> SchemeListResponse:
        """Lists schemes with status tabs and breakdown."""
        cursor = self.db.schemes.find({"organization_id": org_id}).sort("created_at", -1)
        all_schemes = await cursor.to_list(length=1000)

        now = datetime.now(timezone.utc)

        active_count = 0
        upcoming_count = 0
        expired_count = 0

        computed_items = []
        for doc in all_schemes:
            st = compute_scheme_status(doc, now)
            if st == "active":
                active_count += 1
            elif st == "upcoming":
                upcoming_count += 1
            else:
                expired_count += 1

            if not status_filter or status_filter == "all" or status_filter == st:
                computed_items.append((doc, st))

        total = len(computed_items)
        pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        skip = (page - 1) * limit
        paged_slice = computed_items[skip:skip + limit]

        # Bulk resolve product names
        all_product_ids = set()
        for doc, _ in paged_slice:
            for pid in doc.get("applicable_product_ids", []):
                all_product_ids.add(pid)
            if doc.get("free_product_id"):
                all_product_ids.add(doc["free_product_id"])

        prod_name_map = {}
        if all_product_ids:
            p_docs = await self.db.products.find(
                {"_id": {"$in": list(all_product_ids)}, "organization_id": org_id},
                {"name": 1}
            ).to_list(length=len(all_product_ids))
            prod_name_map = {p["_id"]: p["name"] for p in p_docs}

        items: List[SchemeResponse] = []
        for doc, st in paged_slice:
            p_oids = doc.get("applicable_product_ids", [])
            p_names = [prod_name_map[pid] for pid in p_oids if pid in prod_name_map]
            fp_name = prod_name_map.get(doc.get("free_product_id"))

            slabs_objs = None
            if doc.get("slabs"):
                slabs_objs = [VolumeSlab(**s) for s in doc["slabs"]]

            items.append(SchemeResponse(
                id=str(doc["_id"]),
                organization_id=str(org_id),
                name=doc["name"],
                description=doc.get("description"),
                scheme_type=doc["scheme_type"],
                applicable_product_ids=[str(p) for p in p_oids],
                applicable_product_names=p_names,
                buy_quantity=doc.get("buy_quantity"),
                min_order_quantity=doc.get("min_order_quantity"),
                slabs=slabs_objs,
                free_product_id=str(doc["free_product_id"]) if doc.get("free_product_id") else None,
                free_product_name=fp_name,
                free_quantity=doc.get("free_quantity"),
                discount_percentage=doc.get("discount_percentage"),
                discount_amount=doc.get("discount_amount"),
                starts_at=doc["starts_at"],
                ends_at=doc.get("ends_at"),
                is_active=doc.get("is_active", True),
                status=st,
                created_at=doc.get("created_at", now),
                updated_at=doc.get("updated_at", now),
            ))

        return SchemeListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            active_count=active_count,
            upcoming_count=upcoming_count,
            expired_count=expired_count
        )

    async def update_scheme(
        self,
        org_id: ObjectId,
        scheme_id: ObjectId,
        payload: SchemeUpdate
    ) -> SchemeResponse:
        """Updates scheme fields."""
        doc = await self.db.schemes.find_one({
            "_id": scheme_id,
            "organization_id": org_id
        })
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")

        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        if payload.name is not None:
            update_fields["name"] = payload.name
        if payload.description is not None:
            update_fields["description"] = payload.description
        if payload.applicable_product_ids is not None:
            update_fields["applicable_product_ids"] = [ObjectId(p) for p in payload.applicable_product_ids]
        if payload.buy_quantity is not None:
            update_fields["buy_quantity"] = payload.buy_quantity
        if payload.min_order_quantity is not None:
            update_fields["min_order_quantity"] = payload.min_order_quantity
        if payload.slabs is not None:
            update_fields["slabs"] = [s.model_dump() for s in payload.slabs]
        if payload.free_product_id is not None:
            update_fields["free_product_id"] = ObjectId(payload.free_product_id) if payload.free_product_id else None
        if payload.free_quantity is not None:
            update_fields["free_quantity"] = payload.free_quantity
        if payload.discount_percentage is not None:
            update_fields["discount_percentage"] = payload.discount_percentage
        if payload.discount_amount is not None:
            update_fields["discount_amount"] = payload.discount_amount
        if payload.starts_at is not None:
            update_fields["starts_at"] = payload.starts_at
        if payload.ends_at is not None:
            update_fields["ends_at"] = payload.ends_at
        if payload.is_active is not None:
            update_fields["is_active"] = payload.is_active

        await self.db.schemes.update_one(
            {"_id": scheme_id, "organization_id": org_id},
            {"$set": update_fields}
        )

        return await self.get_scheme(org_id, scheme_id)

    async def delete_scheme(self, org_id: ObjectId, scheme_id: ObjectId) -> dict:
        """Deactivates a scheme."""
        res = await self.db.schemes.update_one(
            {"_id": scheme_id, "organization_id": org_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme not found.")
        return {"status": "success", "message": "Scheme deactivated."}

    async def calculate_order_schemes(
        self,
        org_id: ObjectId,
        request: SchemeCalculationRequest
    ) -> SchemeCalculationResponse:
        """
        Deterministic trade scheme engine.
        Evaluates line items against active schemes and computes discounts and free goods.
        """
        now = datetime.now(timezone.utc)

        # 1. Fetch currently active schemes
        cursor = self.db.schemes.find({
            "organization_id": org_id,
            "is_active": True,
            "starts_at": {"$lte": now},
            "$or": [
                {"ends_at": None},
                {"ends_at": {"$gte": now}}
            ]
        })
        active_schemes = await cursor.to_list(length=500)

        calculated_lines: List[CalculatedLineItem] = []
        free_goods_map: Dict[str, int] = {}
        subtotal = 0.0
        total_savings = 0.0

        for item in request.items:
            try:
                p_oid = ObjectId(item.product_id)
            except Exception:
                continue

            gross = round(item.quantity * item.unit_price, 2)
            subtotal += gross
            line_discount = 0.0
            applied_benefits: List[AppliedSchemeBenefit] = []

            # Find matching schemes for this product
            for scheme in active_schemes:
                app_prods = scheme.get("applicable_product_ids", [])
                if app_prods and p_oid not in app_prods:
                    continue

                stype = scheme["scheme_type"]

                # 1. Buy X Get Y
                if stype == "BUY_X_GET_Y":
                    buy_q = scheme.get("buy_quantity", 1)
                    if item.quantity >= buy_q:
                        batches = item.quantity // buy_q
                        free_q = batches * scheme.get("free_quantity", 1)
                        target_free_id = str(scheme.get("free_product_id") or p_oid)
                        free_goods_map[target_free_id] = free_goods_map.get(target_free_id, 0) + free_q

                        applied_benefits.append(AppliedSchemeBenefit(
                            scheme_id=str(scheme["_id"]),
                            scheme_name=scheme["name"],
                            scheme_type=stype,
                            discount_amount=0.0,
                            free_items=[{"product_id": target_free_id, "quantity": free_q}],
                            applied_to_product_id=str(p_oid)
                        ))

                # 2. Volume Slab Discount
                elif stype == "VOLUME_SLAB_DISCOUNT":
                    slabs = scheme.get("slabs", [])
                    matched_slab = None
                    for slab in slabs:
                        min_q = slab.get("min_quantity", 1)
                        max_q = slab.get("max_quantity")
                        if item.quantity >= min_q and (max_q is None or item.quantity <= max_q):
                            matched_slab = slab
                            break
                    if matched_slab:
                        disc_pct = matched_slab.get("discount_percentage", 0.0)
                        disc = round(gross * (disc_pct / 100.0), 2)
                        line_discount += disc
                        applied_benefits.append(AppliedSchemeBenefit(
                            scheme_id=str(scheme["_id"]),
                            scheme_name=scheme["name"],
                            scheme_type=stype,
                            discount_amount=disc,
                            applied_to_product_id=str(p_oid)
                        ))

                # 3. Percentage Discount
                elif stype == "PERCENTAGE_DISCOUNT":
                    min_q = scheme.get("min_order_quantity", 1)
                    if item.quantity >= min_q:
                        disc_pct = scheme.get("discount_percentage", 0.0)
                        disc = round(gross * (disc_pct / 100.0), 2)
                        line_discount += disc
                        applied_benefits.append(AppliedSchemeBenefit(
                            scheme_id=str(scheme["_id"]),
                            scheme_name=scheme["name"],
                            scheme_type=stype,
                            discount_amount=disc,
                            applied_to_product_id=str(p_oid)
                        ))

                # 4. Fixed Amount Discount
                elif stype == "FIXED_AMOUNT_DISCOUNT":
                    min_q = scheme.get("min_order_quantity", 1)
                    if item.quantity >= min_q:
                        unit_disc = scheme.get("discount_amount", 0.0)
                        disc = round(min(gross, item.quantity * unit_disc), 2)
                        line_discount += disc
                        applied_benefits.append(AppliedSchemeBenefit(
                            scheme_id=str(scheme["_id"]),
                            scheme_name=scheme["name"],
                            scheme_type=stype,
                            discount_amount=disc,
                            applied_to_product_id=str(p_oid)
                        ))

            line_discount = min(gross, round(line_discount, 2))
            net = round(gross - line_discount, 2)
            total_savings += line_discount

            calculated_lines.append(CalculatedLineItem(
                product_id=str(p_oid),
                quantity=item.quantity,
                unit_price=item.unit_price,
                gross_amount=gross,
                total_discount=line_discount,
                net_amount=net,
                applied_schemes=applied_benefits
            ))

        subtotal = round(subtotal, 2)
        total_savings = round(total_savings, 2)
        final_total = max(0.0, round(subtotal - total_savings, 2))

        # Format free goods summary
        free_goods_summary = [
            {"product_id": pid, "quantity": qty}
            for pid, qty in free_goods_map.items()
        ]

        return SchemeCalculationResponse(
            lines=calculated_lines,
            subtotal=subtotal,
            total_savings=total_savings,
            final_total=final_total,
            free_goods_summary=free_goods_summary
        )

