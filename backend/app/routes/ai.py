

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from app.database import get_db
from app.models import Meeting, Participant, MeetingSummary, Transcript, User
from app.schemas import (
    AIChat,
    AISummaryResponse,
)
from app.routes.auth import get_current_user
from app.services.ai import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/{meeting_id}/ai/chat", response_model=dict)
async def ai_chat(
    meeting_id: str,
    chat: AIChat,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    is_creator = meeting.user_id == current_user.id
    is_participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.id,
    ).first() is not None

    if not is_creator and not is_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to chat in this meeting",
        )

    transcripts = db.query(Transcript).filter(
        Transcript.meeting_id == meeting_id
    ).all()

    transcript_text = "\n".join(
        [f"{t.speaker}: {t.text}" for t in transcripts]
    )

    try:
        response = await ai_service.chat(
            message=chat.message,
            meeting_context=transcript_text,
        )

        return {
            "id": str(uuid.uuid4()),
            "text": response,
            "timestamp": datetime.utcnow().isoformat(),
            "type": "chat",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/{meeting_id}/ai/summary", response_model=AISummaryResponse)
async def get_meeting_summary(
    meeting_id: str,
    regenerate: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    is_creator = meeting.user_id == current_user.id
    is_participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.id,
    ).first() is not None

    if not is_creator and not is_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this meeting",
        )

    existing_summary = db.query(MeetingSummary).filter(
        MeetingSummary.meeting_id == meeting_id
    ).first()

    # Return the cached summary UNLESS the caller explicitly asked
    # to regenerate it.
    if existing_summary and not regenerate:
        return AISummaryResponse(
            summary=existing_summary.summary,
            key_topics=json.loads(existing_summary.key_topics or "[]"),
            decisions=json.loads(existing_summary.decisions or "[]"),
            action_items=json.loads(existing_summary.action_items or "[]"),
        )

    transcripts = db.query(Transcript).filter(
        Transcript.meeting_id == meeting_id
    ).all()

    if not transcripts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript available for this meeting",
        )

    transcript_text = "\n".join(
        [f"{t.speaker}: {t.text}" for t in transcripts]
    )

    try:
        summary_data = await ai_service.generate_summary(transcript_text)

        if existing_summary:
            # Regenerating — update the existing row in place instead
            # of creating a duplicate.
            existing_summary.summary = summary_data["summary"]
            existing_summary.key_topics = json.dumps(summary_data["key_topics"])
            existing_summary.decisions = json.dumps(summary_data["decisions"])
            existing_summary.action_items = json.dumps(summary_data["action_items"])
            db.commit()
        else:
            summary_id = str(uuid.uuid4())
            db_summary = MeetingSummary(
                id=summary_id,
                meeting_id=meeting_id,
                summary=summary_data["summary"],
                key_topics=json.dumps(summary_data["key_topics"]),
                decisions=json.dumps(summary_data["decisions"]),
                action_items=json.dumps(summary_data["action_items"]),
            )
            db.add(db_summary)
            db.commit()

        meeting.status = "completed"
        db.commit()

        return AISummaryResponse(**summary_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/{meeting_id}/ai/speak", response_model=dict)
async def text_to_speech(
    meeting_id: str,
    text_request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    is_creator = meeting.user_id == current_user.id
    is_participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.id,
    ).first() is not None

    if not is_creator and not is_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    text = text_request.get("text", "")

    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text is required",
        )

    try:
        audio_url = await ai_service.text_to_speech(text)
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
