from models.schemas import Transactions, Item
from models.db import get_db
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Request
from typing import List
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from starlette import status
from router.auth import get_current_user
from models.schemas import User
import uuid

class TransactionBase(BaseModel):
    item_code: Optional[uuid.UUID] = None
    item_name: Optional[str] = None
    supplier_code: Optional[uuid.UUID] = None
    action: str
    quantity: int = 0
    price: Optional[float] = None
    updated_by: str

class TransactionCreate(TransactionBase):
    action: str

class TransactionUpdate(TransactionBase):
    id: int

class TransactionRead(TransactionBase):
    id: int
    action: str
    updated_at: datetime
    updated_by: str
    supplier_type: Optional[str] = None
    supplier_name: Optional[str] = None

    class Config:
        orm_mode = True

router = APIRouter(prefix="/transaction")

@router.get("/", response_model=List[TransactionRead])
def get_transaction(db: Session = Depends(get_db)):
    transactions = db.query(Transactions).order_by(Transactions.updated_at.desc()).all()
    return transactions

@router.get("/id/{id}", response_model=TransactionRead)
def get_transaction_by_id(id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transactions).filter(Transactions.id == id).first()
    return transaction

@router.get("/item/{item_code}", response_model=List[TransactionRead])
def get_transaction_by_item_code(item_code: uuid.UUID, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    if date:
        transaction = db.query(Transactions).filter(Transactions.item_code == item_code, Transactions.updated_at >= date).order_by(Transactions.updated_at.desc()).all()
    else:
        transaction = db.query(Transactions).filter(Transactions.item_code == item_code).order_by(Transactions.updated_at.desc()).all()
    if not transaction:
        return {"status": "error", "message": "Transaction not found"}
    return transaction

@router.get("/supplier/{supplier_code}", response_model=List[TransactionRead])
def get_transaction_by_supplier_code(supplier_code: uuid.UUID, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    if date:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code, Transactions.updated_at >= date).order_by(Transactions.updated_at.desc()).all()
    else:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code).order_by(Transactions.updated_at.desc()).all()
    if not transaction:
        return {"status": "error", "message": "Transaction not found"}
    return transaction

@router.get("/supplier/{supplier_code}/item/{item_code}", response_model=List[TransactionRead])
def get_transaction_by_supplier_code_and_item_code(supplier_code: uuid.UUID, item_code: uuid.UUID, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    if date:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code, Transactions.item_code == item_code, Transactions.updated_at >= date).order_by(Transactions.updated_at.desc()).all()
    else:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code, Transactions.item_code == item_code).order_by(Transactions.updated_at.desc()).all()
    if not transaction:
        return {"status": "error", "message": "Transaction not found"}
    return transaction

@router.post("/", response_model=TransactionRead)
def add_transaction(
    transaction: TransactionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"Received transaction data: {transaction.dict()}")
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
    
    # トランザクション記録
    new_transaction = Transactions(
        **transaction.dict(),
        team_id=team_id,
        updated_at=datetime.now()
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    # 商品の在庫数を更新
    item = db.query(Item).filter(Item.item_code == new_transaction.item_code).first()
    if item:
        item.item_quantity += new_transaction.quantity
        item.updated_at = datetime.now()
        item.updated_by = new_transaction.updated_by
        db.commit()
        db.refresh(item)
    
    return new_transaction

@router.put("/")
def update_transaction(
    transaction: TransactionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"Updating transaction data: {transaction.dict()}")
    
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
    
    db_transaction = db.query(Transactions).filter(
        Transactions.id == transaction.id,
        Transactions.team_id == team_id
    ).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    setattr(db_transaction, "updated_at", datetime.now())
    db.commit() 
    db.refresh(db_transaction)
    
    # 商品の在庫数を更新
    item = db.query(Item).filter(Item.item_code == db_transaction.item_code).first()
    if item:
        # 元の取引の数量を差し引いて、新しい取引の数量を加算
        old_quantity = db_transaction.quantity
        new_quantity = transaction.quantity
        item.item_quantity = item.item_quantity - old_quantity + new_quantity
        item.updated_at = datetime.now()
        item.updated_by = db_transaction.updated_by
        db.commit()
        db.refresh(item)
    
    return db_transaction

@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_transaction = db.query(Transactions).filter(Transactions.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_transaction)
    db.commit()
    return RedirectResponse(
        url=f"/inventory/{db_transaction.item_code}", 
        status_code=status.HTTP_303_SEE_OTHER
    )