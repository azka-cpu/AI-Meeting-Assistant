

import uuid
import json
import tempfile
import os
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from dotenv import load_dotenv

from app.database import get_db
from app.models import Meeting, Transcript, Participant, User
from app.websocket import websocket_manager

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter(tags=["webrtc"])


def decode_token(token: str) -> str:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    user_id = payload.get("sub")
    if not user_id:
        raise JWTError("No sub claim")
    return user_id


async def send_to_peer(meeting_id: str, target_user_id: str, data: dict):
    """
    Finds a specific peer's WebSocket by user_id within this meeting
    and sends them a message directly — used for WebRTC offer/answer/
    ice-candidate, which must go to ONE specific peer, not everyone.
    """
    connections = websocket_manager.active_connections.get(meeting_id, [])
    for conn in connections:
        info = websocket_manager.get_connection_info(conn, meeting_id)
        if info.get("user_id") == target_user_id:
            await websocket_manager.send_personal(conn, data)
            return


@router.websocket("/ws/webrtc/{meeting_id}")
async def webrtc_signaling(websocket: WebSocket, meeting_id: str, token: str):
    """
    Browsers can't send custom headers on a WebSocket connection, so
    the JWT is passed as a query param:
      ws://localhost:8000/ws/webrtc/{meeting_id}?token=eyJhbGc...
    """
    db: Session = next(get_db())

    try:
        user_id = decode_token(token)
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    await websocket_manager.connect(websocket, meeting_id)
    websocket_manager.set_connection_info(
        websocket, meeting_id, {"user_id": user_id, "name": user.name}
    )

    # Tell everyone else already in the room a new peer joined —
    # they'll each initiate a WebRTC offer to the newcomer.
    await websocket_manager.broadcast_to_others(
        websocket,
        meeting_id,
        {"type": "peer-joined", "peer_id": user_id, "peer_name": user.name},
    )

    # Tell the newcomer who's already here
    existing_peers = []
    for conn in websocket_manager.active_connections.get(meeting_id, []):
        if conn is websocket:
            continue
        info = websocket_manager.get_connection_info(conn, meeting_id)
        if info:
            existing_peers.append({"peer_id": info["user_id"], "peer_name": info["name"]})

    await websocket_manager.send_personal(
        websocket, {"type": "room-state", "peers": existing_peers}
    )

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            message["from"] = user_id
            message["fromName"] = user.name

            target_id = message.get("target")
            if target_id:
                await send_to_peer(meeting_id, target_id, message)

    except WebSocketDisconnect:
        pass
    finally:
        websocket_manager.disconnect(websocket, meeting_id)
        await websocket_manager.broadcast(
            meeting_id, {"type": "peer-left", "peer_id": user_id}
        )


@router.post("/api/meetings/{meeting_id}/transcribe")
async def transcribe_chunk(
    meeting_id: str,
    audio: UploadFile = File(...),
    user_id: str = Form(...),
    speaker_name: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Accepts a short audio chunk, sends it to Groq's Whisper API,
    saves the result as a Transcript row, and broadcasts it to
    everyone currently connected to this meeting's WebSocket room
    via your existing websocket_manager.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not set in backend/.env",
        )

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == user_id,
    ).first()

    if not participant:
        participant = Participant(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            user_id=user_id,
            name=speaker_name,
            joined_at=datetime.utcnow(),
            is_online=True,
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)

    suffix = os.path.splitext(audio.filename or "chunk.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=(os.path.basename(tmp_path), f.read()),
                model="whisper-large-v3-turbo",
            )
        text = (result.text or "").strip()
    finally:
        os.unlink(tmp_path)

    if not text:
        return {"text": ""}

    transcript_row = Transcript(
        id=str(uuid.uuid4()),
        meeting_id=meeting_id,
        participant_id=participant.id,
        text=text,
        speaker=speaker_name,
        timestamp=datetime.utcnow().isoformat(),
        created_at=datetime.utcnow(),
    )
    db.add(transcript_row)
    db.commit()

    await websocket_manager.broadcast(
        meeting_id, {"type": "transcript", "speaker": speaker_name, "text": text}
    )

    return {"text": text}
