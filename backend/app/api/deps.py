from typing import Optional, List
from bson import ObjectId
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.db.mongodb import get_database
from pymongo.asynchronous.database import AsyncDatabase

# Standard HTTP Bearer scheme
security_bearer = HTTPBearer(auto_error=False)


class TenantContext:
    """
    Cryptographically and database-verified tenant context.
    Every organization-scoped operation MUST consume this context.
    The organization_id is NEVER read from unauthenticated client input.
    """
    def __init__(
        self,
        user: dict,
        organization: dict,
        membership: dict
    ):
        self.user = user
        self.organization = organization
        self.membership = membership
        self.user_id: ObjectId = user["_id"]
        self.organization_id: ObjectId = organization["_id"]
        self.role: str = membership.get("role", "ORGANIZATION_STAFF")

    def is_owner(self) -> bool:
        return self.role == "ORGANIZATION_OWNER"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: AsyncDatabase = Depends(get_database)
) -> dict:
    """
    Validates the Bearer JWT access token and resolves the authenticated active user.
    Raises HTTP 401 if token is missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_oid = ObjectId(user_id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.users.find_one({"_id": user_oid, "is_active": True})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or has been disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_tenant_context(
    user: dict = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_database),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
) -> TenantContext:
    """
    Strict Tenant Isolation Dependency.
    1. Verifies the authenticated user has an active membership in the organization.
    2. If X-Organization-Id is provided, validates membership against that specific org.
    3. Resolves the organization document and returns a verified TenantContext.
    """
    user_id = user["_id"]

    query = {"user_id": user_id, "status": "ACTIVE"}
    if x_org_id:
        try:
            query["organization_id"] = ObjectId(x_org_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid organization identifier format."
            )

    membership = await db.organization_memberships.find_one(query)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have active membership in this organization."
        )

    organization = await db.organizations.find_one({
        "_id": membership["organization_id"],
        "is_active": True
    })

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or inactive."
        )

    return TenantContext(
        user=user,
        organization=organization,
        membership=membership
    )


def require_role(allowed_roles: List[str]):
    """
    RBAC dependency factory.
    Enforces that the authenticated user holds one of the specified roles
    in the active organization context.
    """
    async def role_checker(
        tenant: TenantContext = Depends(get_tenant_context)
    ) -> TenantContext:
        if tenant.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this management action."
            )
        return tenant

    return role_checker


# Predefined RBAC dependencies
require_owner = require_role(["ORGANIZATION_OWNER"])
require_staff_or_owner = require_role(["ORGANIZATION_OWNER", "ORGANIZATION_STAFF"])

