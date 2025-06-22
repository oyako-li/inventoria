from models.schemas import Transactions, Item
from models.db import get_db
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from typing import List
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from starlette import status


class TransactionBase(BaseModel):
    item_code: str
    item_name: str
    supplier_code: Optional[str] = None
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
def get_transaction_by_item_code(item_code: str, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    if date:
        transaction = db.query(Transactions).filter(Transactions.item_code == item_code, Transactions.updated_at >= date).order_by(Transactions.updated_at.desc()).all()
    else:
        transaction = db.query(Transactions).filter(Transactions.item_code == item_code).order_by(Transactions.updated_at.desc()).all()
    if not transaction:
        return {"status": "error", "message": "Transaction not found"}
    return transaction

@router.get("/supplier/{supplier_code}", response_model=List[TransactionRead])
def get_transaction_by_supplier_code(supplier_code: str, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    if date:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code, Transactions.updated_at >= date).order_by(Transactions.updated_at.desc()).all()
    else:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code).order_by(Transactions.updated_at.desc()).all()
    if not transaction:
        return {"status": "error", "message": "Transaction not found"}
    return transaction

@router.get("/supplier/{supplier_code}/item/{item_code}", response_model=List[TransactionRead])
def get_transaction_by_supplier_code_and_item_code(supplier_code: str, item_code: str, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    if date:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code, Transactions.item_code == item_code, Transactions.updated_at >= date).order_by(Transactions.updated_at.desc()).all()
    else:
        transaction = db.query(Transactions).filter(Transactions.supplier_code == supplier_code, Transactions.item_code == item_code).order_by(Transactions.updated_at.desc()).all()
    if not transaction:
        return {"status": "error", "message": "Transaction not found"}
    return transaction

@router.post("/", response_model=TransactionRead)
def add_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    # トランザクション記録
    new_transaction = Transactions(
        **transaction.dict(),
        updated_at=datetime.now()
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return RedirectResponse(
        url=f"/inventory/{new_transaction.item_code}",
        status_code=status.HTTP_303_SEE_OTHER
    )

@router.put("/")
def update_transaction(transaction: TransactionUpdate, db: Session = Depends(get_db)):
    db_transaction = db.query(Transactions).filter(Transactions.id == transaction.id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    setattr(db_transaction, "updated_at", datetime.now())
    db.commit() 
    db.refresh(db_transaction)
    return RedirectResponse(
        url=f"/inventory/{db_transaction.item_code}",
        status_code=status.HTTP_303_SEE_OTHER
    )

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