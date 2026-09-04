from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from app.models import (
    Meeting,
    Participant,
    Transcript,
    MeetingMessage,
    MeetingSummary,
    ActionItem,
    Decision,
)


class MeetingService:
    @staticmethod
    def create_meeting(
        db: Session,
        user_id: str,
        title: str,
        description: str = None,
    ) -> Meeting:
        """Create a new meeting."""
        meeting_id = str(uuid.uuid4())
        meeting = Meeting(
            id=meeting_id,
            user_id=user_id,
            title=title,
            description=description,
            status="active",
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def get_meeting(db: Session, meeting_id: str) -> Meeting:
        """Get a meeting by ID."""
        return db.query(Meeting).filter(Meeting.id == meeting_id).first()

    @staticmethod
    def list_user_meetings(db: Session, user_id: str):
        """List all meetings for a user."""
        return db.query(Meeting).filter(Meeting.user_id == user_id).all()

    @staticmethod
    def add_participant(
        db: Session,
        meeting_id: str,
        user_id: str,
        name: str,
    ) -> Participant:
        """Add a participant to a meeting."""
        participant_id = str(uuid.uuid4())
        participant = Participant(
            id=participant_id,
            meeting_id=meeting_id,
            user_id=user_id,
            name=name,
            joined_at=datetime.utcnow(),
            is_online=True,
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def remove_participant(
        db: Session,
        meeting_id: str,
        user_id: str,
    ) -> bool:
        """Remove a participant from a meeting."""
        participant = db.query(Participant).filter(
            Participant.meeting_id == meeting_id,
            Participant.user_id == user_id,
        ).first()

        if not participant:
            return False

        participant.left_at = datetime.utcnow()
        participant.is_online = False
        db.commit()
        return True

    @staticmethod
    def get_participants(db: Session, meeting_id: str):
        """Get all participants in a meeting."""
        return db.query(Participant).filter(
            Participant.meeting_id == meeting_id
        ).all()

    @staticmethod
    def add_transcript(
        db: Session,
        meeting_id: str,
        participant_id: str,
        speaker: str,
        text: str,
        timestamp: str,
    ) -> Transcript:
        """Add a transcript entry."""
        transcript_id = str(uuid.uuid4())
        transcript = Transcript(
            id=transcript_id,
            meeting_id=meeting_id,
            participant_id=participant_id,
            speaker=speaker,
            text=text,
            timestamp=timestamp,
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        return transcript

    @staticmethod
    def get_transcripts(db: Session, meeting_id: str):
        """Get all transcripts for a meeting."""
        return db.query(Transcript).filter(
            Transcript.meeting_id == meeting_id
        ).order_by(Transcript.created_at).all()

    @staticmethod
    def add_message(
        db: Session,
        meeting_id: str,
        user_id: str,
        sender_name: str,
        text: str,
    ) -> MeetingMessage:
        """Add a chat message to a meeting."""
        message_id = str(uuid.uuid4())
        message = MeetingMessage(
            id=message_id,
            meeting_id=meeting_id,
            user_id=user_id,
            sender_name=sender_name,
            text=text,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    @staticmethod
    def get_messages(db: Session, meeting_id: str):
        """Get all messages for a meeting."""
        return db.query(MeetingMessage).filter(
            MeetingMessage.meeting_id == meeting_id
        ).order_by(MeetingMessage.created_at).all()

    @staticmethod
    def save_summary(
        db: Session,
        meeting_id: str,
        summary: str,
        key_topics: list,
        decisions: list,
        action_items: list,
    ) -> MeetingSummary:
        """Save meeting summary."""
        summary_id = str(uuid.uuid4())
        meeting_summary = MeetingSummary(
            id=summary_id,
            meeting_id=meeting_id,
            summary=summary,
            key_topics=json.dumps(key_topics),
            decisions=json.dumps(decisions),
            action_items=json.dumps(action_items),
        )
        db.add(meeting_summary)
        db.commit()
        db.refresh(meeting_summary)
        return meeting_summary

    @staticmethod
    def get_summary(db: Session, meeting_id: str) -> MeetingSummary:
        """Get meeting summary."""
        return db.query(MeetingSummary).filter(
            MeetingSummary.meeting_id == meeting_id
        ).first()

    @staticmethod
    def close_meeting(db: Session, meeting_id: str) -> Meeting:
        """Close a meeting and mark participants as offline."""
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()

        if meeting:
            meeting.status = "completed"
            meeting.updated_at = datetime.utcnow()

            # Mark all participants as offline
            participants = db.query(Participant).filter(
                Participant.meeting_id == meeting_id
            ).all()

            for participant in participants:
                if participant.is_online:
                    participant.left_at = datetime.utcnow()
                    participant.is_online = False

            db.commit()
            db.refresh(meeting)

        return meeting