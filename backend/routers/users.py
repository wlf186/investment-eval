from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models.user import User
from backend.services.trading_service import trading_service
from sqlalchemy import select

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/")
async def create_user(name: str, initial_balance: float = 10000.0, session: AsyncSession = Depends(get_db)):
    """创建新用户"""
    # 检查用户名是否已存在
    query = select(User).where(User.name == name)
    result = await session.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        return {"error": "Username already exists", "user_id": existing.id}

    user = User(name=name, initial_balance=initial_balance, current_balance=initial_balance)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "user_id": user.id,
        "name": user.name,
        "initial_balance": user.initial_balance,
        "current_balance": user.current_balance,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.get("/{user_id}")
async def get_user(user_id: int, session: AsyncSession = Depends(get_db)):
    """获取用户信息"""
    query = select(User).where(User.id == user_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        return {"error": "User not found"}

    # 获取portfolio数据
    portfolio = await trading_service.get_portfolio(session, user_id)

    return {
        "user_id": user.id,
        "name": user.name,
        "initial_balance": user.initial_balance,
        "current_balance": user.current_balance,
        "total_value": portfolio.get("total_value", user.current_balance),
        "total_pnl": portfolio.get("total_pnl", 0),
        "total_pnl_percent": portfolio.get("total_pnl_percent", 0),
        "holdings_count": len(portfolio.get("holdings", [])),
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.get("/")
async def list_users(session: AsyncSession = Depends(get_db)):
    """列出所有用户"""
    query = select(User).order_by(User.id)
    result = await session.execute(query)
    users = result.scalars().all()

    return {
        "users": [
            {
                "user_id": u.id,
                "name": u.name,
                "initial_balance": u.initial_balance,
                "current_balance": u.current_balance,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }
