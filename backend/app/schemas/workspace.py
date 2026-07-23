from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class MemberBase(BaseModel):
    user_id: UUID
    role: str = "member"


class MemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    username: str
    email: str
    role: str
    status: str = "offline"
    avatar_url: Optional[str] = None
    joined_at: datetime

    class Config:
        from_attributes = True


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    owner_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class WorkspaceDetail(WorkspaceResponse):
    members: list[MemberResponse] = []
