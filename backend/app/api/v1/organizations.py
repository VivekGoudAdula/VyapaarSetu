from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from pymongo.asynchronous.database import AsyncDatabase

from app.api.deps import get_tenant_context, require_owner, TenantContext
from app.db.mongodb import get_database
from app.schemas.auth import OrganizationResponse, OrganizationMemberResponse

router = APIRouter(prefix="/organizations", tags=["Organizations & Multi-Tenancy"])


class UpdateOrganizationRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    business_type: Optional[str] = Field(None, min_length=2, max_length=60)
    phone: Optional[str] = Field(None, max_length=20)


@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    tenant: TenantContext = Depends(get_tenant_context)
):
    """
    Returns the currently active organization for the authenticated user.
    Guaranteed to be tenant-isolated via cryptographic session verification.
    """
    org = tenant.organization
    return OrganizationResponse(
        id=str(org["_id"]),
        name=org["name"],
        slug=org["slug"],
        business_type=org["business_type"],
        role=tenant.role,
        created_at=org["created_at"].isoformat()
    )


@router.put("/current", response_model=OrganizationResponse)
async def update_current_organization(
    data: UpdateOrganizationRequest,
    tenant: TenantContext = Depends(require_owner),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Updates organization profile details.
    Restricted to ORGANIZATION_OWNER role only.
    """
    updates = {}
    if data.name:
        updates["name"] = data.name.strip()
    if data.business_type:
        updates["business_type"] = data.business_type.strip()
    if data.phone is not None:
        updates["phone"] = data.phone.strip()

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update."
        )

    await db.organizations.update_one(
        {"_id": tenant.organization_id},
        {"$set": updates}
    )

    updated_org = await db.organizations.find_one({"_id": tenant.organization_id})

    return OrganizationResponse(
        id=str(updated_org["_id"]),
        name=updated_org["name"],
        slug=updated_org["slug"],
        business_type=updated_org["business_type"],
        role=tenant.role,
        created_at=updated_org["created_at"].isoformat()
    )


@router.get("/current/members", response_model=List[OrganizationMemberResponse])
async def list_organization_members(
    tenant: TenantContext = Depends(get_tenant_context),
    db: AsyncDatabase = Depends(get_database)
):
    """
    Lists all members belonging to the authenticated user's organization.
    Queries are strictly scoped to tenant.organization_id.
    """
    memberships = await db.organization_memberships.find(
        {"organization_id": tenant.organization_id}
    ).to_list(length=100)

    member_responses = []
    for m in memberships:
        user = await db.users.find_one({"_id": m["user_id"]})
        if user:
            member_responses.append(
                OrganizationMemberResponse(
                    id=str(m["_id"]),
                    user_id=str(user["_id"]),
                    name=user["name"],
                    email=user["email"],
                    role=m["role"],
                    status=m["status"],
                    joined_at=m["created_at"].isoformat()
                )
            )

    return member_responses

