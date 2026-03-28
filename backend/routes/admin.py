from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db, User, Cart, Message, UserActivity, Product
from models.schemas import AdminStats, MessageOut, ActivityOut
from typing import List

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_users      = db.query(User).count()
    total_cart       = db.query(Cart).filter(Cart.status == "active").count()
    total_messages   = db.query(Message).count()
    total_activities = db.query(UserActivity).count()

    intent_rows = (
        db.query(Message.intent, func.count(Message.id))
        .filter(Message.intent.isnot(None))
        .group_by(Message.intent)
        .all()
    )
    messages_by_intent = {row[0]: row[1] for row in intent_rows}

    recent_messages = (
        db.query(Message).order_by(Message.timestamp.desc()).limit(10).all()
    )
    recent_activities = (
        db.query(UserActivity).order_by(UserActivity.timestamp.desc()).limit(10).all()
    )

    return {
        "total_users": total_users,
        "total_cart_items": total_cart,
        "total_messages": total_messages,
        "total_activities": total_activities,
        "messages_by_intent": messages_by_intent,
        "recent_messages": recent_messages,
        "recent_activities": recent_activities,
    }


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        cart_count = db.query(Cart).filter(Cart.user_id == u.id, Cart.status == "active").count()
        msg_count  = db.query(Message).filter(Message.user_id == u.id).count()
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "cart_items": cart_count,
            "messages_sent": msg_count,
            "created_at": u.created_at,
        })
    return result


@router.get("/messages", response_model=List[MessageOut])
def get_all_messages(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Message).order_by(Message.timestamp.desc()).limit(limit).all()


@router.get("/activities", response_model=List[ActivityOut])
def get_all_activities(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(UserActivity).order_by(UserActivity.timestamp.desc()).limit(limit).all()
