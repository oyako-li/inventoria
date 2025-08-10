# auth.py
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from authlib.integrations.starlette_client import OAuth
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from models.db import get_db
from models.schemas import User
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()

router = APIRouter()
oauth = OAuth()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

# JWT設定
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Google OAuth設定
CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url=CONF_URL,
    client_kwargs={
        'scope': 'openid email profile'
    }
)

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # ハッシュが認識できない場合やエラーが発生した場合はFalseを返す
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError as e:
        print(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        print(f"User not found for email: {email}")
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/api/auth/register")
async def register(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    
    if not all([name, email, password]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # 既存ユーザーチェック
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 新規ユーザー作成
    hashed_password = get_password_hash(password)
    user = User(
        name=name,
        email=email,
        password_hash=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # アクセストークン作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "user"
        }
    }

@router.post("/api/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    
    if not all([email, password]):
        raise HTTPException(status_code=400, detail="Missing email or password")
    
    # ユーザー認証
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # アクセストークン作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "user"
        }
    }

@router.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": "user"
    }

@router.get("/api/auth/test")
async def test_auth(request: Request, current_user: User = Depends(get_current_user)):
    team_id = request.headers.get('X-Team-ID')
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": "user"
        },
        "team_id": team_id,
        "headers": dict(request.headers)
    }

@router.get("/login")
async def google_login(request: Request):
    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)

    # DBに存在しなければ登録
    user = db.query(User).filter(User.email == user_info['email']).first()
    if not user:
        user = User(
            name=user_info['name'],
            email=user_info['email'],
            password_hash='sso'  # パスワードは使わない
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # JWTトークン作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return RedirectResponse(url=f"/dashboard?token={access_token}")
