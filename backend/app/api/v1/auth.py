import uuid
import re
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    hash_token,
    generate_secure_token,
    create_access_token,
    validate_password_strength
)
from app.core.rate_limiter import login_limiter
from app.db.mongodb import get_database
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    UserResponse,
    OrganizationResponse,
    TokenRefreshResponse
)
from app.api.deps import get_tenant_context, TenantContext

logger = logging.getLogger("vyapaar_setu.auth")
router = APIRouter(prefix="/auth", tags=["Authentication & Tenants"])


def _generate_slug(name: str) -> str:
    """Creates a URL-safe unique slug from an organization name."""
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
    if not clean:
        clean = "distributor"
    return f"{clean}-{secrets.token_hex(2)}"


def _set_refresh_cookie(response: Response, raw_refresh_token: str, days: int) -> None:
    """Sets secure HttpOnly cookie for refresh token transmission."""
    max_age = days * 24 * 60 * 60
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=raw_refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=max_age,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clears the refresh token cookie upon logout or security invalidation."""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_organization(
    data: RegisterRequest,
    response: Response,
    db: AsyncDatabase = Depends(get_database)
):
    """
    Onboards a new wholesale distributor organization.
    1. Validates inputs & password strength.
    2. Enforces unique email check.
    3. Hashes password using Argon2id.
    4. Provisions User, Organization, and OWNER Membership.
    5. Issues short-lived access token and HttpOnly refresh session.
    """
    # 1. Validate password strength
    is_strong, pwd_err = validate_password_strength(data.password)
    if not is_strong:
        logger.warning(f"Registration rejected for email '{data.email}': {pwd_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_err
        )

    # 2. Check for existing account
    normalized_email = data.email.strip().lower()
    existing_user = await db.users.find_one({"email_normalized": normalized_email})
    if existing_user:
        logger.warning(f"Registration rejected: account with email '{normalized_email}' already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    now = datetime.now(timezone.utc)
    user_id = ObjectId()
    org_id = ObjectId()
    membership_id = ObjectId()
    session_id = ObjectId()

    password_hash = hash_password(data.password)
    org_slug = _generate_slug(data.organization_name)

    # 3. Provisioning documents
    user_doc = {
        "_id": user_id,
        "name": data.name.strip(),
        "email": data.email.strip(),
        "email_normalized": normalized_email,
        "password_hash": password_hash,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    org_doc = {
        "_id": org_id,
        "name": data.organization_name.strip(),
        "slug": org_slug,
        "business_type": data.business_type.strip(),
        "owner_user_id": user_id,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    membership_doc = {
        "_id": membership_id,
        "organization_id": org_id,
        "user_id": user_id,
        "role": "ORGANIZATION_OWNER",
        "status": "ACTIVE",
        "created_at": now,
        "updated_at": now
    }

    # Refresh Session Creation
    raw_refresh_token = generate_secure_token(32)
    token_hash = hash_token(raw_refresh_token)
    token_family_id = str(uuid.uuid4())
    session_expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    session_doc = {
        "_id": session_id,
        "user_id": user_id,
        "token_hash": token_hash,
        "token_family_id": token_family_id,
        "expires_at": session_expires_at,
        "revoked_at": None,
        "created_at": now
    }

    # 4. Provisioning execution with compensation on failure
    try:
        await db.users.insert_one(user_doc)
        await db.organizations.insert_one(org_doc)
        await db.organization_memberships.insert_one(membership_doc)
        await db.refresh_sessions.insert_one(session_doc)
    except Exception as e:
        logger.error(f"Organization registration failed during write: {e}. Executing compensation cleanup.")
        # Compensation: Ensure no orphan records remain
        await db.users.delete_one({"_id": user_id})
        await db.organizations.delete_one({"_id": org_id})
        await db.organization_memberships.delete_one({"_id": membership_id})
        await db.refresh_sessions.delete_one({"_id": session_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete organization registration. Please try again."
        )

    # 5. Issue Tokens
    access_token = create_access_token({
        "sub": str(user_id),
        "org_id": str(org_id),
        "role": "ORGANIZATION_OWNER"
    })

    _set_refresh_cookie(response, raw_refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user_id),
            name=user_doc["name"],
            email=user_doc["email"],
            is_active=True,
            created_at=now.isoformat()
        ),
        organization=OrganizationResponse(
            id=str(org_id),
            name=org_doc["name"],
            slug=org_slug,
            business_type=org_doc["business_type"],
            role="ORGANIZATION_OWNER",
            created_at=now.isoformat()
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncDatabase = Depends(get_database)
):
    """
    Authenticates a distributor user.
    - Protected by sliding window rate limiter against brute-force attacks.
    - Verifies password against Argon2id hash.
    - Issues short-lived access token and rotated refresh token cookie.
    """
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{data.email}"

    if login_limiter.is_rate_limited(rate_limit_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 60 seconds before trying again."
        )

    normalized_email = data.email.strip().lower()
    user = await db.users.find_one({"email_normalized": normalized_email, "is_active": True})

    if not user:
        login_limiter.record_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please register first."
        )

    if not verify_password(data.password, user["password_hash"]):
        login_limiter.record_attempt(rate_limit_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify your password and try again."
        )

    # Login succeeded: clear rate limiter counter
    login_limiter.clear(rate_limit_key)
    user_id = user["_id"]

    # Retrieve user's active organization membership
    membership = await db.organization_memberships.find_one({
        "user_id": user_id,
        "status": "ACTIVE"
    })

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has no active organization membership. Please contact support."
        )

    org_id = membership["organization_id"]
    organization = await db.organizations.find_one({
        "_id": org_id,
        "is_active": True
    })

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distributor organization record is currently inactive."
        )

    now = datetime.now(timezone.utc)
    raw_refresh_token = generate_secure_token(32)
    token_hash = hash_token(raw_refresh_token)
    token_family_id = str(uuid.uuid4())
    days_valid = 30 if data.remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    session_expires_at = now + timedelta(days=days_valid)

    session_doc = {
        "_id": ObjectId(),
        "user_id": user_id,
        "token_hash": token_hash,
        "token_family_id": token_family_id,
        "expires_at": session_expires_at,
        "revoked_at": None,
        "created_at": now
    }
    await db.refresh_sessions.insert_one(session_doc)

    access_token = create_access_token({
        "sub": str(user_id),
        "org_id": str(org_id),
        "role": membership["role"]
    })

    _set_refresh_cookie(response, raw_refresh_token, days_valid)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user_id),
            name=user["name"],
            email=user["email"],
            is_active=user["is_active"],
            created_at=user["created_at"].isoformat()
        ),
        organization=OrganizationResponse(
            id=str(org_id),
            name=organization["name"],
            slug=organization["slug"],
            business_type=organization["business_type"],
            role=membership["role"],
            created_at=organization["created_at"].isoformat()
        )
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncDatabase = Depends(get_database)
):
    """
    Refreshes an access token using HttpOnly cookie refresh token.
    Implements Refresh Token Rotation and Automatic Token Reuse Detection.
    If a previously rotated token is reused, revokes the entire token family.
    """
    raw_refresh_token = request.cookies.get(settings.COOKIE_NAME)
    if not raw_refresh_token:
        # Check Authorization header as fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            raw_refresh_token = auth_header.replace("Bearer ", "").strip()

    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token was provided. Please sign in."
        )

    incoming_token_hash = hash_token(raw_refresh_token)
    session = await db.refresh_sessions.find_one({"token_hash": incoming_token_hash})

    if not session:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh session."
        )

    now = datetime.now(timezone.utc)

    # Token Reuse Detection (Replay Attack Protection)
    if session.get("revoked_at") is not None:
        logger.warning(
            f"SECURITY ALERT: Refresh token reuse detected for user {session['user_id']}! "
            f"Revoking all sessions in token family {session['token_family_id']}."
        )
        await db.refresh_sessions.update_many(
            {"token_family_id": session["token_family_id"]},
            {"$set": {"revoked_at": now}}
        )
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session security violation detected. All sessions in this family revoked. Please sign in again."
        )

    # Expiry Check
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please sign in again."
        )

    # 1. Revoke the consumed refresh token
    await db.refresh_sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"revoked_at": now}}
    )

    # 2. Issue new rotated refresh token in the same token family
    new_raw_token = generate_secure_token(32)
    new_token_hash = hash_token(new_raw_token)
    new_session_doc = {
        "_id": ObjectId(),
        "user_id": session["user_id"],
        "token_hash": new_token_hash,
        "token_family_id": session["token_family_id"],
        "expires_at": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "revoked_at": None,
        "created_at": now
    }
    await db.refresh_sessions.insert_one(new_session_doc)

    # 3. Resolve user and active organization
    user = await db.users.find_one({"_id": session["user_id"], "is_active": True})
    if not user:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active."
        )

    membership = await db.organization_memberships.find_one({
        "user_id": user["_id"],
        "status": "ACTIVE"
    })
    if not membership:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active organization membership found."
        )

    organization = await db.organizations.find_one({
        "_id": membership["organization_id"],
        "is_active": True
    })

    access_token = create_access_token({
        "sub": str(user["_id"]),
        "org_id": str(organization["_id"]),
        "role": membership["role"]
    })

    _set_refresh_cookie(response, new_raw_token, settings.REFRESH_TOKEN_EXPIRE_DAYS)

    return TokenRefreshResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            is_active=user["is_active"],
            created_at=user["created_at"].isoformat()
        ),
        organization=OrganizationResponse(
            id=str(organization["_id"]),
            name=organization["name"],
            slug=organization["slug"],
            business_type=organization["business_type"],
            role=membership["role"],
            created_at=organization["created_at"].isoformat()
        )
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncDatabase = Depends(get_database)
):
    """
    Revokes the current refresh token session and clears the client auth cookie.
    """
    raw_token = request.cookies.get(settings.COOKIE_NAME)
    if raw_token:
        token_hash = hash_token(raw_token)
        await db.refresh_sessions.update_one(
            {"token_hash": token_hash},
            {"$set": {"revoked_at": datetime.now(timezone.utc)}}
        )

    _clear_refresh_cookie(response)
    return {"message": "Logged out successfully."}


@router.get("/me")
async def get_current_user_profile(
    tenant: TenantContext = Depends(get_tenant_context)
):
    """
    Returns the authenticated user's profile and active organization context.
    """
    user = tenant.user
    org = tenant.organization
    return {
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "is_active": user["is_active"],
            "created_at": user["created_at"].isoformat()
        },
        "organization": {
            "id": str(org["_id"]),
            "name": org["name"],
            "slug": org["slug"],
            "business_type": org["business_type"],
            "role": tenant.role,
            "created_at": org["created_at"].isoformat()
        }
    }

