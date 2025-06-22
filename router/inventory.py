from models.db import get_db
from models.schemas import Item, Transactions
from sqlalchemy.orm import Session
from fastapi import Depends
from sqlalchemy import func, desc, case, or_, and_
from pydantic import BaseModel
from typing import List
from datetime import datetime
from fastapi import APIRouter


class InventoryBase(BaseModel):
    item_code: str
    item_name: str
    current_stock: int

class InventoryRead(InventoryBase):
    updated_at: datetime

    class Config:
        orm_mode = True


router = APIRouter(prefix="/inventory")

@router.get("/", response_model=List[InventoryRead])
def get_inventory(db: Session = Depends(get_db)):
    """
    Get all inventory items, ordered by the most recent update time
    (either from the item itself or its latest transaction).
    """

    quantity_case = func.sum(
        case(
            (Transactions.updated_at >= Item.updated_at, Transactions.quantity),
            else_=0
        )
    )

    last_updated_at = func.max(
        case(
            (Transactions.updated_at >= Item.updated_at, Transactions.updated_at),
            else_=Item.updated_at
        )
    ).label("updated_at")

    query = (
        db.query(
            Item.item_code,
            Item.item_name,
            (Item.item_quantity + func.coalesce(quantity_case, 0)).label("current_stock"),
            last_updated_at
        )
        .outerjoin(Transactions, Item.item_code == Transactions.item_code)
        .group_by(Item.item_code, Item.item_name, Item.item_quantity, Item.updated_at)
        .order_by(desc(last_updated_at))
    )

    inventory = query.all()
    print(inventory)
    return inventory

@router.get("/{item_code}", response_model=InventoryRead)
def get_inventory_by_item_code(item_code: str, db: Session = Depends(get_db)):
    """
    Get a single inventory item by its code, calculating the current stock
    and the most recent update time.
    """
    quantity_case = func.sum(
        case(
            (Transactions.updated_at >= Item.updated_at, Transactions.quantity),
            else_=0
        )
    )

    last_updated_at = func.max(
        case(
            (Transactions.updated_at >= Item.updated_at, Transactions.updated_at),
            else_=Item.updated_at
        )
    ).label("updated_at")

    query = (
        db.query(
            Item.item_code,
            Item.item_name,
            (Item.item_quantity + func.coalesce(quantity_case, 0)).label("current_stock"),
            last_updated_at
        )
        .outerjoin(Transactions, Item.item_code == Transactions.item_code)
        .where(Item.item_code == item_code)
        .group_by(Item.item_code, Item.item_name, Item.item_quantity, Item.updated_at)
        .order_by(desc(last_updated_at))
    )
    inventory = query.first()
    return inventory