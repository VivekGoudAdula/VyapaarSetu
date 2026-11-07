import logging
from pymongo.asynchronous.database import AsyncDatabase
from pymongo import ASCENDING, DESCENDING

logger = logging.getLogger("vyapaar_setu.indexes")


async def create_all_indexes(db: AsyncDatabase) -> None:
    """
    Creates necessary MongoDB compound and unique indexes for Vyapaar सेतु.
    Safe and idempotent — executes during startup on the isolated vyapaar_setu database.
    """
    try:
        # Phase 2 Core Identity & Auth Indexes
        logger.info("Initializing database indexes for collection: users")
        await db.users.create_index(
            [("email_normalized", ASCENDING)],
            unique=True,
            name="uq_users_email_normalized"
        )
        await db.users.create_index(
            [("created_at", DESCENDING)],
            name="idx_users_created_at"
        )

        logger.info("Initializing database indexes for collection: organizations")
        await db.organizations.create_index(
            [("slug", ASCENDING)],
            unique=True,
            name="uq_organizations_slug"
        )
        await db.organizations.create_index(
            [("owner_user_id", ASCENDING)],
            name="idx_organizations_owner_user_id"
        )

        logger.info("Initializing database indexes for collection: organization_memberships")
        await db.organization_memberships.create_index(
            [("organization_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
            name="uq_memberships_org_user"
        )
        await db.organization_memberships.create_index(
            [("user_id", ASCENDING), ("status", ASCENDING)],
            name="idx_memberships_user_status"
        )
        await db.organization_memberships.create_index(
            [("organization_id", ASCENDING), ("status", ASCENDING)],
            name="idx_memberships_org_status"
        )

        logger.info("Initializing database indexes for collection: refresh_sessions")
        await db.refresh_sessions.create_index(
            [("token_hash", ASCENDING)],
            unique=True,
            name="uq_refresh_sessions_token_hash"
        )
        await db.refresh_sessions.create_index(
            [("token_family_id", ASCENDING)],
            name="idx_refresh_sessions_family_id"
        )
        await db.refresh_sessions.create_index(
            [("user_id", ASCENDING), ("revoked_at", ASCENDING)],
            name="idx_refresh_sessions_user_revoked"
        )
        await db.refresh_sessions.create_index(
            [("expires_at", ASCENDING)],
            name="idx_refresh_sessions_expires_at"
        )

        # Phase 3 Business Setup & Configuration Indexes
        logger.info("Initializing database indexes for collection: products")
        await db.products.create_index(
            [("organization_id", ASCENDING), ("sku", ASCENDING)],
            unique=True,
            name="uq_products_org_sku"
        )
        await db.products.create_index(
            [("organization_id", ASCENDING), ("category", ASCENDING)],
            name="idx_products_org_category"
        )
        await db.products.create_index(
            [("organization_id", ASCENDING), ("is_available", ASCENDING)],
            name="idx_products_org_available"
        )
        await db.products.create_index(
            [("organization_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_products_org_created_at"
        )

        logger.info("Initializing database indexes for collection: inventory")
        await db.inventory.create_index(
            [("organization_id", ASCENDING), ("product_id", ASCENDING)],
            unique=True,
            name="uq_inventory_org_product"
        )
        await db.inventory.create_index(
            [("organization_id", ASCENDING), ("status", ASCENDING)],
            name="idx_inventory_org_status"
        )
        await db.inventory.create_index(
            [("organization_id", ASCENDING), ("quantity_available", ASCENDING)],
            name="idx_inventory_org_available"
        )

        logger.info("Initializing database indexes for collection: inventory_ledger")
        await db.inventory_ledger.create_index(
            [("organization_id", ASCENDING), ("product_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_ledger_org_product_created"
        )
        await db.inventory_ledger.create_index(
            [("organization_id", ASCENDING), ("movement_type", ASCENDING)],
            name="idx_ledger_org_movement"
        )

        logger.info("Initializing database indexes for collection: schemes")
        await db.schemes.create_index(
            [("organization_id", ASCENDING), ("is_active", ASCENDING), ("starts_at", ASCENDING)],
            name="idx_schemes_org_active_starts"
        )
        await db.schemes.create_index(
            [("organization_id", ASCENDING), ("applicable_product_ids", ASCENDING)],
            name="idx_schemes_org_products"
        )

        logger.info("Initializing database indexes for collection: retailers")
        await db.retailers.create_index(
            [("organization_id", ASCENDING), ("primary_phone", ASCENDING)],
            unique=True,
            name="uq_retailers_org_primary_phone"
        )
        await db.retailers.create_index(
            [("organization_id", ASCENDING), ("is_active", ASCENDING)],
            name="idx_retailers_org_active"
        )
        await db.retailers.create_index(
            [("organization_id", ASCENDING), ("store_name", ASCENDING)],
            name="idx_retailers_org_store_name"
        )

        # Telephony & Call Audit Indexes
        logger.info("Initializing database indexes for collection: phone_configs")
        await db.phone_configs.create_index(
            [("phone_number", ASCENDING)],
            unique=True,
            name="uq_phone_configs_phone_number"
        )
        await db.phone_configs.create_index(
            [("organization_id", ASCENDING)],
            unique=True,
            name="uq_phone_configs_organization"
        )
        await db.phone_configs.create_index(
            [("provider", ASCENDING), ("phone_number", ASCENDING)],
            name="idx_phone_configs_provider_phone"
        )

        logger.info("Initializing database indexes for collection: calls")
        await db.calls.create_index(
            [("call_sid", ASCENDING)],
            unique=True,
            name="uq_calls_call_sid"
        )
        await db.calls.create_index(
            [("organization_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_calls_org_created_at"
        )
        await db.calls.create_index(
            [("organization_id", ASCENDING), ("status", ASCENDING)],
            name="idx_calls_org_status"
        )
        await db.calls.create_index(
            [("organization_id", ASCENDING), ("retailer_id", ASCENDING)],
            name="idx_calls_org_retailer"
        )

        logger.info("Initializing database indexes for collection: call_events")
        await db.call_events.create_index(
            [("call_id", ASCENDING), ("created_at", ASCENDING)],
            name="idx_call_events_call_created"
        )
        await db.call_events.create_index(
            [("organization_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_call_events_org_created"
        )

        logger.info("All Vyapaar सेतु database indexes verified successfully.")
    except Exception as e:
        logger.error(f"Failed to create database indexes: {e}")
        # Non-fatal during transient startup, logged for diagnostics
