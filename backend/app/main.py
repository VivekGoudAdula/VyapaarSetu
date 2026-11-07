import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import mongo_manager
from app.db.indexes import create_all_indexes
from app.api.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vyapaar_setu.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Handles startup (DB connection initialization, index verification) and graceful shutdown.
    Non-blocking initial ping ensures sub-second startup even if DB is offline.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.APP_ENV})")
    
    # 1. Initialize MongoDB client pool
    mongo_manager.connect()

    # 2. Check initial database connectivity asynchronously and create indexes
    async def initial_db_check():
        try:
            is_connected, error = await mongo_manager.ping()
            if is_connected and mongo_manager.db is not None:
                logger.info(f"MongoDB cluster database '{mongo_manager.db_name}' connected successfully.")
                # Safe and idempotent index creation on isolated vyapaar_setu database
                await create_all_indexes(mongo_manager.db)
            else:
                logger.warning(f"MongoDB not reachable at startup: {error}. Running in degraded state.")
        except Exception as e:
            logger.warning(f"Initial MongoDB check encountered: {e}")

    asyncio.create_task(initial_db_check())

    yield

    # 3. Graceful shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")
    await mongo_manager.close()
    logger.info("Shutdown complete.")


def create_application() -> FastAPI:
    """Application factory for Vyapaar सेतु FastAPI service."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Vyapaar सेतु — AI-Powered Voice Commerce & B2B Order Automation Platform. (Baatcheet se business tak.)",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Configure CORS with credentials support for Vite local origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include Version 1 Routers
    app.include_router(health_router)
    app.include_router(health_router, prefix=settings.API_V1_PREFIX)
    app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
    app.include_router(organizations_router, prefix=settings.API_V1_PREFIX)

    @app.get("/", tags=["Root"])
    async def root():
        """Root API metadata endpoint."""
        return {
            "name": "Vyapaar सेतु API",
            "tagline": "Baatcheet se business tak.",
            "version": settings.APP_VERSION,
            "status": "operational",
            "docs": "/docs",
            "health": "/health",
        }

    return app


app = create_application()
