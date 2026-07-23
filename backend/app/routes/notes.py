from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.workspace import Member
from app.models.board import Board
from app.models.postit import Note
from app.schemas.postit import NoteCreate, NoteUpdate, NoteResponse
from app.routes.auth import get_current_user

router = APIRouter(tags=["notes"])


def verify_board_access(board_id: UUID, user_id: UUID, db: Session):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board non trouvé")
    membership = db.query(Member).filter(
        Member.workspace_id == board.workspace_id,
        Member.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return board


@router.get("/api/boards/{board_id}/notes", response_model=NoteResponse)
def get_board_note(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_board_access(board_id, current_user.id, db)

    note = db.query(Note).filter(
        Note.board_id == board_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        note = Note(
            board_id=board_id,
            user_id=current_user.id,
            content=""
        )
        db.add(note)
        db.commit()
        db.refresh(note)

    return note


@router.put("/api/boards/{board_id}/notes", response_model=NoteResponse)
def update_board_note(
    board_id: UUID,
    data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_board_access(board_id, current_user.id, db)

    note = db.query(Note).filter(
        Note.board_id == board_id,
        Note.user_id == current_user.id
    ).first()

    if not note:
        note = Note(
            board_id=board_id,
            user_id=current_user.id,
            content=data.content
        )
        db.add(note)
    else:
        note.content = data.content

    db.commit()
    db.refresh(note)

    return note


@router.get("/api/boards/{board_id}/notes/all", response_model=list[NoteResponse])
def list_board_notes(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_board_access(board_id, current_user.id, db)

    notes = db.query(Note).filter(Note.board_id == board_id).all()
    return notes
