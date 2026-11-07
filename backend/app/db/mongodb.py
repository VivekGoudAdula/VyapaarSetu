import asyncio
import logging
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.uri_parser import parse_uri
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, PyMongoError
from app.core.config import settings

logger = logging.getLogger("vyapaar_setu.db")


class MongoManager:
    """
    Manages MongoDB client lifecycle, connection pooling, and connection health checks.
    Supports standalone instances, MongoDB Atlas replica sets, and SRV connection strings.
    """
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    db_name: str = "vyapaar_setu"

    def connect(self) -> None:
        """
        Initializes the async Motor client with connection pooling parameters.
        Does not block application startup if MongoDB is temporarily offline.
        """
        # Determine target database name from URI or settings
        try:
            parsed = parse_uri(settings.MONGODB_URI)
            self.db_name = parsed.get("database") or settings.MONGODB_DATABASE
        except Exception:
            self.db_name = settings.MONGODB_DATABASE

        logger.info(f"Initializing MongoDB client pool pointing to cluster (database: '{self.db_name}')")
        
        # Configure client with balanced timeout for cloud cluster discovery & local instances
        self.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            maxPoolSize=50,
            minPoolSize=5,
        )
        self.db = self.client[self.db_name]

    def close(self) -> None:
        """Closes MongoDB connection pool gracefully during server shutdown."""
        if self.client:
            logger.info("Closing MongoDB connection pool.")
            self.client.close()
            self.client = None
            self.db = None

    async def ping(self) -> Tuple[bool, Optional[str]]:
        """
        Executes a genuine health check against MongoDB.
        Issues an administrative ping command through Motor.
        
        Returns:
            Tuple[bool, Optional[str]]: (is_healthy, error_details)
        """
        if self.client is None or self.db is None:
            return False, "Database client is not initialized"

        try:
            timeout_seconds = max(2.0, settings.MONGODB_TIMEOUT_MS / 1000.0)
            await asyncio.wait_for(
                self.client.admin.command("ping"),
                timeout=timeout_seconds
            )
            return True, None
        except (asyncio.TimeoutError, ServerSelectionTimeoutError):
            msg = f"MongoDB connection timed out ({settings.MONGODB_TIMEOUT_MS}ms)"
            logger.warning(msg)
            return False, msg
        except (ConnectionFailure, PyMongoError) as e:
            msg = f"MongoDB connection failed: {str(e)}"
            logger.warning(msg)
            return False, msg
        except Exception as e:
            msg = f"Database health check error: {str(e)}"
            logger.warning(msg)
            return False, msg


# Database manager singleton
mongo_manager = MongoManager()


def get_database() -> AsyncIOMotorDatabase:
    """Dependency helper to get the active database instance."""
    if mongo_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return mongo_manager.db
