

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_title = Column(String, nullable=True)
    company = Column(String, nullable=True)

    notify_email = Column(Boolean, default=True)
    notify_reminders = Column(Boolean, default=True)
    notify_weekly_digest = Column(Boolean, default=False)
    notify_product_updates = Column(Boolean, default=True)

    pref_language = Column(String, default="en")
    pref_timezone = Column(String, default="UTC")

    meetings = relationship("Meeting", back_populates="user")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=30)

    user = relationship("User", back_populates="meetings")
    participants = relationship("Participant", back_populates="meeting")
    transcripts = relationship("Transcript", back_populates="meeting")
    messages = relationship("MeetingMessage", back_populates="meeting")
    summary = relationship("MeetingSummary", back_populates="meeting", uselist=False)
    action_items = relationship("ActionItem", back_populates="meeting")
    decisions = relationship("Decision", back_populates="meeting")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_online = Column(Boolean, default=True)

    meeting = relationship("Meeting", back_populates="participants")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    text = Column(Text, nullable=False)
    speaker = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="transcripts")


class MeetingMessage(Base):
    __tablename__ = "meeting_messages"

    id = Column(String, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="messages")


class MeetingSummary(Base):
    __tablename__ = "meeting_summaries"

    id = Column(String, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    summary = Column(Text, nullable=False)
    key_topics = Column(Text, nullable=True)
    decisions = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    description = Column(Text, nullable=False)
    assigned_to = Column(String, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="action_items")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, index=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="decisions")
