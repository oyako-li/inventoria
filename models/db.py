from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from models.config import DATABASE_URL
from models.schemas import Base

# 

# engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
engine =create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
# Base.metadata.create_all(bind=engine)  # 手動マイグレーションのため無効化

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()