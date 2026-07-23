import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, Member
from app.models.invitation import Invitation
from app.services.email import send_invitation_email
from app.routes.auth import get_current_user

router = APIRouter(tags=["invitations"])


@router.post("/api/workspaces/{workspace_id}/invite")
def invite_member(
    workspace_id: str,
    email: str,
    role: str = "member",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_uuid = UUID(workspace_id)
    workspace = db.query(Workspace).filter(Workspace.id == ws_uuid).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    admin = db.query(Member).filter(
        Member.workspace_id == ws_uuid,
        Member.user_id == current_user.id,
        Member.role == "admin",
    ).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    existing_member = db.query(Member).join(User).filter(
        Member.workspace_id == ws_uuid,
        User.email == email,
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member")

    existing_invite = db.query(Invitation).filter(
        Invitation.workspace_id == ws_uuid,
        Invitation.email == email,
        Invitation.status == "pending",
    ).first()
    if existing_invite:
        raise HTTPException(status_code=400, detail="Invitation already sent to this email")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = Invitation(
        workspace_id=ws_uuid,
        email=email,
        role=role,
        token=token,
        invited_by=current_user.id,
        expires_at=expires_at,
    )
    db.add(invitation)
    db.commit()

    send_invitation_email(
        to_email=email,
        workspace_name=workspace.name,
        invited_by=current_user.username,
        token=token,
    )

    return {"message": f"Invitation sent to {email}"}


@router.get("/api/invitations/{token}")
def get_invitation(token: str, db: Session = Depends(get_db)):
    invitation = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == "pending",
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or expired")

    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation expired")

    workspace = db.query(Workspace).filter(Workspace.id == invitation.workspace_id).first()
    inviter = db.query(User).filter(User.id == invitation.invited_by).first()

    return {
        "email": invitation.email,
        "role": invitation.role,
        "workspace_name": workspace.name if workspace else "Unknown",
        "invited_by": inviter.username if inviter else "Unknown",
    }


@router.post("/api/invitations/{token}/accept")
def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invitation = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == "pending",
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation expired")

    if invitation.email != current_user.email:
        raise HTTPException(status_code=403, detail="This invitation is for a different email")

    existing = db.query(Member).filter(
        Member.workspace_id == invitation.workspace_id,
        Member.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already a member")

    member = Member(
        workspace_id=invitation.workspace_id,
        user_id=current_user.id,
        role=invitation.role,
    )
    db.add(member)

    invitation.status = "accepted"
    db.commit()

    return {"message": "Invitation accepted", "workspace_id": str(invitation.workspace_id)}
