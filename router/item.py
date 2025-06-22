from models.schemas import Item
from models.db import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from starlette import status
import uuid
from datetime import datetime

class ItemBase(BaseModel):
    item_name: str
    item_price: Optional[float] = None
    item_quantity: Optional[int] = None
    updated_by: Optional[str] = None


class ItemCreate(ItemBase):
    pass

class ItemRead(ItemBase):
    item_code: str
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

router = APIRouter(prefix="/item")

@router.get("/", response_model=List[ItemRead])
def get_item(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return items

@router.get("/{item_code}", response_model=ItemRead)
def get_item_by_item_code(item_code: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.item_code == item_code).first()
    return item

@router.post("/", response_model=ItemRead)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    new_item = Item(
        item_code=str(uuid.uuid5(uuid.NAMESPACE_URL, "item-"+item.item_name))[:8],
        item_name=item.item_name,
        item_price=item.item_price,
        item_quantity=item.item_quantity,
        updated_by=item.updated_by,
        updated_at=datetime.now()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/")
def update_item(item: ItemRead, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.item_code == item.item_code).first()
    if not db_item:
        return {"status": "error", "message": "Item not found"}
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    setattr(db_item, "updated_at", datetime.now())
    db.commit()
    db.refresh(db_item)
    return RedirectResponse(
        url=f"/inventory/{db_item.item_code}",
        status_code=status.HTTP_303_SEE_OTHER
    )

@router.delete("/{item_code}")
def delete_item(item_code: str, db: Session = Depends(get_db)):
    db.query(Item).filter(Item.item_code == item_code).delete()
    db.commit()
    return {"status": "success", "message": "Item deleted successfully"}