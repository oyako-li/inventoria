from models.schemas import Supplier, SupplierItem
from models.db import get_db
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import List
from fastapi import APIRouter
import uuid

class SupplierBase(BaseModel):
    supplier_name: str
    supplier_type: str
    supplier_address: Optional[str] = None
    supplier_description: Optional[str] = None
    updated_by: str

class SupplierCreate(SupplierBase):
    pass

class SupplierRead(SupplierBase):
    supplier_code: str
    updated_at: datetime

    class Config:
        orm_mode = True

class SupplierItemBase(BaseModel):
    lot_price: Optional[float] = None
    lot_size: Optional[int] = None

class SupplierItemCreate(SupplierItemBase):
    item_code: str
    supplier_code: str
    supplier_type: str
    updated_by: str
    updated_at: datetime

class SupplierItemRead(SupplierItemBase):
    item_code: str
    supplier_code: str
    updated_at: datetime
    updated_by: str

    class Config:
        orm_mode = True

supplier_router = APIRouter(prefix="/supplier")
supplier_item_router = APIRouter(prefix="/supplier_item")

@supplier_router.get("/", response_model=List[SupplierRead])
def get_supplier(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    return suppliers

@supplier_router.get("/{supplier_code}", response_model=SupplierRead)
def get_supplier_by_supplier_code(supplier_code: str, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.supplier_code == supplier_code).first()
    return supplier

@supplier_router.post("/")
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    new_supplier = Supplier(
        **supplier.dict(),
        supplier_code=str(uuid.uuid5(uuid.NAMESPACE_URL, "supplier-"+supplier.supplier_name))[:8],
        updated_at=datetime.now()
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier

@supplier_router.put("/")
def update_supplier(supplier: SupplierRead, db: Session = Depends(get_db)):
    db.query(Supplier).filter(Supplier.supplier_code == supplier.supplier_code).update(supplier.dict())
    db.commit()
    return {"status": "success", "message": "Supplier updated successfully"}

@supplier_router.delete("/{supplier_code}")
def delete_supplier(supplier_code: str, db: Session = Depends(get_db)):
    db.query(Supplier).filter(Supplier.supplier_code == supplier_code).delete()
    db.commit()
    return {"status": "success", "message": "Supplier deleted successfully"}


@supplier_item_router.get("/", response_model=List[SupplierItemRead])
def get_supplier_item(db: Session = Depends(get_db)):
    supplier_items = db.query(SupplierItem).all()
    return supplier_items

@supplier_item_router.get("/supplier/{supplier_code}", response_model=List[SupplierItemRead])
def get_supplier_item_by_supplier_code(supplier_code: str, db: Session = Depends(get_db)):
    supplier_item = db.query(SupplierItem).filter(SupplierItem.supplier_code == supplier_code).all()
    return supplier_item

@supplier_item_router.get("/item/{item_code}", response_model=List[SupplierItemRead])
def get_supplier_item_by_item_code(item_code: str, db: Session = Depends(get_db)):
    supplier_item = db.query(SupplierItem).filter(SupplierItem.item_code == item_code).all()
    return supplier_item

@supplier_item_router.post("/")
def create_supplier_item(supplier_item: SupplierItemCreate, db: Session = Depends(get_db)):
    db.add(supplier_item)
    db.commit()
    db.refresh(supplier_item)
    return {"status": "success", "message": "Supplier item created successfully"}

@supplier_item_router.put("/")
def update_supplier_item(supplier_item: SupplierItemRead, db: Session = Depends(get_db)):
    db.query(SupplierItem).filter(SupplierItem.item_code == supplier_item.item_code, SupplierItem.supplier_code == supplier_item.supplier_code).update(supplier_item.dict())
    db.commit()
    return {"status": "success", "message": "Supplier item updated successfully"}

@supplier_item_router.delete("/item/{item_code}/supplier/{supplier_code}/{supplier_type}")
def delete_supplier_item(item_code: str, supplier_code: str, supplier_type: str, db: Session = Depends(get_db)):
    db.query(SupplierItem).filter(SupplierItem.item_code == item_code, SupplierItem.supplier_code == supplier_code, SupplierItem.supplier_type == supplier_type).delete()
    db.commit()
    return {"status": "success", "message": "Supplier item deleted successfully"}