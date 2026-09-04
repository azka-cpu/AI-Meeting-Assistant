
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Meeting, Participant, MeetingSummary, User
from app.schemas import DashboardStats
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

    def meetings_in_range(start, end=None):
        q = db.query(Meeting).filter(
            Meeting.user_id == current_user.id,
            Meeting.created_at >= start,
        )
        if end:
            q = q.filter(Meeting.created_at < end)
        return q.all()

    this_month = meetings_in_range(this_month_start)
    last_month = meetings_in_range(last_month_start, this_month_start)

    def completed_count(meetings):
        return len([m for m in meetings if m.status == "completed"])

    def completed_rate(meetings):
        if not meetings:
            return 0.0
        return round((completed_count(meetings) / len(meetings)) * 100, 1)

    def time_saved(meetings):
        if not meetings:
            return 0.0
        meeting_ids = [m.id for m in meetings]
        summarized = db.query(MeetingSummary).filter(
            MeetingSummary.meeting_id.in_(meeting_ids)
        ).count()
        return round(summarized * 0.25, 1)

    def participant_count(meetings):
        if not meetings:
            return 0
        meeting_ids = [m.id for m in meetings]
        return db.query(Participant).filter(
            Participant.meeting_id.in_(meeting_ids)
        ).count()

    this_completed_rate = completed_rate(this_month)
    last_completed_rate = completed_rate(last_month)

    this_time_saved = time_saved(this_month)
    last_time_saved = time_saved(last_month)

    this_participants = participant_count(this_month)
    last_participants = participant_count(last_month)

    participants_change = (
        round(((this_participants - last_participants) / last_participants) * 100, 1)
        if last_participants
        else 0.0
    )

    # ── NEW: weekly activity for the last 6 weeks (real counts) ──
    weekly_activity = []
    for i in range(5, -1, -1):
        week_start = now - timedelta(weeks=i, days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)
        count = db.query(Meeting).filter(
            Meeting.user_id == current_user.id,
            Meeting.created_at >= week_start,
            Meeting.created_at < week_end,
        ).count()
        weekly_activity.append({
            "week_label": week_start.strftime("%b %d"),
            "meetings": count,
        })

    return DashboardStats(
        time_saved_hours=this_time_saved,
        time_saved_change=round(this_time_saved - last_time_saved, 1),
        completed_rate=this_completed_rate,
        completed_change=round(this_completed_rate - last_completed_rate, 1),
        total_participants=this_participants,
        participants_change=participants_change,
        total_meetings=len(this_month),
        weekly_activity=weekly_activity,
    )
