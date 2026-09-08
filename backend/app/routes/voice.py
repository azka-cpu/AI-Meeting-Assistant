

import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv

from app.models import User
from app.routes.auth import get_current_user
from app.services.ai import AIService

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter()
ai_service = AIService()


class VoiceChatRequest(BaseModel):
    message: str


class VoiceChatResponse(BaseModel):
    reply: str


@router.post("/api/voice/transcribe", response_model=dict)
async def transcribe_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not set in backend/.env",
        )

    suffix = os.path.splitext(audio.filename or "recording.webm")[1] or ".webm"
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
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {str(e)}")
    finally:
        os.unlink(tmp_path)

    return {"text": text}


@router.post("/api/voice/chat", response_model=VoiceChatResponse)
async def voice_chat(
    payload: VoiceChatRequest,
    current_user: User = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is empty")

    try:
        reply = await ai_service.chat(message=payload.message, meeting_context="")
        return VoiceChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI response failed: {str(e)}")
