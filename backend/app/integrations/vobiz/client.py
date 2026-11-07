"""
Vyapaar सेतु — Vobiz Voice REST API Client.
Provides asynchronous HTTP methods to verify Vobiz credentials, inspect purchased phone numbers,
and manage live calls via the official Vobiz API.
"""

import logging
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger("vyapaar_setu.telephony.client")


class VobizClient:
    """
    Async HTTP client interfacing with Vobiz Voice REST API.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        auth_id: Optional[str] = None,
        auth_token: Optional[str] = None,
        timeout_seconds: float = 8.0,
    ):
        self.base_url = (base_url or settings.VOBIZ_API_BASE_URL).rstrip("/")
        self.auth_id = (auth_id or settings.VOBIZ_AUTH_ID).strip()
        self.auth_token = (auth_token or settings.VOBIZ_AUTH_TOKEN).strip()
        self.timeout = timeout_seconds

    @property
    def is_configured(self) -> bool:
        """Checks if both Auth ID and Auth Token are populated."""
        return bool(self.auth_id and self.auth_token)

    def _get_headers(self) -> Dict[str, str]:
        """Builds standard Vobiz API authentication headers."""
        return {
            "X-Auth-ID": self.auth_id,
            "X-Auth-Token": self.auth_token,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"VyapaarSetu/{settings.APP_VERSION}",
        }

    async def test_connection(self) -> Dict[str, Any]:
        """
        Validates Vobiz API connectivity and account credentials.
        Returns a structured diagnostic dict.
        """
        if not self.is_configured:
            return {
                "status": "UNCONFIGURED",
                "is_connected": False,
                "message": "Vobiz credentials are not yet configured. Provide VOBIZ_AUTH_ID and VOBIZ_AUTH_TOKEN.",
                "details": {
                    "auth_id_set": bool(self.auth_id),
                    "auth_token_set": bool(self.auth_token),
                    "base_url": self.base_url,
                }
            }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Attempt to query account metadata or numbers
                # Vobiz Voice API endpoints: /account or /phone-numbers
                response = await client.get(
                    f"{self.base_url}/account",
                    headers=self._get_headers()
                )

                if response.status_code in (200, 201):
                    return {
                        "status": "CONNECTED",
                        "is_connected": True,
                        "message": "Successfully authenticated with Vobiz Telephony API.",
                        "details": response.json() if response.headers.get("content-type", "").startswith("application/json") else {"status_code": response.status_code}
                    }
                elif response.status_code in (401, 403):
                    return {
                        "status": "UNAUTHORIZED",
                        "is_connected": False,
                        "message": "Vobiz authentication failed. Invalid Auth ID or Auth Token.",
                        "details": {"status_code": response.status_code, "error": response.text}
                    }
                else:
                    return {
                        "status": "ERROR",
                        "is_connected": False,
                        "message": f"Vobiz API returned status {response.status_code}.",
                        "details": {"status_code": response.status_code, "error": response.text}
                    }
        except httpx.TimeoutException:
            return {
                "status": "TIMEOUT",
                "is_connected": False,
                "message": "Connection to Vobiz API timed out.",
                "details": {"timeout_seconds": self.timeout, "base_url": self.base_url}
            }
        except Exception as e:
            logger.warning(f"Vobiz API connection test error: {e}")
            return {
                "status": "ERROR",
                "is_connected": False,
                "message": f"Could not reach Vobiz API: {str(e)}",
                "details": {"error": str(e), "base_url": self.base_url}
            }

    async def hangup_call(self, call_uuid: str) -> bool:
        """Terminates an active call session through Vobiz REST API."""
        if not self.is_configured or not call_uuid:
            return False

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.base_url}/calls/{call_uuid}/hangup",
                    headers=self._get_headers()
                )
                return res.status_code in (200, 204)
        except Exception as e:
            logger.error(f"Failed to hang up call {call_uuid} via Vobiz API: {e}")
            return False


# Singleton client instance
vobiz_client = VobizClient()
