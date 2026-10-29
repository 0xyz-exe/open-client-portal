import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Proposal, ProposalItem, Client, ClientContact, Organization, User, AuditLog
from app.schemas.schemas import ProposalCreate, ProposalOut, ProposalAccept
from app.auth import get_current_user, get_current_org, require_agency_role

router = APIRouter(prefix="/proposals", tags=["Proposals & Contracts"])

def calculate_proposal_totals(items: list, tax_rate: Decimal = Decimal("0.00"), discount_amount: Decimal = Decimal("0.00")):
    subtotal = Decimal("0.00")
    for item in items:
        qty = Decimal(str(item.quantity))
        price = Decimal(str(item.unit_price))
        subtotal += qty * price

    tax_rate = Decimal(str(tax_rate))
    discount_amount = Decimal(str(discount_amount))
    tax_amount = (subtotal * (tax_rate / Decimal("100.00"))).quantize(Decimal("0.01"))
    total_amount = (subtotal + tax_amount - discount_amount).quantize(Decimal("0.01"))
    if total_amount < Decimal("0.00"):
        total_amount = Decimal("0.00")
    return subtotal, tax_amount, total_amount

@router.get("", response_model=List[ProposalOut])
def list_proposals(
    client_id: Optional[int] = None,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Proposal).filter(Proposal.organization_id == org.id)
    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact:
            return []
        query = query.filter(Proposal.client_id == contact.client_id)
    elif client_id:
        query = query.filter(Proposal.client_id == client_id)

    proposals = query.order_by(Proposal.created_at.desc()).all()
    for p in proposals:
        p.client_name = p.client.name if p.client else None
    return proposals

@router.post("", response_model=ProposalOut)
def create_proposal(
    data: ProposalCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == data.client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found in this organization")

    # Generate sequential proposal number: PROP-YYYYMM-XXXX
    now = datetime.utcnow()
    count = db.query(Proposal).filter(Proposal.organization_id == org.id).count() + 1
    prop_number = f"PROP-{now.strftime('%Y%m')}-{count:04d}"

    subtotal, tax_amount, total_amount = calculate_proposal_totals(
        data.items, 
        data.tax_rate or Decimal("0.00"), 
        data.discount_amount or Decimal("0.00")
    )

    public_token = f"prop-{uuid.uuid4().hex}"

    proposal = Proposal(
        organization_id=org.id,
        client_id=client.id,
        proposal_number=prop_number,
        title=data.title,
        description=data.description,
        subtotal=subtotal,
        tax_rate=data.tax_rate or Decimal("0.00"),
        tax_amount=tax_amount,
        discount_amount=data.discount_amount or Decimal("0.00"),
        total_amount=total_amount,
        currency=data.currency or client.currency or org.currency or "USD",
        status="draft",
        public_token=public_token,
        expires_at=data.expires_at
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    for idx, it in enumerate(data.items):
        item = ProposalItem(
            proposal_id=proposal.id,
            description=it.description,
            quantity=it.quantity,
            unit_price=it.unit_price,
            total_price=(Decimal(str(it.quantity)) * Decimal(str(it.unit_price))).quantize(Decimal("0.01")),
            order_index=idx
        )
        db.add(item)
    db.commit()
    db.refresh(proposal)

    proposal.client_name = client.name
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="proposal.created",
        resource_type="proposal",
        resource_id=str(proposal.id),
        metadata_json=f'{{"proposal_number": "{prop_number}", "total": "{total_amount}"}}'
    ))
    db.commit()
    return proposal

@router.get("/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.organization_id == org.id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact or contact.client_id != proposal.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access this proposal")

    proposal.client_name = proposal.client.name if proposal.client else None
    return proposal

@router.post("/{proposal_id}/send", response_model=ProposalOut)
def send_proposal(
    proposal_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.organization_id == org.id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal.status = "sent"
    proposal.updated_at = datetime.utcnow()
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="proposal.sent",
        resource_type="proposal",
        resource_id=str(proposal.id)
    ))
    db.commit()
    db.refresh(proposal)
    proposal.client_name = proposal.client.name if proposal.client else None
    return proposal

@router.get("/public/{token}", response_model=ProposalOut)
def get_public_proposal(token: str, db: Session = Depends(get_db)):
    proposal = db.query(Proposal).filter(Proposal.public_token == token).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or invalid link")

    if proposal.status == "sent":
        proposal.status = "viewed"
        db.commit()
        db.refresh(proposal)

    proposal.client_name = proposal.client.name if proposal.client else None
    return proposal

@router.post("/public/{token}/accept", response_model=ProposalOut)
def accept_public_proposal(token: str, data: ProposalAccept, db: Session = Depends(get_db)):
    proposal = db.query(Proposal).filter(Proposal.public_token == token).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or invalid link")

    if proposal.status == "accepted":
        raise HTTPException(status_code=400, detail="Proposal is already accepted")

    proposal.status = "accepted"
    proposal.accepted_at = datetime.utcnow()
    proposal.accepted_by_name = data.accepted_by_name
    proposal.signature_data = data.signature_data

    db.add(AuditLog(
        organization_id=proposal.organization_id,
        actor_name=data.accepted_by_name,
        action="proposal.accepted",
        resource_type="proposal",
        resource_id=str(proposal.id),
        metadata_json=f'{{"accepted_by": "{data.accepted_by_name}"}}'
    ))
    db.commit()
    db.refresh(proposal)
    proposal.client_name = proposal.client.name if proposal.client else None
    return proposal
