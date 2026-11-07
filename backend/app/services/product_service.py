import math
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    PackagingUnitConfig
)


def compute_stock_status(available: int, threshold: int) -> str:
    """Helper to determine inventory status badge."""
    if available <= 0:
        return "out_of_stock"
    if available <= threshold:
        return "low_stock"
    return "in_stock"


class ProductService:
    """
    Business service for Wholesale Product Catalogue management.
    Strictly scoped to authenticated organization_id.
    """
    def __init__(self, db: AsyncDatabase):
        self.db = db

    async def create_product(
        self,
        org_id: ObjectId,
        user_id: ObjectId,
        payload: ProductCreate
    ) -> ProductResponse:
        """
        Creates a new product in the organization catalog and initializes
        its dedicated stock snapshot and opening inventory ledger entry.
        """
        # 1. Enforce SKU uniqueness within the organization
        existing_sku = await self.db.products.find_one({
            "organization_id": org_id,
            "sku": payload.sku
        })
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{payload.sku}' already exists in your catalog."
            )

        now = datetime.now(timezone.utc)

        # 2. Prepare product document
        product_doc = {
            "organization_id": org_id,
            "sku": payload.sku,
            "name": payload.name,
            "brand": payload.brand,
            "category": payload.category or "General",
            "description": payload.description,
            "packaging": payload.packaging.model_dump(),
            "mrp": payload.mrp,
            "base_wholesale_price": payload.base_wholesale_price,
            "min_order_quantity": payload.min_order_quantity,
            "hsn_code": payload.hsn_code,
            "tax_rate_percentage": payload.tax_rate_percentage,
            "aliases": payload.aliases,
            "is_available": payload.is_available,
            "created_at": now,
            "updated_at": now,
        }

        insert_result = await self.db.products.insert_one(product_doc)
        product_id = insert_result.inserted_id

        # 3. Initialize inventory document
        initial_qty = payload.initial_stock
        stock_status = compute_stock_status(initial_qty, payload.low_stock_threshold)
        inventory_doc = {
            "organization_id": org_id,
            "product_id": product_id,
            "quantity_on_hand": initial_qty,
            "quantity_reserved": 0,
            "quantity_available": initial_qty,
            "reorder_threshold": payload.low_stock_threshold,
            "status": stock_status,
            "last_restocked_at": now if initial_qty > 0 else None,
            "updated_at": now,
        }
        await self.db.inventory.insert_one(inventory_doc)

        # 4. If initial stock > 0, append opening ledger record
        if initial_qty > 0:
            ledger_entry = {
                "organization_id": org_id,
                "product_id": product_id,
                "movement_type": "OPENING_STOCK",
                "quantity_delta": initial_qty,
                "quantity_before": 0,
                "quantity_after": initial_qty,
                "reason": "Opening stock balance on product registration",
                "notes": None,
                "created_by_user_id": user_id,
                "created_at": now,
            }
            await self.db.inventory_ledger.insert_one(ledger_entry)

        return ProductResponse(
            id=str(product_id),
            organization_id=str(org_id),
            sku=payload.sku,
            name=payload.name,
            brand=payload.brand,
            category=payload.category or "General",
            description=payload.description,
            packaging=payload.packaging,
            mrp=payload.mrp,
            base_wholesale_price=payload.base_wholesale_price,
            min_order_quantity=payload.min_order_quantity,
            hsn_code=payload.hsn_code,
            tax_rate_percentage=payload.tax_rate_percentage,
            aliases=payload.aliases,
            is_available=payload.is_available,
            current_stock=initial_qty,
            reserved_stock=0,
            available_stock=initial_qty,
            stock_status=stock_status,
            created_at=now,
            updated_at=now,
        )

    async def list_products(
        self,
        org_id: ObjectId,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        is_available: Optional[bool] = None,
    ) -> ProductListResponse:
        """
        Lists organization products with pagination, search, category filtering,
        and integrated real-time stock balances.
        """
        query: Dict[str, Any] = {"organization_id": org_id}

        if category and category.strip() and category != "All":
            query["category"] = category.strip()

        if is_available is not None:
            query["is_available"] = is_available

        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"name": {"$regex": s, "$options": "i"}},
                {"sku": {"$regex": s, "$options": "i"}},
                {"brand": {"$regex": s, "$options": "i"}},
                {"aliases": {"$regex": s, "$options": "i"}},
            ]

        total = await self.db.products.count_documents(query)
        pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        skip = (page - 1) * limit

        cursor = self.db.products.find(query).sort("created_at", -1).skip(skip).limit(limit)
        product_docs = await cursor.to_list(length=limit)

        # Batch load inventory records for page products
        product_ids = [doc["_id"] for doc in product_docs]
        inventory_map: Dict[ObjectId, dict] = {}
        if product_ids:
            inv_cursor = self.db.inventory.find({
                "organization_id": org_id,
                "product_id": {"$in": product_ids}
            })
            inv_docs = await inv_cursor.to_list(length=len(product_ids))
            inventory_map = {inv["product_id"]: inv for inv in inv_docs}

        # Retrieve distinct categories for the organization filter
        categories = await self.db.products.distinct("category", {"organization_id": org_id})

        items: List[ProductResponse] = []
        for doc in product_docs:
            pid = doc["_id"]
            inv = inventory_map.get(pid, {})
            q_on_hand = inv.get("quantity_on_hand", 0)
            q_reserved = inv.get("quantity_reserved", 0)
            q_avail = inv.get("quantity_available", q_on_hand - q_reserved)
            threshold = inv.get("reorder_threshold", 10)
            status_val = inv.get("status") or compute_stock_status(q_avail, threshold)

            pkg = doc.get("packaging", {})
            packaging_obj = PackagingUnitConfig(
                base_unit=pkg.get("base_unit", "PIECE"),
                packaging_unit=pkg.get("packaging_unit", "CARTON"),
                conversion_factor=pkg.get("conversion_factor", 1)
            )

            items.append(ProductResponse(
                id=str(pid),
                organization_id=str(org_id),
                sku=doc["sku"],
                name=doc["name"],
                brand=doc.get("brand"),
                category=doc.get("category", "General"),
                description=doc.get("description"),
                packaging=packaging_obj,
                mrp=doc.get("mrp", 0.0),
                base_wholesale_price=doc.get("base_wholesale_price", 0.0),
                min_order_quantity=doc.get("min_order_quantity", 1),
                hsn_code=doc.get("hsn_code"),
                tax_rate_percentage=doc.get("tax_rate_percentage", 0.0),
                aliases=doc.get("aliases", []),
                is_available=doc.get("is_available", True),
                current_stock=q_on_hand,
                reserved_stock=q_reserved,
                available_stock=q_avail,
                stock_status=status_val,
                created_at=doc.get("created_at", datetime.now(timezone.utc)),
                updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
            ))

        return ProductListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            categories=[c for c in categories if c]
        )

    async def get_product(self, org_id: ObjectId, product_id: ObjectId) -> ProductResponse:
        """Retrieves a single product with full inventory state."""
        doc = await self.db.products.find_one({
            "_id": product_id,
            "organization_id": org_id
        })
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this organization."
            )

        inv = await self.db.inventory.find_one({
            "organization_id": org_id,
            "product_id": product_id
        }) or {}

        q_on_hand = inv.get("quantity_on_hand", 0)
        q_reserved = inv.get("quantity_reserved", 0)
        q_avail = inv.get("quantity_available", q_on_hand - q_reserved)
        threshold = inv.get("reorder_threshold", 10)
        status_val = inv.get("status") or compute_stock_status(q_avail, threshold)

        pkg = doc.get("packaging", {})
        packaging_obj = PackagingUnitConfig(
            base_unit=pkg.get("base_unit", "PIECE"),
            packaging_unit=pkg.get("packaging_unit", "CARTON"),
            conversion_factor=pkg.get("conversion_factor", 1)
        )

        return ProductResponse(
            id=str(product_id),
            organization_id=str(org_id),
            sku=doc["sku"],
            name=doc["name"],
            brand=doc.get("brand"),
            category=doc.get("category", "General"),
            description=doc.get("description"),
            packaging=packaging_obj,
            mrp=doc.get("mrp", 0.0),
            base_wholesale_price=doc.get("base_wholesale_price", 0.0),
            min_order_quantity=doc.get("min_order_quantity", 1),
            hsn_code=doc.get("hsn_code"),
            tax_rate_percentage=doc.get("tax_rate_percentage", 0.0),
            aliases=doc.get("aliases", []),
            is_available=doc.get("is_available", True),
            current_stock=q_on_hand,
            reserved_stock=q_reserved,
            available_stock=q_avail,
            stock_status=status_val,
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        )

    async def update_product(
        self,
        org_id: ObjectId,
        product_id: ObjectId,
        payload: ProductUpdate
    ) -> ProductResponse:
        """Updates product information while verifying SKU uniqueness."""
        doc = await self.db.products.find_one({
            "_id": product_id,
            "organization_id": org_id
        })
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this organization."
            )

        update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

        # Check SKU conflict if SKU is being updated
        if payload.sku and payload.sku != doc["sku"]:
            conflict = await self.db.products.find_one({
                "organization_id": org_id,
                "sku": payload.sku,
                "_id": {"$ne": product_id}
            })
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product SKU '{payload.sku}' is already in use by another product."
                )
            update_fields["sku"] = payload.sku

        if payload.name is not None:
            update_fields["name"] = payload.name
        if payload.brand is not None:
            update_fields["brand"] = payload.brand
        if payload.category is not None:
            update_fields["category"] = payload.category
        if payload.description is not None:
            update_fields["description"] = payload.description
        if payload.packaging is not None:
            update_fields["packaging"] = payload.packaging.model_dump()
        if payload.mrp is not None:
            update_fields["mrp"] = payload.mrp
        if payload.base_wholesale_price is not None:
            update_fields["base_wholesale_price"] = payload.base_wholesale_price
        if payload.min_order_quantity is not None:
            update_fields["min_order_quantity"] = payload.min_order_quantity
        if payload.hsn_code is not None:
            update_fields["hsn_code"] = payload.hsn_code
        if payload.tax_rate_percentage is not None:
            update_fields["tax_rate_percentage"] = payload.tax_rate_percentage
        if payload.aliases is not None:
            update_fields["aliases"] = payload.aliases
        if payload.is_available is not None:
            update_fields["is_available"] = payload.is_available

        await self.db.products.update_one(
            {"_id": product_id, "organization_id": org_id},
            {"$set": update_fields}
        )

        return await self.get_product(org_id, product_id)

    async def delete_product(self, org_id: ObjectId, product_id: ObjectId) -> dict:
        """
        Deactivates or soft-deletes a product to preserve ledger and historical order integrity.
        """
        res = await self.db.products.update_one(
            {"_id": product_id, "organization_id": org_id},
            {"$set": {"is_available": False, "updated_at": datetime.now(timezone.utc)}}
        )
        if res.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in this organization."
            )
        return {"status": "success", "message": "Product deactivated successfully."}

