from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db, UserActivity
from models.schemas import ActivityIn, ActivityOut
from typing import List

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.post("/track", response_model=ActivityOut)
def track_activity(payload: ActivityIn, db: Session = Depends(get_db)):
    activity = UserActivity(
        user_id=payload.user_id,
        action=payload.action,
        product_id=payload.product_id,
        extra_data=payload.extra_data,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/{user_id}", response_model=List[ActivityOut])
def get_user_activity(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(UserActivity)
        .filter(UserActivity.user_id == user_id)
        .order_by(UserActivity.timestamp.desc())
        .limit(limit)
        .all()
    )
