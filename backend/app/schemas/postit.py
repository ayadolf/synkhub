from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class PostitCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Contenu du post-it (1-2000 caractères)")
    color: str = "#FBBF24"
    x_pos: float = 0
    y_pos: float = 0
    width: float = 200
    height: float = 150
    priority: str = "Medium"
    status: str = "Draft"


class PostitUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    color: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class PostitMove(BaseModel):
    x_pos: float
    y_pos: float
    z_index: Optional[int] = None


class PostitResponse(BaseModel):
    id: UUID
    board_id: UUID
    author_id: UUID
    author_name: str = ""
    author_avatar_url: Optional[str] = None
    content: str
    color: str
    x_pos: float
    y_pos: float
    width: float
    height: float
    z_index: int
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    vote_count: int = 0
    comment_count: int = 0
    user_has_voted: bool = False

    class Config:
        from_attributes = True


class VoteResponse(BaseModel):
    id: UUID
    postit_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Contenu du commentaire (1-1000 caractères)")


class CommentResponse(BaseModel):
    id: UUID
    postit_id: UUID
    author_id: UUID
    author_name: str = ""
    author_avatar_url: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    content: str = ""


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: UUID
    board_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
