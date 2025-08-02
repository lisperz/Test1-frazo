"""
WebSocket implementation for real-time job updates
"""

from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends, HTTPException
from typing import Dict, List, Set
import json
import uuid
import asyncio
import logging
from datetime import datetime

from backend.models.database import get_database
from backend.models.user import User
from backend.auth.jwt_handler import JWTHandler

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user ID
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_user_map: Dict[WebSocket, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection for a user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_user_map[websocket] = user_id
        
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        user_id = self.connection_user_map.get(websocket)
        if user_id:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            del self.connection_user_map[websocket]
            logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to all connections for a specific user"""
        if user_id in self.active_connections:
            connections_to_remove = set()
            
            for websocket in self.active_connections[user_id].copy():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"Failed to send message to websocket: {e}")
                    connections_to_remove.add(websocket)
            
            # Remove failed connections
            for websocket in connections_to_remove:
                self.active_connections[user_id].discard(websocket)
                self.connection_user_map.pop(websocket, None)
    
    async def send_job_update(self, user_id: str, job_id: str, update_data: dict):
        """Send job-specific update to user"""
        message = {
            "type": "job_update",
            "job_id": job_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": update_data
        }
        await self.send_personal_message(user_id, message)
    
    async def send_system_message(self, user_id: str, message_type: str, content: str):
        """Send system message to user"""
        message = {
            "type": "system_message",
            "message_type": message_type,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.send_personal_message(user_id, message)
    
    def get_connected_users(self) -> List[str]:
        """Get list of currently connected user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_connected(self, user_id: str) -> bool:
        """Check if user has active connections"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

# Global connection manager instance
manager = ConnectionManager()

# Router for WebSocket endpoints
websocket_router = APIRouter()

async def authenticate_websocket(websocket: WebSocket, token: str) -> User:
    """Authenticate WebSocket connection using JWT token"""
    try:
        payload = JWTHandler.decode_token(token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id or token_type != "access":
            await websocket.close(code=4001, reason="Invalid token")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database (simplified for WebSocket)
        # In a real implementation, you'd check the database
        return User(id=uuid.UUID(user_id))
        
    except Exception as e:
        await websocket.close(code=4001, reason="Authentication failed")
        raise HTTPException(status_code=401, detail="Authentication failed")

@websocket_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time updates
    """
    try:
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="Token required")
            return
        
        # Authenticate user
        try:
            authenticated_user = await authenticate_websocket(websocket, token)
            
            # Verify user ID matches token
            if str(authenticated_user.id) != user_id:
                await websocket.close(code=4003, reason="User ID mismatch")
                return
                
        except Exception:
            return  # Connection already closed in authenticate_websocket
        
        # Accept connection
        await manager.connect(websocket, user_id)
        
        # Send welcome message
        await manager.send_system_message(
            user_id, 
            "connection_established", 
            "Connected to real-time updates"
        )
        
        try:
            # Keep connection alive and handle incoming messages
            while True:
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    await handle_websocket_message(user_id, message)
                except json.JSONDecodeError:
                    await manager.send_system_message(
                        user_id,
                        "error",
                        "Invalid JSON message"
                    )
                except Exception as e:
                    logger.error(f"Error handling WebSocket message: {e}")
                    await manager.send_system_message(
                        user_id,
                        "error", 
                        "Error processing message"
                    )
        
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {user_id}")
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {e}")
        finally:
            manager.disconnect(websocket)
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        try:
            await websocket.close(code=4000, reason="Internal error")
        except:
            pass

async def handle_websocket_message(user_id: str, message: dict):
    """Handle incoming WebSocket messages from client"""
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await manager.send_system_message(user_id, "pong", "Connection alive")
    
    elif message_type == "subscribe_job":
        # Subscribe to updates for a specific job
        job_id = message.get("job_id")
        if job_id:
            await manager.send_system_message(
                user_id,
                "subscribed",
                f"Subscribed to updates for job {job_id}"
            )
    
    elif message_type == "get_status":
        # Request current status of all user jobs
        await send_current_job_statuses(user_id)
    
    else:
        await manager.send_system_message(
            user_id,
            "error",
            f"Unknown message type: {message_type}"
        )

async def send_current_job_statuses(user_id: str):
    """Send current status of all user jobs"""
    try:
        from backend.models.database import SessionLocal
        from backend.models.job import VideoJob
        
        db = SessionLocal()
        try:
            jobs = db.query(VideoJob).filter(
                VideoJob.user_id == uuid.UUID(user_id)
            ).order_by(VideoJob.created_at.desc()).limit(10).all()
            
            job_statuses = []
            for job in jobs:
                job_statuses.append({
                    "id": str(job.id),
                    "status": job.status,
                    "progress": job.progress_percentage,
                    "message": job.progress_message,
                    "filename": job.original_filename
                })
            
            await manager.send_personal_message(user_id, {
                "type": "job_statuses",
                "jobs": job_statuses,
                "timestamp": datetime.utcnow().isoformat()
            })
            
        finally:
            db.close()
    
    except Exception as e:
        logger.error(f"Error sending job statuses: {e}")
        await manager.send_system_message(
            user_id,
            "error",
            "Failed to retrieve job statuses"
        )

# Helper functions for sending updates (used by Celery tasks)
def send_job_update(user_id: str, job_id: str, update_data: dict):
    """Send job update (synchronous wrapper for async function)"""
    if manager.is_user_connected(user_id):
        asyncio.create_task(manager.send_job_update(user_id, job_id, update_data))

def send_system_notification(user_id: str, message_type: str, content: str):
    """Send system notification (synchronous wrapper for async function)"""
    if manager.is_user_connected(user_id):
        asyncio.create_task(manager.send_system_message(user_id, message_type, content))

def broadcast_maintenance_message(message: str):
    """Broadcast maintenance message to all connected users"""
    for user_id in manager.get_connected_users():
        asyncio.create_task(manager.send_system_message(user_id, "maintenance", message))

# Health check endpoint for WebSocket service
@websocket_router.get("/ws/health")
async def websocket_health():
    """WebSocket service health check"""
    return {
        "status": "healthy",
        "connected_users": len(manager.get_connected_users()),
        "total_connections": sum(len(connections) for connections in manager.active_connections.values())
    }