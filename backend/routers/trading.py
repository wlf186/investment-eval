from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.services.trading_service import trading_service

router = APIRouter(prefix="/api/trading", tags=["trading"])


@router.post("/buy")
async def buy_asset(symbol: str, quantity: float, session: AsyncSession = Depends(get_db)):
    """买入资产"""
    user = await trading_service.get_or_create_user(session)
    result = await trading_service.buy(session, user.id, symbol, quantity)
    return result


@router.post("/sell")
async def sell_asset(symbol: str, quantity: float, session: AsyncSession = Depends(get_db)):
    """卖出资产"""
    user = await trading_service.get_or_create_user(session)
    result = await trading_service.sell(session, user.id, symbol, quantity)
    return result


@router.get("/portfolio")
async def get_portfolio(session: AsyncSession = Depends(get_db)):
    """获取投资组合"""
    user = await trading_service.get_or_create_user(session)
    result = await trading_service.get_portfolio(session, user.id)
    return result


@router.get("/transactions")
async def get_transactions(limit: int = 50, session: AsyncSession = Depends(get_db)):
    """获取交易历史"""
    from sqlalchemy import select, desc
    from backend.models.transaction import Transaction

    user = await trading_service.get_or_create_user(session)
    query = select(Transaction).where(
        Transaction.user_id == user.id
    ).order_by(desc(Transaction.timestamp)).limit(limit)
    result = await session.execute(query)
    transactions = result.scalars().all()

    return {
        "transactions": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "type": t.transaction_type,
                "quantity": t.quantity,
                "price": t.price,
                "total": t.total_amount,
                "fee": t.fee_amount,
                "profit_loss": t.profit_loss,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None
            }
            for t in transactions
        ]
    }
