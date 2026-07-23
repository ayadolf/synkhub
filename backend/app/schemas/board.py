from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class BoardCreate(BaseModel):
    title: str


class BoardResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    author_name: Optional[str] = ""
    author_avatar_url: Optional[str] = None
    title: str
    created_at: datetime

    class Config:
        from_attributes = True
