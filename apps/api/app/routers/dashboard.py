from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import (
    Client, Project, Task, Deliverable, Invoice, Payment, AuditLog, 
    Notification, Organization, User, ClientContact
)
from app.schemas.schemas import AgencyDashboardStats, ClientPortalDashboard, AuditLogOut, NotificationOut, ProjectOut, DeliverableOut, InvoiceOut
from app.auth import get_current_user, get_current_org, require_agency_role

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Activity"])

@router.get("/stats", response_model=AgencyDashboardStats)
def get_agency_dashboard_stats(
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    active_clients = db.query(Client).filter(Client.organization_id == org.id, Client.status == "active").count()
    active_projects = db.query(Project).filter(
        Project.organization_id == org.id, 
        Project.status.in_(["planning", "in_progress", "in_review"])
    ).count()
    pending_approvals = db.query(Deliverable).join(Project).filter(
        Project.organization_id == org.id,
        Deliverable.status == "pending_review"
    ).count()
    open_tasks = db.query(Task).join(Project).filter(
        Project.organization_id == org.id,
        Task.status.in_(["todo", "in_progress", "in_review"])
    ).count()

    # Total collected revenue
    revenue_res = db.query(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).filter(
        Payment.organization_id == org.id
    ).scalar()
    total_revenue = Decimal(str(revenue_res or 0))

    # Unpaid invoices balance due
    unpaid_res = db.query(func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00"))).filter(
        Invoice.organization_id == org.id,
        Invoice.status.in_(["sent", "partially_paid", "overdue"])
    ).scalar()
    unpaid_amount = Decimal(str(unpaid_res or 0))

    recent_logs = db.query(AuditLog).filter(
        AuditLog.organization_id == org.id
    ).order_by(AuditLog.created_at.desc()).limit(10).all()

    return {
        "active_clients": active_clients,
        "active_projects": active_projects,
        "pending_approvals": pending_approvals,
        "open_tasks": open_tasks,
        "total_revenue": total_revenue,
        "unpaid_invoices_amount": unpaid_amount,
        "recent_activity": recent_logs
    }

@router.get("/client-portal", response_model=ClientPortalDashboard)
def get_client_portal_dashboard(
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db)
):
    if current_user.global_role != "client":
        raise HTTPException(status_code=403, detail="Client role required")

    contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
    if not contact or not contact.client:
        raise HTTPException(status_code=404, detail="Client account not found")

    client = contact.client

    # Projects
    projects = db.query(Project).filter(
        Project.organization_id == org.id,
        Project.client_id == client.id
    ).all()
    for p in projects:
        p.client_name = client.name
        p.tasks = [t for t in p.tasks if t.is_client_visible]

    # Pending deliverables
    deliverables = db.query(Deliverable).join(Project).filter(
        Project.client_id == client.id,
        Deliverable.status == "pending_review"
    ).all()

    # Invoices
    invoices = db.query(Invoice).filter(
        Invoice.organization_id == org.id,
        Invoice.client_id == client.id
    ).order_by(Invoice.created_at.desc()).all()
    for inv in invoices:
        inv.client_name = client.name

    outstanding_balance = sum((Decimal(str(inv.balance_due)) for inv in invoices if inv.status in ["sent", "partially_paid", "overdue"]), Decimal("0.00"))
    outstanding_invoices_count = len([inv for inv in invoices if inv.status in ["sent", "partially_paid", "overdue"]])

    return {
        "client_name": client.name,
        "active_projects_count": len([p for p in projects if p.status in ["planning", "in_progress", "in_review"]]),
        "pending_approvals_count": len(deliverables),
        "outstanding_invoices_count": outstanding_invoices_count,
        "outstanding_balance": outstanding_balance,
        "projects": projects,
        "deliverables_pending": deliverables,
        "invoices": invoices
    }

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).filter(AuditLog.organization_id == org.id).order_by(AuditLog.created_at.desc()).limit(50).all()

@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.organization_id == org.id,
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}
