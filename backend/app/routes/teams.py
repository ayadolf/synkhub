from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.workspace import Member, Workspace
from app.schemas.workspace import MemberResponse
from app.routes.auth import get_current_user

router = APIRouter()


@router.get("/api/workspaces/{workspace_id}/members", response_model=list[MemberResponse])
def list_members(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(Member).filter(
        Member.workspace_id == UUID(workspace_id),
        Member.user_id == current_user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")

    members = db.query(Member).filter(Member.workspace_id == UUID(workspace_id)).all()
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append(MemberResponse(
                id=m.id,
                user_id=m.user_id,
                username=user.username,
                email=user.email,
                role=m.role,
                status="online" if str(m.user_id) == str(current_user.id) else "offline",
                avatar_url=user.avatar_url,
                joined_at=m.joined_at,
            ))
    return result


@router.post("/api/workspaces/{workspace_id}/members", response_model=MemberResponse)
def add_member(
    workspace_id: str,
    email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.id == UUID(workspace_id)).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    admin = db.query(Member).filter(
        Member.workspace_id == UUID(workspace_id),
        Member.user_id == current_user.id,
        Member.role == "admin",
    ).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Only admins can add members")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with this email")

    existing = db.query(Member).filter(
        Member.workspace_id == UUID(workspace_id),
        Member.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = Member(workspace_id=UUID(workspace_id), user_id=user.id, role="member")
    db.add(member)
    db.commit()
    db.refresh(member)

    return MemberResponse(
        id=member.id,
        user_id=member.user_id,
        username=user.username,
        email=user.email,
        role=member.role,
        status="offline",
        joined_at=member.joined_at,
    )


@router.patch("/api/members/{member_id}/role")
def update_role(
    member_id: str,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if role not in ("admin", "member", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    member = db.query(Member).filter(Member.id == UUID(member_id)).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    admin = db.query(Member).filter(
        Member.workspace_id == member.workspace_id,
        Member.user_id == current_user.id,
        Member.role == "admin",
    ).first()
    if not admin:
        raise HTTPException(status_code=403, detail="Only admins can change roles")

    member.role = role
    db.commit()
    return {"message": "Role updated"}


@router.delete("/api/members/{member_id}")
def remove_member(
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == UUID(member_id)).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    admin = db.query(Member).filter(
        Member.workspace_id == member.workspace_id,
        Member.user_id == current_user.id,
        Member.role == "admin",
    ).first()
    if not admin and str(member.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(member)
    db.commit()
    return {"message": "Member removed"}
