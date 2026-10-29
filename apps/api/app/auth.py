from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.models import User, OrganizationMember, Organization, ClientContact, Client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_org(
    x_organization_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Organization:
    # If client user, find their client contact's organization
    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact or not contact.client:
            raise HTTPException(status_code=403, detail="Client user has no associated client profile")
        org = db.query(Organization).filter(Organization.id == contact.client.organization_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    # If agency user, check organization membership
    org_id = None
    if x_organization_id and x_organization_id.isdigit():
        org_id = int(x_organization_id)
    
    if org_id:
        membership = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Forbidden: You do not belong to this organization")
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    # Fallback to first org user belongs to
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    return membership.organization

def require_agency_role(allowed_roles: list[str] = ["owner", "admin", "manager", "member"]):
    def dependency(
        current_user: User = Depends(get_current_user),
        org: Organization = Depends(get_current_org),
        db: Session = Depends(get_db)
    ):
        if current_user.global_role == "client":
            raise HTTPException(status_code=403, detail="Agency staff access required")
        
        member = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == current_user.id
        ).first()
        if not member or member.role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Insufficient permissions. Required roles: {allowed_roles}")
        return member
    return dependency

def get_client_portal_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.global_role != "client":
        raise HTTPException(status_code=403, detail="Client portal user access required")
    contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
    if not contact or not contact.client:
        raise HTTPException(status_code=403, detail="No client account associated with this user")
    return contact.client
