from sqlalchemy import Column, String, DateTime, Text, Float, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Postit(Base):
    __tablename__ = "postits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    color = Column(String(7), default="#FBBF24")
    x_pos = Column(Float, default=0)
    y_pos = Column(Float, default=0)
    width = Column(Float, default=200)
    height = Column(Float, default=150)
    z_index = Column(Integer, default=0)
    priority = Column(String(20), default="Medium")
    status = Column(String(20), default="Draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    board = relationship("Board", back_populates="postits")
    author = relationship("User", backref="postits")
    votes = relationship("Vote", back_populates="postit", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="postit", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("postit_id", "user_id", name="uq_vote_postit_user"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    postit_id = Column(UUID(as_uuid=True), ForeignKey("postits.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    postit = relationship("Postit", back_populates="votes")
    user = relationship("User", backref="votes")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    postit_id = Column(UUID(as_uuid=True), ForeignKey("postits.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    postit = relationship("Postit", back_populates="comments")
    author = relationship("User", backref="comments")


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    board = relationship("Board", back_populates="notes")
    user = relationship("User", backref="notes")
