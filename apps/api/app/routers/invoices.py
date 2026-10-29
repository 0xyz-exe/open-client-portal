from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Invoice, InvoiceItem, Payment, Client, ClientContact, Organization, User, AuditLog
from app.schemas.schemas import InvoiceCreate, InvoiceOut, PaymentCreate, PaymentOut
from app.auth import get_current_user, get_current_org, require_agency_role

router = APIRouter(prefix="/invoices", tags=["Invoices & Payments"])

def calculate_invoice_totals(items: list, tax_rate: Decimal = Decimal("0.00"), discount_amount: Decimal = Decimal("0.00")):
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

@router.get("", response_model=List[InvoiceOut])
def list_invoices(
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice).filter(Invoice.organization_id == org.id)
    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact:
            return []
        query = query.filter(Invoice.client_id == contact.client_id)
    elif client_id:
        query = query.filter(Invoice.client_id == client_id)

    if status and status != "all":
        query = query.filter(Invoice.status == status)

    invoices = query.order_by(Invoice.created_at.desc()).all()
    for inv in invoices:
        inv.client_name = inv.client.name if inv.client else None
    return invoices

@router.post("", response_model=InvoiceOut)
def create_invoice(
    data: InvoiceCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.id == data.client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found in this organization")

    # Sequential invoice numbering: INV-YYYYMM-XXXX
    now = datetime.utcnow()
    count = db.query(Invoice).filter(Invoice.organization_id == org.id).count() + 1
    inv_number = f"INV-{now.strftime('%Y%m')}-{count:04d}"

    subtotal, tax_amount, total_amount = calculate_invoice_totals(
        data.items,
        data.tax_rate or Decimal("0.00"),
        data.discount_amount or Decimal("0.00")
    )

    invoice = Invoice(
        organization_id=org.id,
        client_id=client.id,
        project_id=data.project_id,
        invoice_number=inv_number,
        status="draft",
        issue_date=data.issue_date or datetime.utcnow(),
        due_date=data.due_date,
        subtotal=subtotal,
        tax_rate=data.tax_rate or Decimal("0.00"),
        tax_amount=tax_amount,
        discount_amount=data.discount_amount or Decimal("0.00"),
        total_amount=total_amount,
        paid_amount=Decimal("0.00"),
        balance_due=total_amount,
        currency=data.currency or client.currency or org.currency or "USD",
        notes=data.notes,
        payment_terms=data.payment_terms or "Payment due within 14 days of issue date via wire transfer."
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for idx, it in enumerate(data.items):
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=it.description,
            quantity=it.quantity,
            unit_price=it.unit_price,
            total_price=(Decimal(str(it.quantity)) * Decimal(str(it.unit_price))).quantize(Decimal("0.01")),
            order_index=idx
        )
        db.add(item)
    db.commit()
    db.refresh(invoice)

    invoice.client_name = client.name
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="invoice.created",
        resource_type="invoice",
        resource_id=str(invoice.id),
        metadata_json=f'{{"invoice_number": "{inv_number}", "total": "{total_amount}"}}'
    ))
    db.commit()
    return invoice

@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == org.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact or contact.client_id != invoice.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access this invoice")

    invoice.client_name = invoice.client.name if invoice.client else None
    return invoice

@router.post("/{invoice_id}/payments", response_model=PaymentOut)
def record_payment(
    invoice_id: int,
    data: PaymentCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == org.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    amount = Decimal(str(data.amount)).quantize(Decimal("0.01"))
    if amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    if invoice.status == "paid" or invoice.balance_due <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Invoice is already fully paid")

    if amount > invoice.balance_due:
        raise HTTPException(status_code=400, detail=f"Payment amount (${amount}) exceeds outstanding balance due (${invoice.balance_due})")

    # Atomic payment record and balance adjustment
    payment = Payment(
        invoice_id=invoice.id,
        organization_id=org.id,
        amount=amount,
        payment_method=data.payment_method or "bank_transfer",
        transaction_reference=data.transaction_reference,
        notes=data.notes,
        paid_at=datetime.utcnow()
    )
    db.add(payment)

    new_paid = (Decimal(str(invoice.paid_amount)) + amount).quantize(Decimal("0.01"))
    invoice.paid_amount = new_paid
    invoice.balance_due = (Decimal(str(invoice.total_amount)) - new_paid).quantize(Decimal("0.01"))

    if invoice.balance_due <= Decimal("0.00"):
        invoice.balance_due = Decimal("0.00")
        invoice.status = "paid"
    else:
        invoice.status = "partially_paid"

    invoice.updated_at = datetime.utcnow()
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="payment.recorded",
        resource_type="invoice",
        resource_id=str(invoice.id),
        metadata_json=f'{{"payment_amount": "{amount}", "new_balance": "{invoice.balance_due}"}}'
    ))
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/{invoice_id}/send", response_model=InvoiceOut)
def send_invoice(
    invoice_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == org.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "draft":
        invoice.status = "sent"
        invoice.updated_at = datetime.utcnow()
        db.add(AuditLog(
            organization_id=org.id,
            actor_id=current_user.id,
            actor_name=current_user.full_name,
            action="invoice.sent",
            resource_type="invoice",
            resource_id=str(invoice.id)
        ))
        db.commit()
        db.refresh(invoice)

    invoice.client_name = invoice.client.name if invoice.client else None
    return invoice
