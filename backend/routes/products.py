from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db, Product
from models.schemas import ProductOut
from typing import List

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/", response_model=List[ProductOut])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return product
