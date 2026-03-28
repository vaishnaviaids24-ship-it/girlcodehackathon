from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db, Cart, Product, UserActivity
from models.schemas import CartItemIn, CartItemOut
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _enrich(item: Cart, db: Session) -> dict:
    product = db.query(Product).filter(Product.id == item.product_id).first()
    return {
        "id": item.id,
        "user_id": item.user_id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "status": item.status,
        "added_at": item.added_at,
        "product": product,
    }


@router.get("/{user_id}")
def get_cart(user_id: int, db: Session = Depends(get_db)):
    items = db.query(Cart).filter(Cart.user_id == user_id, Cart.status == "active").all()
    return [_enrich(i, db) for i in items]


@router.post("/add")
def add_to_cart(payload: CartItemIn, db: Session = Depends(get_db)):
    # Check if already in cart
    existing = db.query(Cart).filter(
        Cart.user_id == payload.user_id,
        Cart.product_id == payload.product_id,
        Cart.status == "active",
    ).first()

    if existing:
        existing.quantity += payload.quantity
        db.commit()
        db.refresh(existing)
        cart_item = existing
    else:
        cart_item = Cart(
            user_id=payload.user_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)

    # Log activity
    db.add(UserActivity(
        user_id=payload.user_id,
        action="add_to_cart",
        product_id=payload.product_id,
    ))
    db.commit()

    return _enrich(cart_item, db)


@router.post("/checkout/{user_id}")
def checkout(user_id: int, db: Session = Depends(get_db)):
    items = db.query(Cart).filter(Cart.user_id == user_id, Cart.status == "active").all()
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    for item in items:
        item.status = "checked_out"
    db.add(UserActivity(user_id=user_id, action="checkout"))
    db.commit()
    return {"message": "Checkout successful", "items_checked_out": len(items)}


@router.delete("/remove/{cart_id}")
def remove_from_cart(cart_id: int, db: Session = Depends(get_db)):
    item = db.query(Cart).filter(Cart.id == cart_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item removed"}
