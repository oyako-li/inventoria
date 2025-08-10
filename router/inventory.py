from models.db import get_db
from models.schemas import Item, Transactions
from sqlalchemy.orm import Session
from fastapi import Depends, Request, HTTPException
from sqlalchemy import func, desc, case, or_, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter
from router.auth import get_current_user
from models.schemas import User
import uuid


class InventoryBase(BaseModel):
    item_code: uuid.UUID
    item_name: str
    current_stock: int

class InventoryRead(InventoryBase):
    updated_at: datetime

    class Config:
        orm_mode = True


router = APIRouter(prefix="/inventory")

@router.get("/", response_model=List[InventoryRead])
def get_inventory(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    
    query = (
        db.query(
            Item.item_code,
            Item.item_name,
            (Item.item_quantity + func.coalesce(quantity_case, 0)).label("item_quantity"),
            last_updated_at
        )
        .outerjoin(Transactions, Item.item_code == Transactions.item_code)
        .filter(Item.team_id == team_id)
        .group_by(Item.item_code, Item.item_name, Item.item_quantity, Item.updated_at)
        .order_by(desc(last_updated_at))
    )

    inventory = query.all()
    return inventory

@router.get("/{item_code}", response_model=InventoryRead)
def get_inventory_by_item_code(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    item_code: Optional[uuid.UUID] = None
):
    # item_codeがNoneの場合は全件取得
    if item_code is None:
        return get_inventory(request, db, current_user)
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
    
    query = (
        db.query(
            Item.item_code,
            Item.item_name,
            (Item.item_quantity + func.coalesce(quantity_case, 0)).label("item_quantity"),
            last_updated_at
        )
        .outerjoin(Transactions, Item.item_code == Transactions.item_code)
        .filter(Item.item_code == item_code, Item.team_id == team_id)
        .group_by(Item.item_code, Item.item_name, Item.item_quantity, Item.updated_at)
        .order_by(desc(last_updated_at))
    )
    inventory = query.first()
    return inventory