from dotenv import load_dotenv
import os
import sqlite3
import uuid
import pytz
load_dotenv()

DB_PATH = os.getenv("DB_PATH")
DIR_SQL = os.getenv("DIR_SQL")
# DATABASE_URL = f"sqlite:///./{DB_PATH}"
DATABASE_URL = os.getenv("DATABASE_URL")
DOMAIN = os.getenv("DOMAIN")
# デフォルトのTEAM_IDを設定
default_team_id = "550e8400-e29b-41d4-a716-446655440000"
team_id_env = os.getenv("TEAM_ID", default_team_id)
try:
    TEAM_ID = uuid.UUID(team_id_env)
except ValueError:
    print(f"Warning: Invalid TEAM_ID '{team_id_env}', using default")
    TEAM_ID = uuid.UUID(default_team_id)
TEAM_NAME = os.getenv("TEAM_NAME")
DEBUG = bool(os.getenv("DEBUG"))
TZ = pytz.timezone("Asia/Tokyo")
# conn = sqlite3.connect(DB_PATH)
