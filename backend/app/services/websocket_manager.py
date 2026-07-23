from typing import Set, Dict, Any
from fastapi import WebSocket
import json
from datetime import datetime
import uuid

class WebSocketManager:
    """Gère les connexions WebSocket et les broadcasts entre clients"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_connections: Dict[tuple, WebSocket] = {}
        self.user_info: Dict[tuple, dict] = {}
        self.cursors: Dict[str, Dict[str, dict]] = {}
    
    async def connect(self, websocket: WebSocket, board_id: str, user_id: str = None, username: str = None):
        await websocket.accept()
        
        if board_id not in self.active_connections:
            self.active_connections[board_id] = set()
        
        self.active_connections[board_id].add(websocket)
        
        if user_id:
            self.user_connections[(board_id, user_id)] = websocket
            self.user_info[(board_id, user_id)] = {
                "user_id": user_id,
                "username": username or "User",
                "x": 0,
                "y": 0
            }
            if board_id not in self.cursors:
                self.cursors[board_id] = {}
            self.cursors[board_id][user_id] = self.user_info[(board_id, user_id)]
    
    def disconnect(self, websocket: WebSocket, board_id: str, user_id: str = None):
        if board_id in self.active_connections:
            self.active_connections[board_id].discard(websocket)
            
            if not self.active_connections[board_id]:
                del self.active_connections[board_id]
                if board_id in self.cursors:
                    del self.cursors[board_id]
        
        if user_id and (board_id, user_id) in self.user_connections:
            del self.user_connections[(board_id, user_id)]
        if user_id and (board_id, user_id) in self.user_info:
            del self.user_info[(board_id, user_id)]
        if board_id in self.cursors and user_id in self.cursors.get(board_id, {}):
            del self.cursors[board_id][user_id]
    
    def update_cursor(self, board_id: str, user_id: str, x: float, y: float):
        if board_id in self.cursors and user_id in self.cursors[board_id]:
            self.cursors[board_id][user_id]["x"] = x
            self.cursors[board_id][user_id]["y"] = y
    
    def get_cursors(self, board_id: str, exclude_user: str = None) -> list:
        if board_id not in self.cursors:
            return []
        return [
            info for uid, info in self.cursors[board_id].items()
            if uid != exclude_user
        ]
    
    async def broadcast(self, board_id: str, message: dict):
        if board_id not in self.active_connections:
            return
        
        disconnected = []
        connections = list(self.active_connections[board_id])
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        
        if board_id in self.active_connections:
            for conn in disconnected:
                self.active_connections[board_id].discard(conn)
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Erreur envoi message personnel: {e}")
    
    def get_connected_count(self, board_id: str) -> int:
        return len(self.active_connections.get(board_id, set()))
    
    def get_connected_users(self, board_id: str) -> list:
        if board_id not in self.user_info:
            return []
        return list(self.user_info[board_id].values())


manager = WebSocketManager()
