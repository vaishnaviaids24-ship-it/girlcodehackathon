from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    name: str
    price: float
    description: str
    image_url: str
    category: str
    stock: int

    class Config:
        from_attributes = True


class CartItemIn(BaseModel):
    user_id: int = 1
    product_id: int
    quantity: int = 1


class CartItemOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    status: str
    added_at: datetime
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class ActivityIn(BaseModel):
    user_id: int = 1
    action: str
    product_id: Optional[int] = None
    extra_data: Optional[str] = None


class ActivityOut(BaseModel):
    id: int
    user_id: int
    action: str
    product_id: Optional[int] = None
    extra_data: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: int
    user_id: int
    message_text: str
    message_type: str
    trigger: Optional[str] = None
    intent: Optional[str] = None
    status: str
    channel: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatReplyIn(BaseModel):
    user_id: int = 1
    reply_text: str


class TriggerMessageIn(BaseModel):
    user_id: int = 1
    trigger_type: str   # view_no_cart | cart_no_checkout
    product_id: int


class AdminStats(BaseModel):
    total_users: int
    total_cart_items: int
    total_messages: int
    total_activities: int
    messages_by_intent: dict
    recent_messages: List[MessageOut]
    recent_activities: List[ActivityOut]
