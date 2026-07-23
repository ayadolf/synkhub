from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import manager
from app.config import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
from datetime import datetime

router = APIRouter(tags=["global_ws"])

GLOBAL_BOARD_ID = "__global__"


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


@router.websocket("/ws/global")
async def global_websocket(
    websocket: WebSocket,
    token: str = Query(None),
    user_id: str = Query(None),
    username: str = Query(None)
):
    # Authentification JWT obligatoire
    verified_user_id = await verify_ws_token(token)
    if not verified_user_id:
        await websocket.close(code=4001, reason="Token invalide")
        return

    user_id = verified_user_id

    await manager.connect(websocket, GLOBAL_BOARD_ID, user_id, username)

    current_users = manager.get_connected_users(GLOBAL_BOARD_ID)
    await manager.send_personal(websocket, {
        "type": "users:list",
        "data": {"users": current_users}
    })

    if user_id:
        await manager.broadcast(GLOBAL_BOARD_ID, {
            "type": "user:online",
            "data": {
                "user_id": user_id,
                "username": username or "User",
                "timestamp": datetime.utcnow().isoformat()
            }
        })

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await manager.send_personal(websocket, {"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, GLOBAL_BOARD_ID, user_id)
        if user_id:
            await manager.broadcast(GLOBAL_BOARD_ID, {
                "type": "user:offline",
                "data": {
                    "user_id": user_id,
                    "username": username or "User",
                    "timestamp": datetime.utcnow().isoformat()
                }
            })
