from .inventory import router as inventory_router
from .item import router as item_router
from .supplier import supplier_router, supplier_item_router
from .transaction import router as transaction_router

__all__ = [
    "inventory_router",
    "item_router",
    "supplier_router",
    "supplier_item_router",
    "transaction_router",
]