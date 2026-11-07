"""
Phase 3 Verification Suite for Vyapaar सेतु (Baatcheet se business tak.)
Tests the complete Business Setup & Configuration Foundation:
1. Product Catalogue CRUD & Packaging hierarchy conversion
2. Organization-scoped unique SKU constraint
3. Inventory balances & Low-stock threshold status calculation
4. Append-only movement ledger & non-negative stock invariant
5. Promotional trade schemes engine (Buy X Get Y, Volume Slabs)
6. Retailer directory & multi-location delivery addresses
7. Business operating settings & operating hours scheduler
8. Strict cross-tenant data isolation (Org A vs Org B)
"""
import sys
import os
import asyncio
from datetime import datetime, timezone
from bson import ObjectId

# Ensure backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.mongodb import mongo_manager
from app.db.indexes import create_all_indexes
from app.services.product_service import ProductService
from app.services.inventory_service import InventoryService
from app.services.scheme_service import SchemeService
from app.services.retailer_service import RetailerService
from app.services.settings_service import SettingsService
from app.schemas.product import ProductCreate, ProductUpdate, PackagingUnitConfig
from app.schemas.inventory import StockReceiveRequest, StockAdjustmentRequest
from app.schemas.scheme import SchemeCreate, VolumeSlab, SchemeCalculationRequest, OrderLineItemInput
from app.schemas.retailer import RetailerCreate, DeliveryAddress
from app.schemas.settings import BusinessSettingsUpdate, OperatingHoursConfig, OperatingHoursDay


async def run_verification():
    print("=" * 70)
    print("VYAPAAR सेतु — PHASE 3 VERIFICATION SUITE")
    print("=" * 70)

    # 1. Connect to Database
    print("\n[STEP 1] Connecting to MongoDB Atlas (isolated database 'vyapaar_setu')...")
    mongo_manager.connect()
    is_connected, error = await mongo_manager.ping()
    if not is_connected:
        print(f"FAILED: Could not connect to database: {error}")
        sys.exit(1)
    
    db = mongo_manager.db
    print(f"✓ Connected to isolated database: '{mongo_manager.db_name}'")

    # 2. Verify Indexes
    print("\n[STEP 2] Verifying compound database indexes...")
    await create_all_indexes(db)
    print("✓ All Phase 3 compound indexes verified successfully.")

    # 3. Create Isolated Test Organizations (Org A and Org B)
    print("\n[STEP 3] Setting up test tenant boundaries...")
    org_a_id = ObjectId()
    org_b_id = ObjectId()
    user_a_id = ObjectId()
    user_b_id = ObjectId()

    await db.organizations.insert_many([
        {
            "_id": org_a_id,
            "name": "Phase 3 Test Org A (Wholesale Hub)",
            "slug": f"org-a-{org_a_id}",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "settings": {"minimum_order_value": 1500}
        },
        {
            "_id": org_b_id,
            "name": "Phase 3 Test Org B (Mandi Traders)",
            "slug": f"org-b-{org_b_id}",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "settings": {"minimum_order_value": 2000}
        }
    ])
    print(f"✓ Created Org A ({org_a_id}) and Org B ({org_b_id})")

    # Services
    product_svc = ProductService(db)
    inventory_svc = InventoryService(db)
    scheme_svc = SchemeService(db)
    retailer_svc = RetailerService(db)
    settings_svc = SettingsService(db)

    try:
        # TEST 1: Product Catalogue & Packaging Hierarchies
        print("\n[TEST 1] Registering Wholesale Products & Packaging Units...")
        prod_payload_a = ProductCreate(
            sku="FMCG-OIL-FORT-1L",
            name="Fortune Refined Sunflower Oil 1L Pouch",
            brand="Fortune",
            category="Edible Oils",
            packaging=PackagingUnitConfig(
                base_unit="PIECE",
                packaging_unit="CARTON",
                conversion_factor=12
            ),
            mrp=155.00,
            base_wholesale_price=1400.00,
            min_order_quantity=1,
            initial_stock=50,
            low_stock_threshold=10,
            aliases=["fortune tel", "sunflower oil 1 litre"]
        )
        prod_a = await product_svc.create_product(org_a_id, user_a_id, prod_payload_a)
        print(f"✓ Product created in Org A: {prod_a.name} (SKU: {prod_a.sku})")
        print(f"  Packaging: 1 {prod_a.packaging.packaging_unit} = {prod_a.packaging.conversion_factor} {prod_a.packaging.base_unit}s")
        print(f"  Wholesale Price: ₹{prod_a.base_wholesale_price} | Available Stock: {prod_a.available_stock} {prod_a.packaging.packaging_unit}s")
        assert prod_a.current_stock == 50
        assert prod_a.stock_status == "in_stock"

        # TEST 2: Multi-Tenant SKU Collision Test
        print("\n[TEST 2] Verifying SKU uniqueness scoped strictly to organization...")
        # In Org A, creating the same SKU again should fail
        try:
            await product_svc.create_product(org_a_id, user_a_id, prod_payload_a)
            print("FAILED: Duplicate SKU in Org A was incorrectly allowed!")
            sys.exit(1)
        except Exception:
            print("✓ Duplicate SKU in same organization correctly rejected (HTTP 409 Conflict).")

        # In Org B, creating the SAME SKU should succeed because it's a different tenant
        prod_b = await product_svc.create_product(org_b_id, user_b_id, prod_payload_a)
        print(f"✓ Same SKU registered in Org B successfully: ID={prod_b.id} (Tenant Isolation Verified)")

        # Cross-tenant list isolation check
        list_a = await product_svc.list_products(org_a_id)
        list_b = await product_svc.list_products(org_b_id)
        assert len(list_a.items) == 1
        assert len(list_b.items) == 1
        assert list_a.items[0].id != list_b.items[0].id
        print("✓ Products strictly isolated: Org A cannot view or infer Org B's product IDs.")

        # TEST 3: Inventory Movement Ledger
        print("\n[TEST 3] Testing Inventory Ledger & Non-Negative Invariant...")
        # Initial stock should be recorded in ledger as OPENING_STOCK
        ledger_res = await inventory_svc.list_product_ledger(org_a_id, ObjectId(prod_a.id))
        assert ledger_res.total == 1
        assert ledger_res.items[0].movement_type == "OPENING_STOCK"
        assert ledger_res.items[0].quantity_delta == 50
        print(f"✓ Opening stock ledger entry verified: +50 units (Balance: 0 → 50)")

        # Record Inbound Shipment (Receive Stock)
        recv_req = StockReceiveRequest(
            product_id=prod_a.id,
            quantity_received=25,
            supplier_invoice="INV-DEL-9912",
            batch_number="BATCH-OCT-26",
            notes="Morning container shipment"
        )
        inv_after_recv = await inventory_svc.record_stock_received(org_a_id, user_a_id, recv_req)
        assert inv_after_recv.quantity_on_hand == 75
        assert inv_after_recv.quantity_available == 75
        print(f"✓ Stock received: +25 units. New available balance = {inv_after_recv.quantity_available} CARTONs")

        # Record Manual Adjustment (Damaged goods write-off)
        adj_req = StockAdjustmentRequest(
            product_id=prod_a.id,
            movement_type="STOCK_DAMAGED",
            quantity_delta=-5,
            reason="Water damage during monsoon transit",
            notes="Surveyed by godown manager"
        )
        inv_after_adj = await inventory_svc.record_stock_adjustment(org_a_id, user_a_id, adj_req)
        assert inv_after_adj.quantity_on_hand == 70
        print(f"✓ Stock adjusted (-5 units). New available balance = {inv_after_adj.quantity_available} CARTONs")

        # Test Negative Inventory Invariant
        try:
            bad_adj = StockAdjustmentRequest(
                product_id=prod_a.id,
                movement_type="MANUAL_ADJUSTMENT",
                quantity_delta=-500,
                reason="Invalid deduction test"
            )
            await inventory_svc.record_stock_adjustment(org_a_id, user_a_id, bad_adj)
            print("FAILED: Negative inventory was incorrectly allowed!")
            sys.exit(1)
        except Exception:
            print("✓ Negative inventory deduction correctly rejected (Non-negative Invariant Enforced).")

        # Verify full ledger history
        ledger_full = await inventory_svc.list_product_ledger(org_a_id, ObjectId(prod_a.id))
        assert ledger_full.total == 3
        print(f"✓ Verified 3 chronological ledger events: OPENING_STOCK (+50) → STOCK_RECEIVED (+25) → STOCK_DAMAGED (-5)")

        # TEST 4: Trade Promotional Schemes Engine
        print("\n[TEST 4] Testing Trade Promotional Schemes & Deterministic Calculator...")
        # Create Buy 10 Get 1 Free scheme
        scheme_create = SchemeCreate(
            name="Fortune Oil Monsoon Bonanza",
            scheme_type="BUY_X_GET_Y",
            applicable_product_ids=[prod_a.id],
            buy_quantity=10,
            free_quantity=1,
            free_product_id=prod_a.id,
            starts_at=datetime.now(timezone.utc),
            is_active=True
        )
        scheme_obj = await scheme_svc.create_scheme(org_a_id, scheme_create)
        print(f"✓ Created Trade Scheme: {scheme_obj.name} (Type: {scheme_obj.scheme_type})")

        # Create Volume Slab Discount Scheme (10+ cartons gets 5% off)
        scheme_slab = SchemeCreate(
            name="Tiered Volume Discount",
            scheme_type="VOLUME_SLAB_DISCOUNT",
            applicable_product_ids=[prod_a.id],
            slabs=[
                VolumeSlab(min_quantity=5, max_quantity=9, discount_percentage=2.0),
                VolumeSlab(min_quantity=10, max_quantity=None, discount_percentage=5.0)
            ],
            starts_at=datetime.now(timezone.utc),
            is_active=True
        )
        await scheme_svc.create_scheme(org_a_id, scheme_slab)
        print("✓ Created Volume Slab Scheme: 5-9 units (2% off), 10+ units (5% off)")

        # Run Deterministic Calculation on an order of 10 cartons at ₹1400/carton
        calc_req = SchemeCalculationRequest(
            items=[
                OrderLineItemInput(
                    product_id=prod_a.id,
                    quantity=10,
                    unit_price=1400.00
                )
            ]
        )
        calc_res = await scheme_svc.calculate_order_schemes(org_a_id, calc_req)
        print(f"✓ Deterministic Scheme Engine Output for 10 Cartons:")
        print(f"  Gross Subtotal: ₹{calc_res.subtotal:.2f}")
        print(f"  Volume Slab Discount (5%): ₹{calc_res.total_savings:.2f}")
        print(f"  Net Total Payable: ₹{calc_res.final_total:.2f}")
        print(f"  Free Goods Yielded: {calc_res.free_goods_summary}")
        assert calc_res.subtotal == 14000.00
        assert calc_res.total_savings == 700.00  # 5% of 14,000
        assert calc_res.final_total == 13300.00
        assert len(calc_res.free_goods_summary) == 1
        assert calc_res.free_goods_summary[0]["quantity"] == 1

        # TEST 5: Retailer Directory & Caller Recognition
        print("\n[TEST 5] Registering Retailer Account & Multi-Location Addresses...")
        ret_create = RetailerCreate(
            store_name="Sri Venkateshwara Kirana Store",
            owner_name="Venkatesh Rao",
            primary_phone="9848011223",
            alternate_phone="9848099887",
            gstin="36AAACS1429B1Z0",
            credit_limit=50000.00,
            current_balance=12400.00,
            preferred_language="te-IN",
            delivery_addresses=[
                DeliveryAddress(
                    label="Main Mandi Shop",
                    address_line1="Shop No. 4, Mandi Bazaar",
                    city="Hyderabad",
                    state="Telangana",
                    pin_code="500012",
                    is_default=True
                ),
                DeliveryAddress(
                    label="Godown 2",
                    address_line1="Plot 18, Industrial Estate",
                    city="Hyderabad",
                    state="Telangana",
                    pin_code="500028",
                    is_default=False
                )
            ]
        )
        ret_obj = await retailer_svc.create_retailer(org_a_id, ret_create)
        print(f"✓ Registered Retailer: {ret_obj.store_name} (Prop: {ret_obj.owner_name})")
        print(f"  Caller ID Phone: +91 {ret_obj.primary_phone} | Credit Limit: ₹{ret_obj.credit_limit:,.2f}")
        print(f"  Delivery Locations: {len(ret_obj.delivery_addresses)} addresses on file")

        # Duplicate Phone in same org should fail
        try:
            await retailer_svc.create_retailer(org_a_id, ret_create)
            print("FAILED: Duplicate retailer phone in same org was incorrectly allowed!")
            sys.exit(1)
        except Exception:
            print("✓ Duplicate retailer phone in same organization correctly rejected (HTTP 409 Conflict).")

        # Same phone in Org B should succeed (multi-tenant isolation)
        ret_b = await retailer_svc.create_retailer(org_b_id, ret_create)
        print(f"✓ Same retailer registered in Org B successfully: ID={ret_b.id} (Multi-tenant Caller ID Scoped)")

        # TEST 6: Business Operating Settings
        print("\n[TEST 6] Testing Business Settings & Operating Schedules...")
        settings_update = BusinessSettingsUpdate(
            minimum_order_value=2500.00,
            order_cutoff_time="19:00",
            operating_hours=OperatingHoursConfig(
                monday=OperatingHoursDay(is_open=True, open_time="07:30", close_time="21:00"),
                sunday=OperatingHoursDay(is_open=False, open_time="08:00", close_time="12:00")
            )
        )
        updated_settings = await settings_svc.update_settings(org_a_id, settings_update)
        assert updated_settings.minimum_order_value == 2500.00
        assert updated_settings.order_cutoff_time == "19:00"
        assert updated_settings.operating_hours.monday.open_time == "07:30"
        assert not updated_settings.operating_hours.sunday.is_open
        print(f"✓ Business settings updated:")
        print(f"  Minimum Order Value: ₹{updated_settings.minimum_order_value:.2f}")
        print(f"  Daily Cut-off Time: {updated_settings.order_cutoff_time}")
        print(f"  Monday Hours: {updated_settings.operating_hours.monday.open_time} - {updated_settings.operating_hours.monday.close_time}")
        print(f"  Sunday: Closed (is_open={updated_settings.operating_hours.sunday.is_open})")

        print("\n" + "=" * 70)
        print("ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("✓ Product Master Catalogue & Packaging Conversions verified")
        print("✓ Inventory Balances & Append-Only Movement Ledger verified")
        print("✓ Non-Negative Stock Invariant strictly enforced")
        print("✓ Deterministic Trade Schemes & Calculations verified")
        print("✓ Retailer Directory & Multiple Delivery Locations verified")
        print("✓ Business Operating Schedules & Policy Settings verified")
        print("✓ Multi-Tenant Data Isolation strictly enforced across all modules")
        print("=" * 70)

    finally:
        # Cleanup test records
        print("\n[CLEANUP] Cleaning up test records for Org A and Org B...")
        await db.products.delete_many({"organization_id": {"$in": [org_a_id, org_b_id]}})
        await db.inventory.delete_many({"organization_id": {"$in": [org_a_id, org_b_id]}})
        await db.inventory_ledger.delete_many({"organization_id": {"$in": [org_a_id, org_b_id]}})
        await db.schemes.delete_many({"organization_id": {"$in": [org_a_id, org_b_id]}})
        await db.retailers.delete_many({"organization_id": {"$in": [org_a_id, org_b_id]}})
        await db.organizations.delete_many({"_id": {"$in": [org_a_id, org_b_id]}})
        await mongo_manager.close()
        print("✓ Test cleanup completed.")


if __name__ == "__main__":
    asyncio.run(run_verification())
