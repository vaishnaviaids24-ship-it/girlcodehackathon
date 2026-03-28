from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./ecommerce.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── ORM Models ──────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    email       = Column(String, nullable=False)
    phone       = Column(String, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    price       = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    image_url   = Column(String, nullable=False)
    category    = Column(String, default="general")
    stock       = Column(Integer, default=50)


class Cart(Base):
    __tablename__ = "cart"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity    = Column(Integer, default=1)
    status      = Column(String, default="active")   # active | checked_out | abandoned
    added_at    = Column(DateTime, default=datetime.utcnow)


class UserActivity(Base):
    __tablename__ = "user_activity"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    action      = Column(String, nullable=False)     # view | add_to_cart | checkout | chat_reply
    product_id  = Column(Integer, ForeignKey("products.id"), nullable=True)
    extra_data  = Column(Text, nullable=True)
    timestamp   = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_text = Column(Text, nullable=False)
    message_type = Column(String, default="outbound")  # outbound | inbound
    trigger      = Column(String, nullable=True)        # view_no_cart | cart_no_checkout | reply
    intent       = Column(String, nullable=True)        # price_concern | not_interested | buy | unknown
    status       = Column(String, default="sent")       # sent | delivered | read | stopped
    channel      = Column(String, default="chat")       # chat | whatsapp | email
    timestamp    = Column(DateTime, default=datetime.utcnow)


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed mock user
    if not db.query(User).filter(User.id == 1).first():
        db.add(User(id=1, name="Alex Johnson", email="alex@example.com", phone="+1-555-0101"))

    # Seed products
    if not db.query(Product).first():
        db.add_all([
            Product(
                id=1,
                name="Stylish Travel Bag",
                price=89.99,
                description="Premium waterproof travel bag with multiple compartments, laptop sleeve, and ergonomic straps. Perfect for weekend getaways or daily commute.",
                image_url="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
                category="travel",
                stock=15,
            ),
            Product(
                id=2,
                name="Wireless Headphones",
                price=129.99,
                description="Hi-fi noise-cancelling wireless headphones with 30-hour battery life, ultra-soft ear cushions, and crystal-clear audio for music lovers.",
                image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
                category="electronics",
                stock=8,
            ),
        ])

    db.commit()
    db.close()
