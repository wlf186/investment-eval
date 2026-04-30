from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.database import get_db
from backend.models.analysis import AnalysisSignal
from backend.models.prediction import Prediction

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/signals/{symbol}")
async def get_analysis_signal(symbol: str, session: AsyncSession = Depends(get_db)):
    """获取资产最新技术分析信号"""
    query = select(AnalysisSignal).where(
        AnalysisSignal.symbol == symbol
    ).order_by(desc(AnalysisSignal.analysis_time)).limit(1)
    result = await session.execute(query)
    signal = result.scalar_one_or_none()

    if not signal:
        return {"error": "No analysis data available"}

    import json
    return {
        "symbol": signal.symbol,
        "analysis_time": signal.analysis_time.isoformat() if signal.analysis_time else None,
        "rsi": signal.rsi,
        "macd": signal.macd,
        "macd_signal": signal.macd_signal,
        "bollinger_bands": {
            "upper": signal.bb_upper,
            "middle": signal.bb_middle,
            "lower": signal.bb_lower
        },
        "ema_12": signal.ema_12,
        "ema_26": signal.ema_26,
        "sma_50": signal.sma_50,
        "trend_direction": signal.trend_direction,
        "signal_strength": signal.signal_strength,
        "key_levels": json.loads(signal.key_levels) if signal.key_levels else None,
        "notes": signal.notes
    }


@router.get("/predictions/{symbol}")
async def get_predictions(symbol: str, session: AsyncSession = Depends(get_db)):
    """获取资产各时间框架预测"""
    query = select(Prediction).where(
        Prediction.symbol == symbol
    ).order_by(desc(Prediction.generated_at))
    result = await session.execute(query)
    predictions = result.scalars().all()

    # 按时间框架分组，取最新
    latest_by_tf = {}
    for p in predictions:
        if p.timeframe not in latest_by_tf:
            latest_by_tf[p.timeframe] = p

    import json
    return {
        "symbol": symbol,
        "predictions": [
            {
                "timeframe": p.timeframe,
                "direction": p.prediction_direction,
                "confidence": p.confidence_percent,
                "predicted_change": p.predicted_change_percent,
                "reasoning": p.reasoning,
                "indicators_used": json.loads(p.indicators_used) if p.indicators_used else None,
                "historical_accuracy": p.historical_accuracy,
                "generated_at": p.generated_at.isoformat() if p.generated_at else None
            }
            for p in latest_by_tf.values()
        ]
    }
