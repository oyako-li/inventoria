from models.schemas import ActionType, Supplier, SupplierItem
from models.db import get_db
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends, Request, HTTPException
from typing import List
from fastapi import APIRouter
from router.auth import get_current_user
from models.schemas import User
import uuid

class SupplierBase(BaseModel):
    supplier_name: str
    supplier_type: ActionType
    supplier_address: Optional[str] = None
    supplier_description: Optional[str] = None
    updated_by: str

class SupplierCreate(SupplierBase):
    pass

class SupplierRead(SupplierBase):
    supplier_code: uuid.UUID
    updated_at: datetime

    class Config:
        orm_mode = True

class SupplierUpdate(SupplierBase):
    supplier_code: uuid.UUID
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class SupplierItemBase(BaseModel):
    lot_price: Optional[float] = None
    lot_size: Optional[int] = None

class SupplierItemCreate(SupplierItemBase):
    item_code: uuid.UUID
    supplier_code: uuid.UUID
    supplier_type: ActionType
    updated_by: str
    updated_at: datetime

class SupplierItemRead(SupplierItemBase):
    item_code: uuid.UUID
    supplier_code: uuid.UUID
    updated_at: datetime
    updated_by: str

    class Config:
        orm_mode = True

supplier_router = APIRouter(prefix="/supplier")
supplier_item_router = APIRouter(prefix="/supplier_item")

@supplier_router.get("/", response_model=List[SupplierRead])
def get_supplier(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # チームIDをヘッダーから取得
    team_id = request.headers.get('X-Team-ID')
    if not team_id:
        # チームIDが提供されていない場合は、ユーザーの最初のチームを使用
        from models.schemas import TeamMember
        user_team = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
        if not user_team:
            raise HTTPException(status_code=400, detail="チームに所属していません")
        team_id = user_team.team_id
    else:
        try:
            team_id = int(team_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="無効なチームIDです")
    
    suppliers = db.query(Supplier).filter(Supplier.team_id == team_id).all()
    return suppliers

@supplier_router.get("/{supplier_code}", response_model=SupplierRead)
def get_supplier_by_supplier_code(supplier_code: uuid.UUID, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.supplier_code == supplier_code).first()
    return supplier

@supplier_router.post("/")
def create_supplier(
    supplier: SupplierCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # チームIDをヘッダーから取得
    team_id = request.headers.get('X-Team-ID')
    if not team_id:
        raise HTTPException(status_code=400, detail="チームIDが必要です")
    
    try:
        team_id = int(team_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="無効なチームIDです")
    
    new_supplier = Supplier(
        **supplier.dict(),
        team_id=team_id,
        supplier_code=uuid.uuid5(uuid.NAMESPACE_URL, "supplier-"+supplier.supplier_name),
        updated_at=datetime.now()
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier

@supplier_router.put("/", response_model=SupplierRead)
def update_supplier(
    supplier: SupplierUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # チームIDをヘッダーから取得
    team_id = request.headers.get('X-Team-ID')
    if not team_id:
        # チームIDが提供されていない場合は、ユーザーの最初のチームを使用
        from models.schemas import TeamMember
        user_team = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
        if not user_team:
            raise HTTPException(status_code=400, detail="チームに所属していません")
        team_id = user_team.team_id
    else:
        try:
            team_id = int(team_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="無効なチームIDです")
    
    db_supplier = db.query(Supplier).filter(
        Supplier.supplier_code == supplier.supplier_code,
        Supplier.team_id == team_id
    ).first()
    
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    setattr(db_supplier, "updated_at", datetime.now())
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@supplier_router.delete("/{supplier_code}")
def delete_supplier(
    supplier_code: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # チームIDをヘッダーから取得
    team_id = request.headers.get('X-Team-ID')
    if not team_id:
        # チームIDが提供されていない場合は、ユーザーの最初のチームを使用
        from models.schemas import TeamMember
        user_team = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
        if not user_team:
            raise HTTPException(status_code=400, detail="チームに所属していません")
        team_id = user_team.team_id
    else:
        try:
            team_id = int(team_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="無効なチームIDです")
    
    db_supplier = db.query(Supplier).filter(
        Supplier.supplier_code == supplier_code,
        Supplier.team_id == team_id
    ).first()
    
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(db_supplier)
    db.commit()
    return {"status": "success", "message": "Supplier deleted successfully"}


@supplier_item_router.get("/", response_model=List[SupplierItemRead])
def get_supplier_item(db: Session = Depends(get_db)):
    supplier_items = db.query(SupplierItem).all()
    return supplier_items

@supplier_item_router.get("/supplier/{supplier_code}", response_model=List[SupplierItemRead])
def get_supplier_item_by_supplier_code(supplier_code: uuid.UUID, db: Session = Depends(get_db)):
    supplier_item = db.query(SupplierItem).filter(SupplierItem.supplier_code == supplier_code).all()
    return supplier_item

@supplier_item_router.get("/item/{item_code}", response_model=List[SupplierItemRead])
def get_supplier_item_by_item_code(item_code: uuid.UUID, db: Session = Depends(get_db)):
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
def delete_supplier_item(item_code: uuid.UUID, supplier_code: uuid.UUID, supplier_type: ActionType, db: Session = Depends(get_db)):
    db.query(SupplierItem).filter(SupplierItem.item_code == item_code, SupplierItem.supplier_code == supplier_code, SupplierItem.supplier_type == supplier_type).delete()
    db.commit()
    return {"status": "success", "message": "Supplier item deleted successfully"}