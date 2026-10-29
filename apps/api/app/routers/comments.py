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

    if project_id:
        query = query.filter(Comment.project_id == project_id)
    if task_id:
        query = query.filter(Comment.task_id == task_id)
    if deliverable_id:
        query = query.filter(Comment.deliverable_id == deliverable_id)

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
    # Enforce internal flag
    is_internal = data.is_internal
    if current_user.global_role == "client":
        is_internal = False  # Client comments are always client-visible

    comment = Comment(
        organization_id=org.id,
        project_id=data.project_id,
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
