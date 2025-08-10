from models.schemas import Item
from models.db import get_db
from sqlalchemy.orm import Session
from fastapi import Depends, Request, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter
from router.auth import get_current_user
from models.schemas import User
import uuid
from datetime import datetime

class ItemBase(BaseModel):
    item_name: Optional[str] = None
    item_price: Optional[float] = None
    item_quantity: Optional[int] = None
    updated_by: Optional[str] = None


class ItemCreate(BaseModel):
    item_name: str
    item_price: Optional[float] = None
    item_quantity: Optional[int] = None
    updated_by: Optional[str] = None

class ItemRead(ItemBase):
    item_code: uuid.UUID
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

router = APIRouter(prefix="/item")

@router.get("/", response_model=List[ItemRead])
def get_item(
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
    
    items = db.query(Item).filter(Item.team_id == team_id).all()
    return items

@router.get("/{item_code}", response_model=ItemRead)
def get_item_by_item_code(
    item_code: uuid.UUID,
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
    
    item = db.query(Item).filter(Item.item_code == item_code, Item.team_id == team_id).first()
    return item

@router.post("/", response_model=ItemRead)
def create_item(
    item: ItemCreate,
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
    
    # uuid5で同じ商品名から同じitem_codeを生成
    item_code = uuid.uuid5(uuid.NAMESPACE_URL, f"item-{item.item_name}-{team_id}")
    
    # 同じitem_codeが既に存在するかチェック
    existing_item = db.query(Item).filter(
        Item.item_code == item_code,
        Item.team_id == team_id
    ).first()
    
    if existing_item:
        raise HTTPException(status_code=400, detail="同じ商品名が既に存在します")
    
    new_item = Item(
        item_code=item_code,
        team_id=team_id,
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

@router.put("/{item_code}", response_model=ItemRead)
def update_item(
    item_code: uuid.UUID,
    item: ItemBase,
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
    
    db_item = db.query(Item).filter(
        Item.item_code == item_code,
        Item.team_id == team_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    setattr(db_item, "updated_at", datetime.now())
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_code}")
def delete_item(
    item_code: uuid.UUID,
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
    
    db_item = db.query(Item).filter(
        Item.item_code == item_code,
        Item.team_id == team_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"status": "success", "message": "Item deleted successfully"}