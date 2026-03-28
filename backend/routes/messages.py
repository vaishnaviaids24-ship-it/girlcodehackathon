import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db, Message, User, Product, UserActivity
from models.schemas import TriggerMessageIn, ChatReplyIn, MessageOut
from services.ai_service import generate_smart_message, detect_intent, get_recommendation
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/messages", tags=["messages"])


def _mock_send(channel: str, recipient: str, text: str):
    """Simulate WhatsApp / email delivery — just logs."""
    logger.info(f"[MOCK {channel.upper()}] → {recipient}: {text}")


@router.post("/trigger")
def trigger_smart_message(payload: TriggerMessageIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    product = db.query(Product).filter(Product.id == payload.product_id).first()

    if not user or not product:
        raise HTTPException(status_code=404, detail="User or Product not found")

    message_text = generate_smart_message(payload.trigger_type, product.name, user.name)

    msg = Message(
        user_id=payload.user_id,
        message_text=message_text,
        message_type="outbound",
        trigger=payload.trigger_type,
        status="sent",
        channel="chat",
    )
    db.add(msg)

    # Log activity
    db.add(UserActivity(
        user_id=payload.user_id,
        action="smart_message_sent",
        product_id=payload.product_id,
        extra_data=payload.trigger_type,
    ))

    # Mock send over WhatsApp + email
    _mock_send("whatsapp", user.phone or user.email, message_text)
    _mock_send("email", user.email, message_text)

    db.commit()
    db.refresh(msg)

    # Recommendation
    all_products = [{"id": p.id, "name": p.name} for p in db.query(Product).all()]
    rec = get_recommendation(payload.product_id, all_products)

    return {
        "message": msg,
        "recommendation": rec,
        "channels": ["chat", "whatsapp (mock)", "email (mock)"],
    }


@router.post("/reply")
def handle_reply(payload: ChatReplyIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Store inbound message
    inbound = Message(
        user_id=payload.user_id,
        message_text=payload.reply_text,
        message_type="inbound",
        trigger="reply",
        status="received",
        channel="chat",
    )
    db.add(inbound)

    # Detect intent
    result = detect_intent(payload.reply_text)
    intent = result["intent"]

    # Store follow-up outbound message
    follow_up = Message(
        user_id=payload.user_id,
        message_text=result["follow_up_message"],
        message_type="outbound",
        trigger="reply",
        intent=intent,
        status="sent",
        channel="chat",
    )
    db.add(follow_up)

    # Log activity
    db.add(UserActivity(
        user_id=payload.user_id,
        action="chat_reply",
        extra_data=f"intent:{intent}",
    ))

    # If "not_interested" → mark any active cart as abandoned
    if intent == "not_interested":
        from database.db import Cart
        active = db.query(Cart).filter(Cart.user_id == payload.user_id, Cart.status == "active").all()
        for c in active:
            c.status = "abandoned"

    db.commit()

    return {
        "intent": intent,
        "confidence": result["confidence"],
        "reason": result.get("reason", ""),
        "follow_up_message": result["follow_up_message"],
        "action": _action_for_intent(intent),
    }


def _action_for_intent(intent: str) -> str:
    return {
        "price_concern": "discount_offered",
        "not_interested": "messages_stopped",
        "buy": "redirect_to_checkout",
        "unknown": "await_clarification",
    }.get(intent, "await_clarification")


@router.get("/{user_id}", response_model=List[MessageOut])
def get_messages(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.timestamp.desc())
        .limit(limit)
        .all()
    )
