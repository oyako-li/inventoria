# team.py
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models.db import get_db
from models.schemas import User, Team, TeamMember, RoleEnum
from router.auth import get_current_user, create_access_token
from datetime import datetime, timedelta
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
security = HTTPBearer()

@router.post("/api/teams/create")
async def create_team(
    request: Request, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """新しいチームを作成"""
    body = await request.json()
    team_name = body.get("name")
    description = body.get("description", "")
    
    if not team_name:
        raise HTTPException(status_code=400, detail="チーム名は必須です")
    
    # チームを作成
    team = Team(
        name=team_name,
        description=description
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # 作成者をチームのオーナーとして追加
    team_member = TeamMember(
        user_id=current_user.id,
        team_id=team.id,
        role=RoleEnum.owner
    )
    db.add(team_member)
    db.commit()
    
    return {
        "team": {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "created_at": team.created_at
        },
        "message": "チームが作成されました"
    }

@router.get("/api/teams/my")
async def get_my_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザーが所属するチーム一覧を取得"""
    teams = db.query(Team).join(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).all()
    
    return {
        "teams": [
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "created_at": team.created_at
            }
            for team in teams
        ]
    }

@router.get("/api/teams/{team_id}/members")
async def get_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """チームメンバー一覧を取得"""
    # ユーザーがチームに所属しているかチェック
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="このチームにアクセスする権限がありません")
    
    # チームメンバーを取得
    members = db.query(TeamMember, User).join(User).filter(
        TeamMember.team_id == team_id
    ).all()
    
    return {
        "members": [
            {
                "user_id": member.User.id,
                "name": member.User.name,
                "email": member.User.email,
                "role": member.TeamMember.role.value,
                "joined_at": member.TeamMember.created_at if hasattr(member.TeamMember, 'created_at') else None
            }
            for member in members
        ]
    }

@router.post("/api/teams/{team_id}/invite")
async def invite_member(
    team_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """チームメンバーを招待"""
    body = await request.json()
    email = body.get("email")
    role = body.get("role", "member")
    
    if not email:
        raise HTTPException(status_code=400, detail="メールアドレスは必須です")
    
    # ユーザーがチームのオーナーまたは管理者かチェック
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if not membership or membership.role not in [RoleEnum.owner, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="メンバーを招待する権限がありません")
    
    # 招待するユーザーが存在するかチェック
    invited_user = db.query(User).filter(User.email == email).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="指定されたメールアドレスのユーザーが見つかりません")
    
    # 既にチームメンバーかチェック
    existing_member = db.query(TeamMember).filter(
        TeamMember.user_id == invited_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="このユーザーは既にチームメンバーです")
    
    # チームメンバーとして追加
    try:
        role_enum = RoleEnum(role)
    except ValueError:
        role_enum = RoleEnum.member
    
    team_member = TeamMember(
        user_id=invited_user.id,
        team_id=team_id,
        role=role_enum
    )
    db.add(team_member)
    db.commit()
    
    return {
        "message": f"{invited_user.name}をチームに招待しました",
        "member": {
            "user_id": invited_user.id,
            "name": invited_user.name,
            "email": invited_user.email,
            "role": role_enum.value
        }
    }

@router.delete("/api/teams/{team_id}/members/{user_id}")
async def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """チームメンバーを削除"""
    # ユーザーがチームのオーナーまたは管理者かチェック
    membership = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if not membership or membership.role not in [RoleEnum.owner, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="メンバーを削除する権限がありません")
    
    # 削除対象のメンバーシップを取得
    target_membership = db.query(TeamMember).filter(
        TeamMember.user_id == user_id,
        TeamMember.team_id == team_id
    ).first()
    
    if not target_membership:
        raise HTTPException(status_code=404, detail="指定されたメンバーが見つかりません")
    
    # オーナーは自分を削除できない
    if target_membership.role == RoleEnum.owner:
        raise HTTPException(status_code=400, detail="オーナーは削除できません")
    
    # メンバーシップを削除
    db.delete(target_membership)
    db.commit()
    
    return {"message": "メンバーを削除しました"}

@router.post("/api/teams/{team_id}/join")
async def join_team(
    team_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """チームに参加（招待コードまたは直接参加）"""
    body = await request.json()
    invite_code = body.get("invite_code")
    
    # チームが存在するかチェック
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="チームが見つかりません")
    
    # 既にメンバーかチェック
    existing_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.team_id == team_id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="既にチームメンバーです")
    
    # 招待コードの検証（簡易版）
    if invite_code:
        # ここで招待コードの検証ロジックを実装
        # 現在は簡易的にチームIDと一致するかチェック
        if str(team_id) != invite_code:
            raise HTTPException(status_code=400, detail="無効な招待コードです")
    
    # チームメンバーとして追加
    team_member = TeamMember(
        user_id=current_user.id,
        team_id=team_id,
        role=RoleEnum.member
    )
    db.add(team_member)
    db.commit()
    
    return {
        "message": f"{team.name}に参加しました",
        "team": {
            "id": team.id,
            "name": team.name,
            "description": team.description
        }
    } 