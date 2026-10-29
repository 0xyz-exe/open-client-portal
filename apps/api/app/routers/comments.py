from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Comment, Project, Task, Deliverable, Organization, User, ClientContact
from app.schemas.schemas import CommentCreate, CommentOut
from app.auth import get_current_user, get_current_org

router = APIRouter(prefix="/comments", tags=["Discussions & Comments"])

@router.get("", response_model=List[CommentOut])
def list_comments(
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    deliverable_id: Optional[int] = None,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Comment).filter(Comment.organization_id == org.id)

    # Resolve client context if client user
    client_contact = None
    if current_user.global_role == "client":
        client_contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not client_contact:
            raise HTTPException(status_code=403, detail="Forbidden: No associated client record found")

    # Target resource validation
    if project_id:
        project = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if client_contact and project.client_id != client_contact.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access comments on this project")
        query = query.filter(Comment.project_id == project_id)

    if task_id:
        task = db.query(Task).join(Project).filter(Task.id == task_id, Project.organization_id == org.id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if client_contact:
            if task.project.client_id != client_contact.client_id or not task.is_client_visible:
                raise HTTPException(status_code=403, detail="Forbidden: You cannot access comments on this task")
        query = query.filter(Comment.task_id == task_id)

    if deliverable_id:
        deliverable = db.query(Deliverable).join(Project).filter(
            Deliverable.id == deliverable_id, 
            Project.organization_id == org.id
        ).first()
        if not deliverable:
            raise HTTPException(status_code=404, detail="Deliverable not found")
        if client_contact and deliverable.project.client_id != client_contact.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access comments on this deliverable")
        query = query.filter(Comment.deliverable_id == deliverable_id)

    # If no target specified and user is client, strictly limit to their projects
    if not project_id and not task_id and not deliverable_id and client_contact:
        client_project_ids = [p.id for p in db.query(Project.id).filter(Project.client_id == client_contact.client_id).all()]
        query = query.filter(Comment.project_id.in_(client_project_ids))

    # CRITICAL SECURITY FILTER: Clients cannot see internal agency notes
    if current_user.global_role == "client":
        query = query.filter(Comment.is_internal == False)

    return query.order_by(Comment.created_at.asc()).all()

@router.post("", response_model=CommentOut)
def create_comment(
    data: CommentCreate,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.project_id and not data.task_id and not data.deliverable_id:
        raise HTTPException(status_code=400, detail="Comment must be associated with a project, task, or deliverable")

    client_contact = None
    if current_user.global_role == "client":
        client_contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not client_contact:
            raise HTTPException(status_code=403, detail="Forbidden: No associated client record found")

    target_project_id = data.project_id

    # Verify project
    if data.project_id:
        project = db.query(Project).filter(Project.id == data.project_id, Project.organization_id == org.id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if client_contact and project.client_id != client_contact.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot comment on this project")

    # Verify task
    if data.task_id:
        task = db.query(Task).join(Project).filter(Task.id == data.task_id, Project.organization_id == org.id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if client_contact:
            if task.project.client_id != client_contact.client_id or not task.is_client_visible:
                raise HTTPException(status_code=403, detail="Forbidden: You cannot comment on this task")
        target_project_id = task.project_id

    # Verify deliverable
    if data.deliverable_id:
        deliv = db.query(Deliverable).join(Project).filter(
            Deliverable.id == data.deliverable_id,
            Project.organization_id == org.id
        ).first()
        if not deliv:
            raise HTTPException(status_code=404, detail="Deliverable not found")
        if client_contact and deliv.project.client_id != client_contact.client_id:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot comment on this deliverable")
        target_project_id = deliv.project_id

    # Enforce internal flag
    is_internal = data.is_internal
    if current_user.global_role == "client":
        is_internal = False  # Client comments are always client-visible

    comment = Comment(
        organization_id=org.id,
        project_id=target_project_id,
        task_id=data.task_id,
        deliverable_id=data.deliverable_id,
        author_id=current_user.id,
        author_name=current_user.full_name,
        content=data.content,
        is_internal=is_internal
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
