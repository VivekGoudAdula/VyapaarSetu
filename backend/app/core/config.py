from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings and environment variable parser for Vyapaar सेतु.
    Follows Pydantic v2 BaseSettings specification.
    """
    # Application Metadata
    APP_NAME: str = "Vyapaar सेतु API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # MongoDB Settings
    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string (local or MongoDB Atlas)"
    )
    MONGODB_DATABASE: str = Field(
        default="vyapaar_setu",
        description="Target database name"
    )
    MONGODB_TIMEOUT_MS: int = Field(
        default=5000,
        description="Timeout for MongoDB connection and ping in milliseconds"
    )

    # CORS Settings
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Comma-separated allowed origins for CORS"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a clean string list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Global settings singleton
settings = Settings()

