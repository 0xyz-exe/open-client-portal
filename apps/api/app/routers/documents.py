import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.models import Document, ClientContact, Organization, User, AuditLog, Client, Project
from app.schemas.schemas import DocumentOut
from app.auth import get_current_user, get_current_org, require_agency_role

router = APIRouter(prefix="/documents", tags=["Documents & File Management"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[DocumentOut])
def list_documents(
    category: Optional[str] = None,
    client_id: Optional[int] = None,
    project_id: Optional[int] = None,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.organization_id == org.id)

    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact:
            return []
        query = query.filter(Document.client_id == contact.client_id, Document.is_client_visible == True)
    else:
        if client_id:
            query = query.filter(Document.client_id == client_id)

    if project_id:
        query = query.filter(Document.project_id == project_id)
    if category and category != "all":
        query = query.filter(Document.category == category)

    return query.order_by(Document.created_at.desc()).all()

@router.post("", response_model=DocumentOut)
async def upload_document(
    title: str = Form(...),
    category: str = Form("general"),
    is_client_visible: bool = Form(True),
    client_id: Optional[int] = Form(None),
    project_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _role = Depends(require_agency_role(["owner", "admin", "manager", "member"])),
    db: Session = Depends(get_db)
):
    # Verify client_id if passed
    if client_id:
        c = db.query(Client).filter(Client.id == client_id, Client.organization_id == org.id).first()
        if not c:
            raise HTTPException(status_code=400, detail="Client not found in this organization")

    # Verify project_id if passed
    if project_id:
        p = db.query(Project).filter(Project.id == project_id, Project.organization_id == org.id).first()
        if not p:
            raise HTTPException(status_code=400, detail="Project not found in this organization")

    # Sanitize file name to prevent path traversal
    raw_name = file.filename or "upload.bin"
    file_name = os.path.basename(raw_name)
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # generate safe path
    import uuid
    safe_name = f"{uuid.uuid4().hex}_{file_name}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    doc = Document(
        organization_id=org.id,
        client_id=client_id,
        project_id=project_id,
        title=title,
        file_name=file_name,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        file_path=save_path,
        category=category,
        is_client_visible=is_client_visible,
        uploaded_by_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    db.add(AuditLog(
        organization_id=org.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        action="document.uploaded",
        resource_type="document",
        resource_id=str(doc.id),
        metadata_json=f'{{"title": "{doc.title}", "file_name": "{doc.file_name}"}}'
    ))
    db.commit()
    return doc

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.organization_id == org.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.global_role == "client":
        contact = db.query(ClientContact).filter(ClientContact.user_id == current_user.id).first()
        if not contact or contact.client_id != doc.client_id or not doc.is_client_visible:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot download this file")

    real_path = os.path.abspath(doc.file_path)
    upload_root = os.path.abspath(settings.UPLOAD_DIR)
    if not real_path.startswith(upload_root) or not os.path.exists(real_path):
        raise HTTPException(status_code=404, detail="File content not found on server storage")

    return FileResponse(
        path=real_path,
        filename=doc.file_name,
        media_type=doc.mime_type
    )
