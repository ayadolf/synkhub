from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog, DataProcessing
from app.routes.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/audit", tags=["audit"])


class DataProcessingCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    purpose: str = Field(..., min_length=1)
    legal_basis: str = Field(..., min_length=1, max_length=100)
    data_categories: str = Field(..., min_length=1)
    retention_period: str = Field(..., min_length=1, max_length=100)
    recipients: Optional[str] = None


class DataProcessingUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    purpose: Optional[str] = Field(None, min_length=1)
    legal_basis: Optional[str] = Field(None, min_length=1, max_length=100)
    data_categories: Optional[str] = Field(None, min_length=1)
    retention_period: Optional[str] = Field(None, min_length=1, max_length=100)
    recipients: Optional[str] = None


def log_action(db: Session, user_id, action: str, target_type: str = None,
               target_id=None, details: dict = None, ip_address: str = None,
               user_agent: str = None):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    db.commit()
    return entry


@router.get("/logs")
def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    action: str = None,
    user_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == UUID(user_id))

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "logs": [
            {
                "id": str(log.id),
                "user_id": str(log.user_id) if log.user_id else None,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": str(log.target_id) if log.target_id else None,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


@router.get("/stats")
def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    total = db.query(AuditLog).count()
    actions = db.query(
        AuditLog.action, func.count(AuditLog.id)
    ).group_by(AuditLog.action).all()

    return {
        "total_logs": total,
        "by_action": {action: count for action, count in actions},
    }


@router.get("/processings")
def get_data_processings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    processings = db.query(DataProcessing).order_by(DataProcessing.created_at.desc()).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "purpose": p.purpose,
            "legal_basis": p.legal_basis,
            "data_categories": p.data_categories,
            "retention_period": p.retention_period,
            "recipients": p.recipients,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in processings
    ]


@router.post("/processings", status_code=status.HTTP_201_CREATED)
def create_data_processing(
    data: DataProcessingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    processing = DataProcessing(
        name=data.name,
        purpose=data.purpose,
        legal_basis=data.legal_basis,
        data_categories=data.data_categories,
        retention_period=data.retention_period,
        recipients=data.recipients,
    )
    db.add(processing)
    db.commit()
    db.refresh(processing)

    log_action(
        db=db,
        user_id=current_user.id,
        action="processing:create",
        target_type="data_processing",
        target_id=processing.id,
        details={"name": processing.name},
        ip_address=None,
    )

    return {
        "id": str(processing.id),
        "name": processing.name,
        "purpose": processing.purpose,
        "legal_basis": processing.legal_basis,
        "data_categories": processing.data_categories,
        "retention_period": processing.retention_period,
        "recipients": processing.recipients,
        "created_at": processing.created_at.isoformat() if processing.created_at else None,
    }


@router.put("/processings/{processing_id}")
def update_data_processing(
    processing_id: UUID,
    data: DataProcessingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    processing = db.query(DataProcessing).filter(DataProcessing.id == processing_id).first()
    if not processing:
        raise HTTPException(status_code=404, detail="Traitement non trouvé")

    if data.name is not None:
        processing.name = data.name
    if data.purpose is not None:
        processing.purpose = data.purpose
    if data.legal_basis is not None:
        processing.legal_basis = data.legal_basis
    if data.data_categories is not None:
        processing.data_categories = data.data_categories
    if data.retention_period is not None:
        processing.retention_period = data.retention_period
    if data.recipients is not None:
        processing.recipients = data.recipients

    db.commit()
    db.refresh(processing)

    log_action(
        db=db,
        user_id=current_user.id,
        action="processing:update",
        target_type="data_processing",
        target_id=processing.id,
        details={"name": processing.name},
        ip_address=None,
    )

    return {
        "id": str(processing.id),
        "name": processing.name,
        "purpose": processing.purpose,
        "legal_basis": processing.legal_basis,
        "data_categories": processing.data_categories,
        "retention_period": processing.retention_period,
        "recipients": processing.recipients,
        "created_at": processing.created_at.isoformat() if processing.created_at else None,
    }


@router.delete("/processings/{processing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_processing(
    processing_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    processing = db.query(DataProcessing).filter(DataProcessing.id == processing_id).first()
    if not processing:
        raise HTTPException(status_code=404, detail="Traitement non trouvé")

    log_action(
        db=db,
        user_id=current_user.id,
        action="processing:delete",
        target_type="data_processing",
        target_id=processing.id,
        details={"name": processing.name},
        ip_address=None,
    )

    db.delete(processing)
    db.commit()
    return None
