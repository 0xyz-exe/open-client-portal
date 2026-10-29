from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Organization, OrganizationMember, AuditLog
from app.schemas.schemas import UserRegister, UserLogin, UserOut, Token, OrgCreate, OrgOut, InviteMember, OrgMemberOut
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_org

router = APIRouter(prefix="/auth", tags=["Authentication & Organizations"])

@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        global_role="owner" if data.organization_name else "member",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if data.organization_name:
        slug = data.organization_name.lower().replace(" ", "-").replace(".", "")
        # ensure unique slug
        base_slug = slug
        count = 1
        while db.query(Organization).filter(Organization.slug == slug).first():
            slug = f"{base_slug}-{count}"
            count += 1

        org = Organization(
            name=data.organization_name,
            slug=slug,
            branding_color="#4f46e5"
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        member = OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            role="owner"
        )
        db.add(member)

        # Audit log
        db.add(AuditLog(
            organization_id=org.id,
            actor_id=user.id,
            actor_name=user.full_name,
            action="organization.created",
            resource_type="organization",
            resource_id=str(org.id)
        ))
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.global_role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.global_role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/organizations", response_model=list[OrgOut])
def list_user_organizations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(OrganizationMember).filter(OrganizationMember.user_id == current_user.id).all()
    return [m.organization for m in memberships]

@router.post("/organizations", response_model=OrgOut)
def create_organization(data: OrgCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    slug = (data.slug or data.name).lower().replace(" ", "-")
    base_slug = slug
    count = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{count}"
        count += 1

    org = Organization(
        name=data.name,
        slug=slug,
        branding_color=data.branding_color or "#4f46e5",
        currency=data.currency or "USD",
        timezone=data.timezone or "UTC"
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    member = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(member)
    db.commit()
    return org

@router.get("/team", response_model=list[OrgMemberOut])
def get_team_members(org: Organization = Depends(get_current_org), db: Session = Depends(get_db)):
    return db.query(OrganizationMember).filter(OrganizationMember.organization_id == org.id).all()

@router.post("/team/invite")
def invite_team_member(
    data: InviteMember, 
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user already exists
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        # Create user with initial password
        user = User(
            email=data.email.lower(),
            hashed_password=get_password_hash("Password123!"),
            full_name=data.full_name,
            global_role=data.role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    existing_member = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == org.id,
        OrganizationMember.user_id == user.id
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this organization")

    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role=data.role
    )
    db.add(member)
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="team.invited",
        resource_type="user",
        resource_id=str(user.id),
        metadata_json=f'{{"email": "{data.email}", "role": "{data.role}"}}'
    ))
    db.commit()
    return {"message": f"Successfully invited {data.email} as {data.role}", "user_id": user.id}
