from dotenv import load_dotenv
import os
import sqlite3

load_dotenv()

DB_PATH = os.getenv("DB_PATH")
DIR_SQL = os.getenv("DIR_SQL")
DATABASE_URL = f"sqlite:///./{DB_PATH}"
conn = sqlite3.connect(DB_PATH)
