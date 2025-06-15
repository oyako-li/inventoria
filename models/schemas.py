from pydantic import BaseModel

# モデル
class Product(BaseModel):
    qr_code: str
    name: str


class InventoryItem(BaseModel):
    qr_code: str
    name: str
    quantity: int
    updated_at: str

class InventoryAction(InventoryItem):
    action: str


class Transaction(BaseModel):
    qr_code: str
    action: str  # "in" or "out"
    quantity: int