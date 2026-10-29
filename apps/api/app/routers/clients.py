import secrets
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Client, ClientContact, Organization, User, AuditLog
from app.schemas.schemas import ClientCreate, ClientUpdate, ClientOut, ClientContactCreate, ClientContactOut
from app.auth import get_current_user, get_current_org, require_agency_role, get_password_hash

router = APIRouter(prefix="/clients", tags=["Clients CRM"])

@router.get("", response_model=List[ClientOut])
def list_clients(
    search: Optional[str] = None,
    status: Optional[str] = None,
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    query = db.query(Client).filter(Client.organization_id == org.id)
    if search:
        s = f"%{search}%"
        query = query.filter((Client.name.ilike(s)) | (Client.company.ilike(s)) | (Client.email.ilike(s)))
    if status and status != "all":
        query = query.filter(Client.status == status)
    return query.order_by(Client.created_at.desc()).all()

@router.post("", response_model=ClientOut)
def create_client(
    data: ClientCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    client = Client(
        organization_id=org.id,
        name=data.name,
        company=data.company,
        email=data.email.lower(),
        phone=data.phone,
        website=data.website,
        billing_address=data.billing_address,
        tax_id=data.tax_id,
        currency=data.currency or org.currency or "USD",
        notes=data.notes,
        portal_enabled=data.portal_enabled
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    if data.contacts:
        for c in data.contacts:
            contact = ClientContact(
                client_id=client.id,
                name=c.name,
                email=c.email.lower(),
                phone=c.phone,
                job_title=c.job_title,
                is_primary=c.is_primary
            )
            db.add(contact)
        db.commit()
        db.refresh(client)

    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="client.created",
        resource_type="client",
        resource_id=str(client.id),
        metadata_json=f'{{"name": "{client.name}", "email": "{client.email}"}}'
    ))
    db.commit()
    return client

@router.get("/{client_id}", response_model=ClientOut)
def get_client(
    client_id: int,
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    data: ClientUpdate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(client, field, value)

    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="client.updated",
        resource_type="client",
        resource_id=str(client.id)
    ))
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}")
def archive_client(
    client_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.status = "archived"
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="client.archived",
        resource_type="client",
        resource_id=str(client.id)
    ))
    db.commit()
    return {"message": "Client archived successfully"}

@router.post("/{client_id}/contacts", response_model=ClientContactOut)
def add_client_contact(
    client_id: int,
    data: ClientContactCreate,
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    contact = ClientContact(
        client_id=client.id,
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        job_title=data.job_title,
        is_primary=data.is_primary
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.post("/{client_id}/invite-portal")
def invite_to_client_portal(
    client_id: int,
    contact_email: str = Query(...),
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Find contact
    contact = db.query(ClientContact).filter(
        ClientContact.client_id == client.id,
        ClientContact.email == contact_email.lower()
    ).first()
    if not contact:
        # Create contact if not present
        contact = ClientContact(
            client_id=client.id,
            name=client.name,
            email=contact_email.lower(),
            is_primary=True
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)

    # Check or create user
    user = db.query(User).filter(User.email == contact.email).first()
    temp_password = f"CP_{secrets.token_urlsafe(8)}!"
    if not user:
        user = User(
            email=contact.email,
            hashed_password=get_password_hash(temp_password),
            full_name=contact.name,
            global_role="client",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    contact.user_id = user.id
    client.portal_enabled = True

    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="client.portal_invited",
        resource_type="client",
        resource_id=str(client.id),
        metadata_json=f'{{"email": "{contact.email}", "user_id": {user.id}}}'
    ))
    db.commit()

    return {
        "message": f"Client portal access enabled for {contact.email}",
        "credentials": {
            "email": contact.email,
            "temporary_password": temp_password,
            "login_url": "/portal/login"
        }
    }
