from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.services.price_service import price_service

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("/latest")
async def get_latest_prices(session: AsyncSession = Depends(get_db)):
    """获取所有资产最新价格"""
    prices = await price_service.get_latest_prices(session)
    return {
        "prices": [
            {
                "symbol": p.symbol,
                "name": p.name,
                "price": p.price,
                "change_24h": p.price_change_24h,
                "high_24h": p.high_24h,
                "low_24h": p.low_24h,
                "volume_24h": p.volume_24h,
                "timestamp": p.timestamp.isoformat() if p.timestamp else None,
                "asset_type": p.asset_type
            }
            for p in prices
        ]
    }


@router.get("/history/{symbol}")
async def get_price_history(symbol: str, hours: int = 24, session: AsyncSession = Depends(get_db)):
    """获取指定资产价格历史"""
    history = await price_service.get_price_history(session, symbol, hours)
    return {
        "symbol": symbol,
        "data_points": len(history),
        "history": [
            {
                "price": p.price,
                "timestamp": p.timestamp.isoformat() if p.timestamp else None
            }
            for p in history
        ]
    }
