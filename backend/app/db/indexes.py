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

        logger.info("All core database indexes verified successfully.")
    except Exception as e:
        logger.error(f"Failed to create database indexes: {e}")
        # Non-fatal during transient startup, logged for diagnostics
