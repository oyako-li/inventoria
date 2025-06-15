import sqlite3

# DB初期化
def init_db():
    conn = sqlite3.connect("inventory.db")
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS product (
        qr_code TEXT PRIMARY KEY,
        name TEXT NOT NULL
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        qr_code TEXT PRIMARY KEY,
        quantity INTEGER NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_code TEXT,
        action TEXT,
        quantity INTEGER,
        timestamp TEXT
    )
    """)
    conn.commit()
    conn.close()
