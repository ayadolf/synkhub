from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager
from app.database import SessionLocal
from app.models.postit import Postit, Vote, Comment
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
from sqlalchemy import func
from uuid import UUID
from datetime import datetime

router = APIRouter(tags=["websocket"])


async def verify_ws_token(token: str) -> str | None:
    """Valide le JWT token WebSocket et retourne le user_id ou None."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None


def postit_to_dict(postit, db):
    vote_count = db.query(func.count(Vote.id)).filter(Vote.postit_id == postit.id).scalar()
    comment_count = db.query(func.count(Comment.id)).filter(Comment.postit_id == postit.id).scalar()
    return {
        "id": str(postit.id),
        "board_id": str(postit.board_id),
        "author_id": str(postit.author_id),
        "content": postit.content,
        "color": postit.color,
        "x_pos": postit.x_pos,
        "y_pos": postit.y_pos,
        "width": postit.width,
        "height": postit.height,
        "z_index": postit.z_index,
        "priority": postit.priority,
        "status": postit.status,
        "created_at": postit.created_at.isoformat() if postit.created_at else None,
        "updated_at": postit.updated_at.isoformat() if postit.updated_at else None,
        "vote_count": vote_count,
        "comment_count": comment_count,
    }


@router.websocket("/ws/{board_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    board_id: str,
    token: str = Query(None),
    user_id: str = Query(None),
    username: str = Query(None)
):
    # Authentification JWT obligatoire
    verified_user_id = await verify_ws_token(token)
    if not verified_user_id:
        await websocket.close(code=4001, reason="Token invalide")
        return

    # Utiliser le user_id du token (pas celui du query param)
    user_id = verified_user_id

    await manager.connect(websocket, board_id, user_id, username)
    
    connected_users = manager.get_connected_users(board_id)
    await manager.send_personal(websocket, {
        "type": "users:current",
        "data": {"users": connected_users}
    })
    
    if user_id:
        await manager.broadcast(board_id, {
            "type": "user:joined",
            "data": {
                "user_id": user_id,
                "username": username or "User",
                "timestamp": datetime.utcnow().isoformat(),
                "connected_count": manager.get_connected_count(board_id)
            }
        })
    
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            event_data = data.get("data", {})
            
            if event_type == "cursor:move":
                x = event_data.get("x", 0)
                y = event_data.get("y", 0)
                manager.update_cursor(board_id, user_id, x, y)
                await manager.broadcast(board_id, {
                    "type": "cursor:moved",
                    "data": {
                        "user_id": user_id,
                        "username": username or "User",
                        "x": x,
                        "y": y
                    }
                })
                continue
            
            elif event_type == "postit:moved":
                await manager.broadcast(board_id, {
                    "type": "postit:moved",
                    "data": event_data,
                    "user_id": user_id
                })
                continue
            
            elif event_type == "postit:created":
                await manager.broadcast(board_id, {
                    "type": "postit:created",
                    "data": event_data,
                    "user_id": user_id
                })
                continue
            
            elif event_type == "postit:updated":
                await manager.broadcast(board_id, {
                    "type": "postit:updated",
                    "data": event_data,
                    "user_id": user_id
                })
                continue
            
            elif event_type == "postit:deleted":
                await manager.broadcast(board_id, {
                    "type": "postit:deleted",
                    "data": event_data,
                    "user_id": user_id
                })
                continue
            
            elif event_type == "vote:toggled":
                await manager.broadcast(board_id, {
                    "type": "vote:toggled",
                    "data": event_data,
                    "user_id": user_id
                })
                continue
            
            elif event_type == "comment:added":
                await manager.broadcast(board_id, {
                    "type": "comment:added",
                    "data": event_data,
                    "user_id": user_id
                })
                continue
            
            elif event_type == "ping":
                await manager.send_personal(websocket, {"type": "pong", "timestamp": datetime.utcnow().isoformat()})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, board_id, user_id)
        
        if user_id:
            await manager.broadcast(board_id, {
                "type": "user:left",
                "data": {
                    "user_id": user_id,
                    "username": username or "User",
                    "timestamp": datetime.utcnow().isoformat(),
                    "connected_count": manager.get_connected_count(board_id)
                }
            })
