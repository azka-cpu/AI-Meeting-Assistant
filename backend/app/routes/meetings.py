from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.models import Meeting, Participant, User
from app.schemas import (
    MeetingCreate,
    MeetingResponse,
    MeetingUpdate,
)
from app.routes.auth import get_current_user

router = APIRouter()


@router.post("", response_model=MeetingResponse)
def create_meeting(
    meeting: MeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting_id = str(uuid.uuid4())

    db_meeting = Meeting(
        id=meeting_id,
        user_id=current_user.id,
        title=meeting.title,
        description=meeting.description,
        scheduled_at=meeting.scheduled_at,
        duration_minutes=meeting.duration_minutes or 30,
        status="active",
    )

    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)

    return db_meeting


@router.get("", response_model=list[MeetingResponse])
def list_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meetings = db.query(Meeting).filter(Meeting.user_id == current_user.id).all()

    return meetings


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    # Check if user is meeting creator or participant
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

    return meeting


@router.post("/{meeting_id}/join", response_model=dict)
def join_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    # Check if already a participant
    existing = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already a participant in this meeting",
        )

    # Add participant
    participant_id = str(uuid.uuid4())
    participant = Participant(
        id=participant_id,
        meeting_id=meeting_id,
        user_id=current_user.id,
        name=current_user.name,
        joined_at=datetime.utcnow(),
        is_online=True,
    )

    db.add(participant)
    db.commit()

    return {"success": True, "participant_id": participant_id}


@router.post("/{meeting_id}/leave", response_model=dict)
def leave_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    # Find and update participant
    participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.id,
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not a participant in this meeting",
        )

    participant.left_at = datetime.utcnow()
    participant.is_online = False

    db.commit()

    return {"success": True}


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: str,
    meeting_update: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    if meeting.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this meeting",
        )

    if meeting_update.title:
        meeting.title = meeting_update.title
    if meeting_update.description is not None:
        meeting.description = meeting_update.description
    if meeting_update.status:
        meeting.status = meeting_update.status

    meeting.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(meeting)

    return meeting
