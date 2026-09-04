from fastapi import WebSocket
from typing import Dict, List, Set
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        # meeting_id -> set of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # meeting_id -> dict mapping connection to participant info
        self.connection_info: Dict[str, Dict[WebSocket, dict]] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str):
        await websocket.accept()
        
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
            self.connection_info[meeting_id] = {}

        self.active_connections[meeting_id].append(websocket)
        
        logger.info(f"Client connected to meeting {meeting_id}. Total: {len(self.active_connections[meeting_id])}")

    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].remove(websocket)
            
            if meeting_id in self.connection_info:
                self.connection_info[meeting_id].pop(websocket, None)

            if len(self.active_connections[meeting_id]) == 0:
                del self.active_connections[meeting_id]
                del self.connection_info[meeting_id]

            logger.info(f"Client disconnected from meeting {meeting_id}")

    async def broadcast(self, meeting_id: str, data: dict):
        if meeting_id not in self.active_connections:
            return

        message = json.dumps(data)
        disconnected = []

        for connection in self.active_connections[meeting_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection, meeting_id)

    async def send_personal(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast_to_others(
        self, 
        websocket: WebSocket, 
        meeting_id: str, 
        data: dict
    ):
        if meeting_id not in self.active_connections:
            return

        message = json.dumps(data)
        disconnected = []

        for connection in self.active_connections[meeting_id]:
            if connection != websocket:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message: {e}")
                    disconnected.append(connection)

        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection, meeting_id)

    def get_active_participants(self, meeting_id: str) -> int:
        if meeting_id in self.active_connections:
            return len(self.active_connections[meeting_id])
        return 0

    def set_connection_info(
        self, 
        websocket: WebSocket, 
        meeting_id: str, 
        info: dict
    ):
        if meeting_id in self.connection_info:
            self.connection_info[meeting_id][websocket] = info

    def get_connection_info(
        self, 
        websocket: WebSocket, 
        meeting_id: str
    ) -> dict:
        if (
            meeting_id in self.connection_info 
            and websocket in self.connection_info[meeting_id]
        ):
            return self.connection_info[meeting_id][websocket]
        return {}


websocket_manager = WebSocketManager()