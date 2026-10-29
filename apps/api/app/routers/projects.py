from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Project, Milestone, Task, Deliverable, Organization, User, AuditLog, Client, ClientContact
from app.schemas.schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut, MilestoneCreate, MilestoneOut,
    TaskCreate, TaskUpdate, TaskOut, DeliverableCreate, DeliverableReview, DeliverableOut
)
from app.auth import get_current_user, get_current_org, require_agency_role

router = APIRouter(prefix="/projects", tags=["Projects, Milestones, Tasks & Deliverables"])

@router.get("", response_model=List[ProjectOut])
def list_projects(
    search: Optional[str] = None,
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.organization_id == org.id)

    # Client role isolation
    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact:
            return []
        query = query.filter(Project.client_id == contact.client_id)
    elif client_id:
        query = query.filter(Project.client_id == client_id)

    if search:
        s = f"%{search}%"
        query = query.filter((Project.name.ilike(s)) | (Project.description.ilike(s)))
    if status and status != "all":
        query = query.filter(Project.status == status)

    projects = query.order_by(Project.created_at.desc()).all()
    
    # Populate client_name & filter client-visible tasks if client
    for p in projects:
        p.client_name = p.client.name if p.client else None
        if current_user.global_role == "client":
            p.tasks = [t for t in p.tasks if t.is_client_visible]

    return projects

@router.post("", response_model=ProjectOut)
def create_project(
    data: ProjectCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    # Verify client belongs to org
    client = db.query(Client).filter(Client.id == data.client_id, Client.organization_id == org.id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found in this organization")

    project = Project(
        organization_id=org.id,
        client_id=client.id,
        name=data.name,
        description=data.description,
        status=data.status or "planning",
        priority=data.priority or "medium",
        budget=data.budget or 0,
        currency=data.currency or client.currency or org.currency or "USD",
        start_date=data.start_date,
        target_date=data.target_date,
        progress=0
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    project.client_name = client.name
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="project.created",
        resource_type="project",
        resource_id=str(project.id),
        metadata_json=f'{{"name": "{project.name}", "client_id": {client.id}}}'
    ))
    db.commit()
    return project

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Client isolation check
    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact or contact.client_id != project.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access this project")
        project.tasks = [t for t in project.tasks if t.is_client_visible]

    project.client_name = project.client.name if project.client else None
    return project

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(project, field, value)

    project.updated_at = datetime.utcnow()
    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="project.updated",
        resource_type="project",
        resource_id=str(project.id)
    ))
    db.commit()
    db.refresh(project)
    project.client_name = project.client.name if project.client else None
    return project

@router.post("/{project_id}/milestones", response_model=MilestoneOut)
def add_milestone(
    project_id: int,
    data: MilestoneCreate,
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager"])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestone = Milestone(
        project_id=project.id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        status=data.status or "pending",
        order_index=data.order_index or 0
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone

@router.post("/{project_id}/tasks", response_model=TaskOut)
def add_task(
    project_id: int,
    data: TaskCreate,
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = Task(
        project_id=project.id,
        milestone_id=data.milestone_id,
        assigned_user_id=data.assigned_user_id,
        title=data.title,
        description=data.description,
        status=data.status or "todo",
        priority=data.priority or "medium",
        is_client_visible=data.is_client_visible,
        due_date=data.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    data: TaskUpdate,
    org: Organization = Depends(get_current_org),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    task = db.query(Task).join(Project).filter(Task.id == task_id, Project.organization_id == org.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task

@router.post("/{project_id}/deliverables", response_model=DeliverableOut)
def submit_deliverable(
    project_id: int,
    data: DeliverableCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    deliverable = Deliverable(
        project_id=project.id,
        title=data.title,
        description=data.description,
        file_url=data.file_url,
        status="pending_review",
        submitted_by_id=current_user.id
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)

    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="deliverable.submitted",
        resource_type="deliverable",
        resource_id=str(deliverable.id),
        metadata_json=f'{{"title": "{deliverable.title}", "project_id": {project.id}}}'
    ))
    db.commit()
    return deliverable

@router.post("/deliverables/{deliverable_id}/review", response_model=DeliverableOut)
def review_deliverable(
    deliverable_id: int,
    data: DeliverableReview,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deliverable = db.query(Deliverable).join(Project).filter(
        Deliverable.id == deliverable_id,
        Project.organization_id == org.id
    ).first()
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    # If client, verify project belongs to this client
    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact or contact.client_id != deliverable.project.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot review this deliverable")

    if data.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be approved or rejected")

    deliverable.status = data.status
    deliverable.client_feedback = data.feedback
    if data.status == "approved":
        deliverable.approved_at = datetime.utcnow()

    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action=f"deliverable.{data.status}",
        resource_type="deliverable",
        resource_id=str(deliverable.id),
        metadata_json=f'{{"status": "{data.status}", "feedback": "{data.feedback or ""}"}}'
    ))
    db.commit()
    db.refresh(deliverable)
    return deliverable
