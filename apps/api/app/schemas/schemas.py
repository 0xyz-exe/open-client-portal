from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    organization_name: Optional[str] = None  # If provided, creates initial org

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    global_role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Org Schemas
class OrgCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    branding_color: Optional[str] = "#4f46e5"
    currency: Optional[str] = "USD"
    timezone: Optional[str] = "UTC"

class OrgOut(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    branding_color: str
    timezone: str
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrgMemberOut(BaseModel):
    id: int
    user_id: int
    role: str
    user: UserOut

    class Config:
        from_attributes = True

class InviteMember(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "member"

# Client Schemas
class ClientContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    job_title: Optional[str] = None
    is_primary: bool = False

class ClientContactOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    job_title: Optional[str] = None
    is_primary: bool
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None
    currency: Optional[str] = "USD"
    notes: Optional[str] = None
    portal_enabled: bool = True
    contacts: Optional[List[ClientContactCreate]] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[str] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    portal_enabled: Optional[bool] = None

class ClientOut(BaseModel):
    id: int
    organization_id: int
    name: str
    company: Optional[str] = None
    email: str
    phone: Optional[str] = None
    website: Optional[str] = None
    billing_address: Optional[str] = None
    tax_id: Optional[str] = None
    status: str
    currency: str
    notes: Optional[str] = None
    portal_enabled: bool
    created_at: datetime
    contacts: List[ClientContactOut] = []

    class Config:
        from_attributes = True

# Project Schemas
class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "pending"
    order_index: Optional[int] = 0

class MilestoneOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str
    order_index: int

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    milestone_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    is_client_visible: bool = True
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    milestone_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    is_client_visible: Optional[bool] = None
    due_date: Optional[datetime] = None

class TaskOut(BaseModel):
    id: int
    project_id: int
    milestone_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    is_client_visible: bool
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DeliverableCreate(BaseModel):
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None

class DeliverableReview(BaseModel):
    status: str  # approved or rejected
    feedback: Optional[str] = None

class DeliverableOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    status: str
    client_feedback: Optional[str] = None
    submitted_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    client_id: int
    name: str
    description: Optional[str] = None
    status: Optional[str] = "planning"
    priority: Optional[str] = "medium"
    budget: Optional[Decimal] = Decimal("0.00")
    currency: Optional[str] = "USD"
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    budget: Optional[Decimal] = None
    currency: Optional[str] = None
    progress: Optional[int] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None

class ProjectOut(BaseModel):
    id: int
    organization_id: int
    client_id: int
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    budget: Decimal
    currency: str
    progress: int
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    created_at: datetime
    client_name: Optional[str] = None
    milestones: List[MilestoneOut] = []
    tasks: List[TaskOut] = []
    deliverables: List[DeliverableOut] = []

    class Config:
        from_attributes = True

# Proposal Schemas
class ProposalItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1.00")
    unit_price: Decimal = Decimal("0.00")

class ProposalItemOut(BaseModel):
    id: int
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True

class ProposalCreate(BaseModel):
    client_id: int
    title: str
    description: Optional[str] = None
    currency: Optional[str] = "USD"
    tax_rate: Optional[Decimal] = Decimal("0.00")
    discount_amount: Optional[Decimal] = Decimal("0.00")
    expires_at: Optional[datetime] = None
    items: List[ProposalItemCreate] = []

class ProposalAccept(BaseModel):
    accepted_by_name: str
    signature_data: Optional[str] = None

class ProposalOut(BaseModel):
    id: int
    organization_id: int
    client_id: int
    proposal_number: str
    title: str
    description: Optional[str] = None
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    status: str
    public_token: str
    expires_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    accepted_by_name: Optional[str] = None
    created_at: datetime
    items: List[ProposalItemOut] = []
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1.00")
    unit_price: Decimal = Decimal("0.00")

class InvoiceItemOut(BaseModel):
    id: int
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    amount: Decimal
    payment_method: Optional[str] = "bank_transfer"
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    amount: Decimal
    payment_method: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    paid_at: datetime

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    client_id: int
    project_id: Optional[int] = None
    issue_date: Optional[datetime] = None
    due_date: datetime
    tax_rate: Optional[Decimal] = Decimal("0.00")
    discount_amount: Optional[Decimal] = Decimal("0.00")
    currency: Optional[str] = "USD"
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    items: List[InvoiceItemCreate] = []

class InvoiceOut(BaseModel):
    id: int
    organization_id: int
    client_id: int
    project_id: Optional[int] = None
    invoice_number: str
    status: str
    issue_date: datetime
    due_date: datetime
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_due: Decimal
    currency: str
    notes: Optional[str] = None
    payment_terms: Optional[str] = None
    created_at: datetime
    items: List[InvoiceItemOut] = []
    payments: List[PaymentOut] = []
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentCreate(BaseModel):
    title: str
    file_name: str
    file_size: int
    mime_type: Optional[str] = "application/octet-stream"
    file_path: str
    category: Optional[str] = "general"
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    is_client_visible: bool = True

class DocumentOut(BaseModel):
    id: int
    title: str
    file_name: str
    file_size: int
    mime_type: str
    category: str
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    is_client_visible: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Comment Schemas
class CommentCreate(BaseModel):
    content: str
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    deliverable_id: Optional[int] = None
    is_internal: bool = False

class CommentOut(BaseModel):
    id: int
    author_id: int
    author_name: str
    content: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: int
    actor_name: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class AgencyDashboardStats(BaseModel):
    active_clients: int
    active_projects: int
    pending_approvals: int
    open_tasks: int
    total_revenue: Decimal
    unpaid_invoices_amount: Decimal
    recent_activity: List[AuditLogOut] = []

class ClientPortalDashboard(BaseModel):
    client_name: str
    active_projects_count: int
    pending_approvals_count: int
    outstanding_invoices_count: int
    outstanding_balance: Decimal
    projects: List[ProjectOut] = []
    deliverables_pending: List[DeliverableOut] = []
    invoices: List[InvoiceOut] = []

Token.model_rebuild()
