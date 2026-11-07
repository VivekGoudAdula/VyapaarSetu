import asyncio
import logging
from typing import Optional, Tuple
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.uri_parser import parse_uri
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, PyMongoError
from app.core.config import settings

logger = logging.getLogger("vyapaar_setu.db")


class MongoManager:
    """
    Manages MongoDB client lifecycle, connection pooling, and connection health checks.
    Uses official native PyMongo AsyncMongoClient (PyMongo 4.9+ asynchronous driver).
    Supports standalone instances, MongoDB Atlas replica sets, and SRV connection strings.
    """
    client: Optional[AsyncMongoClient] = None
    db: Optional[AsyncDatabase] = None
    db_name: str = "vyapaar_setu"

    def connect(self) -> None:
        """
        Initializes the native async MongoDB client with connection pooling parameters.
        Does not block application startup if MongoDB is temporarily offline.
        """
        # Authoritative database selection:
        # settings.MONGODB_DATABASE is authoritative to guarantee strict multi-tenant isolation
        # and prevent accidental connection to other databases on shared MongoDB clusters.
        try:
            parsed = parse_uri(settings.MONGODB_URI)
            uri_db = parsed.get("database")
        except Exception:
            uri_db = None

        self.db_name = settings.MONGODB_DATABASE.strip() if settings.MONGODB_DATABASE else (uri_db or "vyapaar_setu")
        logger.info(f"Initializing native PyMongo AsyncMongoClient (effective database: '{self.db_name}')")
        
        self.client = AsyncMongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            maxPoolSize=50,
            minPoolSize=5,
        )
        self.db = self.client[self.db_name]

    async def close(self) -> None:
        """Closes native async MongoDB connection pool gracefully during server shutdown."""
        if self.client:
            logger.info("Closing native async MongoDB connection pool.")
            await self.client.close()
            self.client = None
            self.db = None

    async def ping(self) -> Tuple[bool, Optional[str]]:
        """
        Executes a genuine health check against MongoDB.
        Issues an administrative ping command through native PyMongo AsyncMongoClient.
        
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


def get_database() -> AsyncDatabase:
    """Dependency helper to get the active async database instance."""
    if mongo_manager.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return mongo_manager.db
