from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, ForeignKeyConstraint, UniqueConstraint, PrimaryKeyConstraint
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy.sql import func
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
Base = declarative_base()

class ActionType(enum.Enum):
    IN = "IN"
    OUT = "OUT"
    
    @classmethod
    def _missing_(cls, value):
        # 小文字の値を大文字に変換して処理
        if isinstance(value, str):
            upper_value = value.upper()
            if upper_value in cls._value2member_map_:
                return cls._value2member_map_[upper_value]
        return None

class RoleEnum(enum.Enum):
    owner = 'owner'
    admin = 'admin'
    member = 'member'

class SettlementStatus(enum.Enum):
    PENDING = '未払い'
    PAID = '手続き済み'
    CANCELLED = 'キャンセル'

    
    @classmethod
    def names(cls) -> list:
        # Enum定義が増えても対応可能
        return [i.name for i in cls]
    
    @classmethod
    def values(cls) -> list:
        # Enum定義が増えても対応可能
        return [i.value for i in cls]

class SettlementType(enum.Enum):
    IN = '入金'
    OUT = '出金'

    
    @classmethod
    def names(cls) -> list:
        # Enum定義が増えても対応可能
        return [i.name for i in cls]
    
    @classmethod
    def values(cls) -> list:
        # Enum定義が増えても対応可能
        return [i.value for i in cls]

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    # 関連
    teams = relationship("TeamMember", back_populates="user")


class Team(Base):
    __tablename__ = 'teams'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # 関連
    members = relationship("TeamMember", back_populates="team")
    items = relationship("Item", back_populates="team")
    transactions = relationship("Transactions", back_populates="team")
    suppliers = relationship("Supplier", back_populates="team")
    supplier_items = relationship("SupplierItem", back_populates="team")


class TeamMember(Base):
    __tablename__ = 'team_members'
    __table_args__ = (
        UniqueConstraint('user_id', 'team_id', name='uq_user_team'),
    )

    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    team_id = Column(Integer, ForeignKey('teams.id', ondelete="CASCADE"), primary_key=True)
    role = Column(Enum(RoleEnum, native_enum=False), nullable=False, default=RoleEnum.member)

    user = relationship("User", back_populates="teams")
    team = relationship("Team", back_populates="members")


class Item(Base):
    __tablename__ = 'item'

    item_code = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(Integer, ForeignKey('teams.id', ondelete="CASCADE"), nullable=False)
    item_name = Column(String, nullable=False)
    item_price = Column(Float, nullable=True)
    item_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=False)
    transactions = relationship("Transactions", back_populates="item")
    supplier_items = relationship("SupplierItem", back_populates="item")
    team = relationship("Team", back_populates="items")

class Transactions(Base):
    __tablename__ = 'transactions'
    __table_args__ = (
        ForeignKeyConstraint(['item_code'], ['item.item_code'], ondelete="CASCADE"),
        ForeignKeyConstraint(['supplier_code', 'supplier_type'], ['supplier.supplier_code', 'supplier.supplier_type'], ondelete="CASCADE"),
    )

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey('teams.id', ondelete="CASCADE"), nullable=False)
    item_code = Column(UUID, nullable=True)
    item_name = Column(String, nullable=True)
    supplier_code = Column(UUID, nullable=True)
    supplier_type = Column(Enum(ActionType, native_enum=False), nullable=True, default=ActionType.IN)
    supplier_name = Column(String, nullable=True)
    action = Column(Enum(ActionType, native_enum=False), nullable=False, default=ActionType.IN)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=False)
    item = relationship("Item", foreign_keys=[item_code], back_populates="transactions")
    supplier = relationship(
        "Supplier",
        foreign_keys=[supplier_code, supplier_type],
        back_populates="transactions"
    )
    team = relationship("Team", back_populates="transactions")

class SupplierItem(Base):
    __tablename__ = 'supplier_item'
    __table_args__ = (
        ForeignKeyConstraint(['item_code'], ['item.item_code'], ondelete="CASCADE"),
        ForeignKeyConstraint(['supplier_code', 'supplier_type'], ['supplier.supplier_code', 'supplier.supplier_type'], ondelete="CASCADE"),
    )

    team_id = Column(Integer, ForeignKey('teams.id', ondelete="CASCADE"), nullable=False)
    item_code = Column(UUID, primary_key=True)
    item_name = Column(String, nullable=True)
    supplier_code = Column(UUID, primary_key=True)
    supplier_type = Column(Enum(ActionType, native_enum=False), primary_key=True, nullable=False, default=ActionType.IN)
    supplier_name = Column(String, nullable=True)
    lot_price = Column(Float, nullable=True)
    lot_size = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=False)
    supplier = relationship(
        "Supplier",
        foreign_keys=[supplier_code, supplier_type],
        back_populates="supplier_items"
    )
    item = relationship("Item", foreign_keys=[item_code], back_populates="supplier_items")
    team = relationship("Team", back_populates="supplier_items")
    

class Supplier(Base):
    __tablename__ = 'supplier'

    supplier_code = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(Integer, ForeignKey('teams.id', ondelete="CASCADE"), nullable=False)
    supplier_type = Column(Enum(ActionType, native_enum=False), primary_key=True, nullable=False, default=ActionType.IN)
    supplier_name = Column(String, nullable=False)
    supplier_address = Column(String, nullable=True)
    supplier_description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by = Column(String, nullable=False)
    transactions = relationship("Transactions", back_populates="supplier")
    
    supplier_items = relationship(
        "SupplierItem",
        foreign_keys=[SupplierItem.supplier_code, SupplierItem.supplier_type],
        back_populates="supplier"
    )
    team = relationship("Team", back_populates="suppliers")

class SupplierMaster(Base):
    __tablename__ = 'supplier_master'
    __table_args__ = (
        PrimaryKeyConstraint('team_id', 'supplier_code'),
        # UniqueConstraint('supplier_code', name='supplier_master'),
    )

    team_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_code = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_name = Column(String, nullable=False)
    bank_from = Column(String, nullable=True)
    bank_to = Column(String, nullable=True)
    note = Column(String, nullable=True)
    account_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    settlements = relationship("Settlement", back_populates="supplier")

class Settlement(Base):
    __tablename__ = 'settlement'
    __table_args__ = (
        ForeignKeyConstraint(['supplier_code'], ['supplier_master.supplier_code']),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(UUID(as_uuid=True), nullable=False)
    supplier_code = Column(UUID(as_uuid=True), nullable=False)
    supplier_name = Column(String, nullable=False)
    bank_from = Column(String, nullable=True)
    bank_to = Column(String, nullable=True)
    note = Column(String, nullable=True)
    account_name = Column(String, nullable=True)
    status = Column(String, nullable=False, default=SettlementStatus.PENDING.value)
    amount = Column(Integer, nullable=False)
    commission = Column(Integer, nullable=False)
    settlement_date = Column(DateTime, nullable=False)
    settlement_type = Column(String, nullable=False, default=SettlementType.OUT.value)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())  
    updated_by = Column(String, nullable=False)

    supplier = relationship("SupplierMaster", back_populates="settlements")
