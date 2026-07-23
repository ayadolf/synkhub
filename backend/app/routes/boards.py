from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace, Member
from app.models.board import Board
from app.schemas.board import BoardCreate, BoardResponse
from app.routes.auth import get_current_user

router = APIRouter(tags=["boards"])


def verify_workspace_access(workspace_id: UUID, user_id: UUID, db: Session):
    membership = db.query(Member).filter(
        Member.workspace_id == workspace_id,
        Member.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Accès refusé au workspace")
    return membership


def board_to_response(board: Board, db: Session) -> BoardResponse:
    author = db.query(User).filter(User.id == board.author_id).first() if board.author_id else None
    return BoardResponse(
        id=board.id,
        workspace_id=board.workspace_id,
        author_name=author.username if author else "",
        author_avatar_url=author.avatar_url if author else None,
        title=board.title,
        created_at=board.created_at,
    )


@router.get("/api/workspaces/{workspace_id}/boards", response_model=list[BoardResponse])
def list_boards(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_workspace_access(workspace_id, current_user.id, db)
    boards = db.query(Board).filter(Board.workspace_id == workspace_id).all()
    return [board_to_response(b, db) for b in boards]


@router.post("/api/workspaces/{workspace_id}/boards", response_model=BoardResponse)
def create_board(
    workspace_id: UUID,
    data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_workspace_access(workspace_id, current_user.id, db)

    board = Board(
        workspace_id=workspace_id,
        author_id=current_user.id,
        title=data.title
    )
    db.add(board)
    db.commit()
    db.refresh(board)

    return board_to_response(board, db)


@router.get("/api/boards/{board_id}", response_model=BoardResponse)
def get_board(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board non trouvé")

    verify_workspace_access(board.workspace_id, current_user.id, db)
    return board_to_response(board, db)


@router.delete("/api/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board non trouvé")

    verify_workspace_access(board.workspace_id, current_user.id, db)

    db.delete(board)
    db.commit()
    return None


@router.put("/api/boards/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: UUID,
    data: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seul un admin peut modifier le nom du board")

    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board non trouvé")

    verify_workspace_access(board.workspace_id, current_user.id, db)

    board.title = data.title
    db.commit()
    db.refresh(board)
    return board_to_response(board, db)
