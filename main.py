# main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import List
from datetime import datetime
import os
import sqlite3
from models.schemas import Product, InventoryItem, InventoryAction, Transaction
from models.db import init_db

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Jinja2 templates
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

app.mount("/static", StaticFiles(directory="static"), name="static")

init_db()




@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("QRコード在庫管理アプリ.html", {"request": request})


@app.get("/inventory", response_model=List[InventoryItem])
def get_inventory():
    conn = sqlite3.connect("inventory.db")
    cur = conn.cursor()
    cur.execute("""
    SELECT p.qr_code, p.name, i.quantity, i.updated_at
    FROM inventory i
    JOIN product p ON p.qr_code = i.qr_code
    """)
    rows = cur.fetchall()
    conn.close()
    return [InventoryItem(qr_code=r[0], name=r[1], quantity=r[2], updated_at=r[3]) for r in rows]


@app.post("/inventory")
def add_inventory(inventory: InventoryAction):
    conn = sqlite3.connect("inventory.db")
    cur = conn.cursor()
    if inventory.action == "create":
        cur.execute("INSERT INTO inventory (qr_code, quantity, updated_at) VALUES (?, ?, ?)", (inventory.qr_code, inventory.quantity, inventory.updated_at))
    elif inventory.action == "in":
        cur.execute("UPDATE inventory SET quantity = quantity + ?, updated_at = ? WHERE qr_code = ?", (inventory.quantity, inventory.updated_at, inventory.qr_code))
    elif inventory.action == "out":
        cur.execute("UPDATE inventory SET quantity = quantity - ?, updated_at = ? WHERE qr_code = ?", (inventory.quantity, inventory.updated_at, inventory.qr_code))
    elif inventory.action == "delete":
        cur.execute("DELETE FROM inventory WHERE qr_code = ?", (inventory.qr_code,))
    conn.commit()
    conn.close()
    return {"message": "在庫を追加しました"}


@app.post("/product")
def add_product(product: Product):
    conn = sqlite3.connect("inventory.db")
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO product (qr_code, name) VALUES (?, ?)", (product.qr_code, product.name))
        cur.execute("INSERT INTO inventory (qr_code, quantity, updated_at) VALUES (?, ?, ?)",
                    (product.qr_code, 0, datetime.now().isoformat()))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="QRコードはすでに存在します")
    finally:
        conn.close()
    return {"message": "商品を追加しました"}


@app.post("/transaction")
def process_transaction(tx: Transaction):
    conn = sqlite3.connect("inventory.db")
    cur = conn.cursor()
    cur.execute("SELECT quantity FROM inventory WHERE qr_code = ?", (tx.qr_code,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="在庫が見つかりません")

    quantity = row[0]
    if tx.action == "in":
        quantity += tx.quantity
    elif tx.action == "out":
        if quantity < tx.quantity:
            raise HTTPException(status_code=400, detail="在庫が不足しています")
        quantity -= tx.quantity
    else:
        raise HTTPException(status_code=400, detail="不明なアクション")

    now = datetime.now().isoformat()
    cur.execute("UPDATE inventory SET quantity = ?, updated_at = ? WHERE qr_code = ?",
                (quantity, now, tx.qr_code))
    cur.execute("INSERT INTO transactions (qr_code, action, quantity, timestamp) VALUES (?, ?, ?, ?)",
                (tx.qr_code, tx.action, tx.quantity, now))
    conn.commit()
    conn.close()
    return {"message": f"{tx.action}処理が完了しました"}
