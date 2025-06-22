from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, ForeignKeyConstraint
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy.sql import func
import uuid
from sqlalchemy.orm import relationship

Base = declarative_base()

class ActionType(Enum):
    IN = "IN"
    OUT = "OUT"

class Item(Base):
    __tablename__ = 'item'

    item_code = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4())[:8])
    item_name = Column(String, nullable=False)
    item_price = Column(Float, nullable=True)
    item_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())
    updated_by = Column(String, nullable=False)
    transactions = relationship("Transactions", back_populates="item")
    supplier_items = relationship("SupplierItem", back_populates="item")

class Transactions(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String, ForeignKey("item.item_code"), nullable=False)
    item_name = Column(String, nullable=True)
    supplier_code = Column(String, ForeignKey("supplier.supplier_code"), nullable=True)
    supplier_name = Column(String, nullable=True)
    action = Column(String, default="IN", nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=func.now())
    updated_by = Column(String, nullable=False)
    item = relationship("Item", back_populates="transactions")
    supplier = relationship("Supplier", back_populates="transactions")


class Supplier(Base):
    __tablename__ = 'supplier'

    supplier_code = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4())[:8])
    supplier_type = Column(String, primary_key=True, default="OUT", nullable=False)
    supplier_name = Column(String, nullable=False)
    supplier_address = Column(String, nullable=True)
    supplier_description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=func.now())
    updated_by = Column(String, nullable=False)
    transactions = relationship("Transactions", back_populates="supplier")
    
    supplier_items = relationship(
        "SupplierItem",
        foreign_keys="[SupplierItem.supplier_code, SupplierItem.supplier_type]",
        back_populates="supplier"
    )

class SupplierItem(Base):
    __tablename__ = 'supplier_item'

    item_code = Column(String, ForeignKey('item.item_code'), primary_key=True)
    supplier_code = Column(String, ForeignKey('supplier.supplier_code'), primary_key=True)
    supplier_type = Column(String, ForeignKey('supplier.supplier_type'), primary_key=True)
    lot_price = Column(Float, nullable=True)
    lot_size = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=func.now())
    updated_by = Column(String, nullable=False)
    __table_args__ = (
        ForeignKeyConstraint(
            ['supplier_code', 'supplier_type'],
            ['supplier.supplier_code', 'supplier.supplier_type']
        ),
    )
    supplier = relationship(
        "Supplier",
        foreign_keys=[supplier_code, supplier_type],
        back_populates="supplier_items"
    )
    item = relationship("Item", back_populates="supplier_items")