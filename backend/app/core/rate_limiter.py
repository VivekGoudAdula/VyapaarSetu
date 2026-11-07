import time
from typing import Dict, List
from collections import defaultdict
from app.core.config import settings


class LoginRateLimiter:
    """
    In-memory sliding window rate limiter to protect authentication endpoints
    against automated brute-force credential stuffing.
    """
    def __init__(self):
        self._attempts: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, key: str) -> bool:
        """
        Checks if the provided key (e.g. IP + email) has exceeded maximum attempts.
        Returns True if blocked, False if allowed.
        """
        now = time.time()
        window = settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS
        max_attempts = settings.RATE_LIMIT_LOGIN_MAX_ATTEMPTS

        # Filter out timestamps older than the sliding window
        valid_attempts = [t for t in self._attempts[key] if now - t < window]
        self._attempts[key] = valid_attempts

        return len(valid_attempts) >= max_attempts

    def record_attempt(self, key: str) -> None:
        """Records an attempt timestamp."""
        now = time.time()
        self._attempts[key].append(now)

    def clear(self, key: str) -> None:
        """Clears records upon successful authentication."""
        if key in self._attempts:
            del self._attempts[key]


# Singleton instance for login endpoint protection
login_limiter = LoginRateLimiter()

