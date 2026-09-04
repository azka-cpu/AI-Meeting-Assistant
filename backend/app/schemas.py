from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ParticipantResponse(BaseModel):
    id: str
    name: str
    joined_at: datetime
    left_at: Optional[datetime]
    is_online: bool

    class Config:
        from_attributes = True


class TranscriptResponse(BaseModel):
    id: str
    speaker: str
    text: str
    timestamp: str
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingMessageResponse(BaseModel):
    id: str
    sender_name: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingSummaryResponse(BaseModel):
    id: str
    summary: str
    key_topics: Optional[List[str]]
    decisions: Optional[List[str]]
    action_items: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = 30



class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class MeetingResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    participants: List[ParticipantResponse] = []
    transcript: List[TranscriptResponse] = []
    messages: List[MeetingMessageResponse] = []
    summary: Optional[MeetingSummaryResponse] = None

    class Config:
        from_attributes = True


class ActionItemCreate(BaseModel):
    description: str
    assigned_to: Optional[str] = None


class ActionItemResponse(BaseModel):
    id: str
    description: str
    assigned_to: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DecisionCreate(BaseModel):
    title: str
    description: str


class DecisionResponse(BaseModel):
    id: str
    title: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class TranscriptCreate(BaseModel):
    speaker: str
    text: str
    timestamp: str


class ChatMessageCreate(BaseModel):
    text: str
    sender_name: str


class AIChat(BaseModel):
    message: str


class AISummaryResponse(BaseModel):
    summary: str
    key_topics: List[str]
    decisions: List[str]
    action_items: List[str]


class AIVoiceResponse(BaseModel):
    text: str
    audio_url: Optional[str] = None

from typing import List

class WeeklyActivity(BaseModel):
    week_label: str
    meetings: int


from pydantic import BaseModel
class DashboardStats(BaseModel):
    time_saved_hours: float
    time_saved_change: float
    completed_rate: float
    completed_change: float
    total_participants: int
    participants_change: float
    total_meetings: int
    weekly_activity: List[WeeklyActivity] = []