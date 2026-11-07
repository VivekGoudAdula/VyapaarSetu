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

    # JWT Authentication & Cookie Security Settings
    JWT_SECRET_KEY: str = Field(
        default="vyapaar_setu_dev_secret_key_change_in_production_min_32_bytes_long!!",
        description="Cryptographic secret key for signing JWT tokens"
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="JWT cryptographic algorithm"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        description="Access token lifespan in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="Refresh token lifespan in days"
    )
    COOKIE_SECURE: bool = Field(
        default=False,
        description="Set to True in production to require HTTPS for auth cookies"
    )
    COOKIE_SAMESITE: str = Field(
        default="lax",
        description="SameSite cookie policy ('lax', 'strict', or 'none')"
    )
    COOKIE_NAME: str = Field(
        default="vyapaar_refresh_token",
        description="HttpOnly cookie name for refresh token storage"
    )

    # Login Rate Limiting (Brute Force Protection)
    RATE_LIMIT_LOGIN_MAX_ATTEMPTS: int = Field(
        default=5,
        description="Maximum failed login attempts within window"
    )
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = Field(
        default=60,
        description="Rate limiting window in seconds"
    )

    # Vobiz Telephony Configuration (Phase 4)
    VOBIZ_API_BASE_URL: str = Field(
        default="https://api.vobiz.ai/api/v1",
        description="Vobiz Voice REST API base URL"
    )
    VOBIZ_AUTH_ID: str = Field(
        default="",
        description="Vobiz API Account Auth ID (e.g. MA_...)"
    )
    VOBIZ_AUTH_TOKEN: str = Field(
        default="",
        description="Vobiz API Account Auth Token"
    )
    VOBIZ_WEBHOOK_SECRET: str = Field(
        default="",
        description="Optional shared secret for cryptographic HMAC-SHA256 webhook signature verification"
    )
    VOBIZ_PHONE_NUMBER: str = Field(
        default="",
        description="Default Vobiz assigned virtual phone number (E.164 format)"
    )
    PUBLIC_BASE_URL: str = Field(
        default="http://localhost:8000",
        description="Publicly reachable HTTPS URL (e.g. ngrok tunnel) for Vobiz webhooks"
    )
    PUBLIC_WEBSOCKET_URL: str = Field(
        default="",
        description="Publicly reachable WSS URL for bidirectional audio streaming"
    )

    @property
    def websocket_stream_url(self) -> str:
        """Returns the public WSS endpoint URL for Vobiz media streaming."""
        if self.PUBLIC_WEBSOCKET_URL:
            return self.PUBLIC_WEBSOCKET_URL
        base = self.PUBLIC_BASE_URL.rstrip("/")
        if base.startswith("https://"):
            ws_base = "wss://" + base[8:]
        elif base.startswith("http://"):
            ws_base = "ws://" + base[7:]
        else:
            ws_base = f"wss://{base}"
        return f"{ws_base}{self.API_V1_PREFIX}/webhooks/vobiz/media-stream"

    @property
    def inbound_webhook_url(self) -> str:
        """Returns the public HTTPS endpoint URL for Vobiz Answer Webhook."""
        base = self.PUBLIC_BASE_URL.rstrip("/")
        return f"{base}{self.API_V1_PREFIX}/webhooks/vobiz/inbound-call"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a clean string list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Global settings singleton
settings = Settings()

