

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    Meeting,
    Participant,
    Transcript,
    MeetingMessage,
    MeetingSummary,
    ActionItem,
    Decision,
)
from app.schemas import (
    ProfileUpdate,
    PasswordChange,
    PreferencesUpdate,
    PreferencesResponse,
    FullProfileResponse,
)
from app.routes.auth import get_current_user
from app.services.auth import AuthService

router = APIRouter()


@router.put("/me", response_model=FullProfileResponse)
def update_profile(
    update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update.email and update.email != current_user.email:
        existing = db.query(User).filter(
            User.email == update.email,
            User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use by another account",
            )
        current_user.email = update.email

    if update.name:
        current_user.name = update.name
    if update.job_title is not None:
        current_user.job_title = update.job_title
    if update.company is not None:
        current_user.company = update.company

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password", response_model=dict)
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not AuthService.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters",
        )

    current_user.hashed_password = AuthService.hash_password(payload.new_password)
    db.commit()

    return {"success": True}


@router.get("/me/preferences", response_model=PreferencesResponse)
def get_preferences(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put("/me/preferences", response_model=PreferencesResponse)
def update_preferences(
    update: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", response_model=dict)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes the account and everything it owns. Deletes child rows
    first (in FK-dependency order) so this doesn't violate foreign
    key constraints — your models don't have ON DELETE CASCADE set
    up at the DB level, so this does the cascade manually instead.
    """
    owned_meeting_ids = [
        m.id for m in db.query(Meeting.id).filter(Meeting.user_id == current_user.id).all()
    ]

    if owned_meeting_ids:
        db.query(Transcript).filter(Transcript.meeting_id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )
        db.query(MeetingMessage).filter(MeetingMessage.meeting_id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )
        db.query(MeetingSummary).filter(MeetingSummary.meeting_id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )
        db.query(ActionItem).filter(ActionItem.meeting_id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )
        db.query(Decision).filter(Decision.meeting_id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )
        db.query(Participant).filter(Participant.meeting_id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )
        db.query(Meeting).filter(Meeting.id.in_(owned_meeting_ids)).delete(
            synchronize_session=False
        )

    # Also remove this user's participant rows in OTHER people's
    # meetings (meetings they joined but didn't create).
    db.query(Participant).filter(Participant.user_id == current_user.id).delete(
        synchronize_session=False
    )

    db.delete(current_user)
    db.commit()

    return {"success": True}
