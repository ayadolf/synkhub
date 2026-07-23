from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.workspace import Member, Workspace
from app.models.board import Board
from app.models.postit import Postit, Vote, Comment
from app.models.audit import AuditLog
from app.schemas.postit import (
    PostitCreate, PostitUpdate, PostitMove, PostitResponse,
    VoteResponse, CommentCreate, CommentResponse
)
from app.routes.auth import get_current_user
from app.services.websocket_manager import manager

router = APIRouter(tags=["postits"])


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


def get_postit_with_counts(postit: Postit, db: Session, user_id: UUID = None) -> dict:
    vote_count = db.query(func.count(Vote.id)).filter(Vote.postit_id == postit.id).scalar()
    comment_count = db.query(func.count(Comment.id)).filter(Comment.postit_id == postit.id).scalar()
    user_has_voted = False
    if user_id:
        user_has_voted = db.query(Vote).filter(
            Vote.postit_id == postit.id,
            Vote.user_id == user_id
        ).first() is not None
    author = db.query(User).filter(User.id == postit.author_id).first()
    return PostitResponse(
        id=postit.id,
        board_id=postit.board_id,
        author_id=postit.author_id,
        author_name=str(author.username) if author else "",
        author_avatar_url=str(author.avatar_url) if author and author.avatar_url else None,
        content=postit.content,
        color=postit.color,
        x_pos=postit.x_pos,
        y_pos=postit.y_pos,
        width=postit.width,
        height=postit.height,
        z_index=postit.z_index,
        priority=postit.priority,
        status=postit.status,
        created_at=postit.created_at,
        updated_at=postit.updated_at,
        vote_count=vote_count,
        comment_count=comment_count,
        user_has_voted=user_has_voted
    )


@router.get("/api/boards/{board_id}/postits", response_model=list[PostitResponse])
def list_postits(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_board_access(board_id, current_user.id, db)

    postits = db.query(Postit).filter(Postit.board_id == board_id).all()
    return [get_postit_with_counts(p, db, current_user.id) for p in postits]


@router.post("/api/boards/{board_id}/postits", response_model=PostitResponse)
def create_postit(
    request: Request,
    board_id: UUID,
    data: PostitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_board_access(board_id, current_user.id, db)

    max_z = db.query(func.max(Postit.z_index)).filter(Postit.board_id == board_id).scalar() or 0

    postit = Postit(
        board_id=board_id,
        author_id=current_user.id,
        content=data.content,
        color=data.color,
        x_pos=data.x_pos,
        y_pos=data.y_pos,
        width=data.width,
        height=data.height,
        z_index=max_z + 1,
        priority=data.priority,
        status=data.status
    )
    db.add(postit)
    db.commit()
    db.refresh(postit)

    db.add(AuditLog(
        user_id=current_user.id,
        action="postit:create",
        target_type="postit",
        target_id=postit.id,
        details={"board_id": str(board_id), "content": data.content[:100]},
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()

    return get_postit_with_counts(postit, db, current_user.id)


@router.patch("/api/postits/{postit_id}", response_model=PostitResponse)
def update_postit(
    postit_id: UUID,
    data: PostitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    verify_board_access(postit.board_id, current_user.id, db)

    if data.content is not None:
        postit.content = data.content
    if data.color is not None:
        postit.color = data.color
    if data.width is not None:
        postit.width = data.width
    if data.height is not None:
        postit.height = data.height
    if data.priority is not None:
        postit.priority = data.priority
    if data.status is not None:
        postit.status = data.status

    db.commit()
    db.refresh(postit)

    return get_postit_with_counts(postit, db, current_user.id)


@router.patch("/api/postits/{postit_id}/move", response_model=PostitResponse)
async def move_postit(
    postit_id: UUID,
    data: PostitMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    verify_board_access(postit.board_id, current_user.id, db)

    postit.x_pos = data.x_pos
    postit.y_pos = data.y_pos
    if data.z_index is not None:
        postit.z_index = data.z_index

    db.commit()
    db.refresh(postit)

    # Broadcaster le mouvement via WebSocket
    await manager.broadcast(str(postit.board_id), {
        "type": "postit:moved",
        "data": {
            "postit_id": str(postit.id),
            "x": postit.x_pos,
            "y": postit.y_pos,
            "z_index": postit.z_index
        }
    })

    return get_postit_with_counts(postit, db, current_user.id)


@router.patch("/api/postits/{postit_id}/resize", response_model=PostitResponse)
async def resize_postit(
    postit_id: UUID,
    width: float,
    height: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    verify_board_access(postit.board_id, current_user.id, db)

    postit.width = width
    postit.height = height
    db.commit()
    db.refresh(postit)

    # Broadcaster le redimensionnement via WebSocket
    await manager.broadcast(str(postit.board_id), {
        "type": "postit:resized",
        "data": {
            "postit_id": str(postit.id),
            "width": width,
            "height": height
        }
    })

    return get_postit_with_counts(postit, db, current_user.id)


@router.delete("/api/postits/{postit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_postit(
    postit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    verify_board_access(postit.board_id, current_user.id, db)

    db.delete(postit)
    db.commit()
    return None


@router.post("/api/postits/{postit_id}/vote", response_model=PostitResponse)
async def vote_postit(
    request: Request,
    postit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    verify_board_access(postit.board_id, current_user.id, db)

    existing_vote = db.query(Vote).filter(
        Vote.postit_id == postit_id,
        Vote.user_id == current_user.id
    ).first()

    if existing_vote:
        db.delete(existing_vote)
        action = "postit:unvote"
    else:
        vote = Vote(postit_id=postit_id, user_id=current_user.id)
        db.add(vote)
        action = "postit:vote"

    db.commit()
    db.refresh(postit)

    vote_count = db.query(func.count(Vote.id)).filter(Vote.postit_id == postit_id).scalar()

    db.add(AuditLog(
        user_id=current_user.id,
        action=action,
        target_type="postit",
        target_id=postit_id,
        details={"vote_count": vote_count},
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()

    await manager.broadcast(str(postit.board_id), {
        "type": "vote:toggled",
        "data": {
            "postit_id": str(postit_id),
            "user_id": str(current_user.id),
            "vote_count": vote_count
        }
    })

    return get_postit_with_counts(postit, db, current_user.id)


@router.get("/api/postits/{postit_id}/comments", response_model=list[CommentResponse])
def list_comments(
    postit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    verify_board_access(postit.board_id, current_user.id, db)

    comments = db.query(Comment).filter(Comment.postit_id == postit_id).all()
    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()
        result.append(CommentResponse(
            id=c.id,
            postit_id=c.postit_id,
            author_id=c.author_id,
            author_name=str(author.username) if author else "User",
            author_avatar_url=str(author.avatar_url) if author and author.avatar_url else None,
            content=c.content,
            created_at=c.created_at,
        ))
    return result


@router.post("/api/postits/{postit_id}/comments", response_model=CommentResponse)
async def create_comment(
    request: Request,
    postit_id: UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    postit = db.query(Postit).filter(Postit.id == postit_id).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Post-it non trouvé")

    comment = Comment(
        postit_id=postit_id,
        author_id=current_user.id,
        content=data.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    db.add(AuditLog(
        user_id=current_user.id,
        action="postit:comment",
        target_type="postit",
        target_id=postit_id,
        details={"content": data.content[:100]},
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()

    return CommentResponse(
        id=comment.id,
        postit_id=comment.postit_id,
        author_id=comment.author_id,
        author_name=str(current_user.username),
        author_avatar_url=str(current_user.avatar_url) if current_user.avatar_url else None,
        content=comment.content,
        created_at=comment.created_at,
    )


@router.put("/api/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire non trouvé")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres commentaires")

    comment.content = data.content
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        postit_id=comment.postit_id,
        author_id=comment.author_id,
        author_name=str(current_user.username),
        author_avatar_url=str(current_user.avatar_url) if current_user.avatar_url else None,
        content=comment.content,
        created_at=comment.created_at,
    )


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire non trouvé")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres commentaires")

    postit = db.query(Postit).filter(Postit.id == comment.postit_id).first()
    db.delete(comment)
    db.commit()

    if postit:
        postit.comment_count = max(0, (postit.comment_count or 1) - 1)
        db.commit()

    return None


@router.get("/api/workspaces/{workspace_id}/postits/all", response_model=list[PostitResponse])
def list_workspace_postits(
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

    boards = db.query(Board).filter(Board.workspace_id == UUID(workspace_id)).all()
    board_ids = [b.id for b in boards]

    postits = db.query(Postit).filter(Postit.board_id.in_(board_ids)).order_by(Postit.created_at.desc()).all()
    return [get_postit_with_counts(p, db, current_user.id) for p in postits]


@router.post("/api/postits/{postit_id}/vote", response_model=PostitResponse)
async def vote_postit(
    postit_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    postit = db.query(Postit).filter(Postit.id == UUID(postit_id)).first()
    if not postit:
        raise HTTPException(status_code=404, detail="Postit not found")

    verify_board_access(postit.board_id, current_user.id, db)

    existing = db.query(Vote).filter(
        Vote.postit_id == UUID(postit_id),
        Vote.user_id == current_user.id,
    ).first()

    if existing:
        db.delete(existing)
    else:
        vote = Vote(postit_id=UUID(postit_id), user_id=current_user.id)
        db.add(vote)

    db.commit()
    db.refresh(postit)
    
    vote_count = db.query(func.count(Vote.id)).filter(Vote.postit_id == UUID(postit_id)).scalar()
    
    # Broadcaster le vote
    await manager.broadcast(str(postit.board_id), {
        "type": "vote:toggled",
        "data": {
            "postit_id": postit_id,
            "user_id": str(current_user.id),
            "vote_count": vote_count
        }
    })
    
    return get_postit_with_counts(postit, db, current_user.id)
