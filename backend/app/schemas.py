

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ── Meetings ─────────────────────────────────────────────────────

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
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None

    class Config:
        from_attributes = True


# ── AI ───────────────────────────────────────────────────────────

class AIChat(BaseModel):
    message: str


class AISummaryResponse(BaseModel):
    summary: str
    key_topics: List[str] = []
    decisions: List[str] = []
    action_items: List[str] = []


# ── Dashboard ────────────────────────────────────────────────────

class WeeklyActivity(BaseModel):
    week_label: str
    meetings: int


class DashboardStats(BaseModel):
    time_saved_hours: float
    time_saved_change: float
    completed_rate: float
    completed_change: float
    total_participants: int
    participants_change: float
    total_meetings: int
    weekly_activity: List[WeeklyActivity] = []


# ── Profile / Settings ───────────────────────────────────────────

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PreferencesUpdate(BaseModel):
    notify_email: Optional[bool] = None
    notify_reminders: Optional[bool] = None
    notify_weekly_digest: Optional[bool] = None
    notify_product_updates: Optional[bool] = None
    pref_language: Optional[str] = None
    pref_timezone: Optional[str] = None


class PreferencesResponse(BaseModel):
    notify_email: bool
    notify_reminders: bool
    notify_weekly_digest: bool
    notify_product_updates: bool
    pref_language: str
    pref_timezone: str

    class Config:
        from_attributes = True


class FullProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    job_title: Optional[str] = None
    company: Optional[str] = None

    class Config:
        from_attributes = True
