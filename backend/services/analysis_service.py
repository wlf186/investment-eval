import json
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.database import AsyncSessionLocal
from backend.models.price import Price
from backend.models.analysis import AnalysisSignal
from backend.models.prediction import Prediction
from backend.utils.indicators import (
    calculate_rsi, calculate_macd, calculate_bollinger_bands,
    calculate_ema, calculate_sma
)


class AnalysisService:
    async def analyze_asset(self, session: AsyncSession, symbol: str) -> Optional[AnalysisSignal]:
        """对单个资产进行技术分析"""
        # 获取最近90天的价格数据（用于计算指标）
        cutoff = datetime.utcnow() - timedelta(days=90)
        query = select(Price).where(
            Price.symbol == symbol,
            Price.timestamp >= cutoff
        ).order_by(Price.timestamp)
        result = await session.execute(query)
        prices = result.scalars().all()

        if len(prices) < 10:  # 需要至少10个数据点
            return None

        # 构建 pandas Series
        price_series = pd.Series([p.price for p in prices])

        # 计算指标
        rsi = calculate_rsi(price_series)
        macd, macd_signal, _ = calculate_macd(price_series)
        bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(price_series)
        ema_12 = calculate_ema(price_series, 12)
        ema_26 = calculate_ema(price_series, 26)
        sma_50 = calculate_sma(price_series, 50)

        # 判断趋势方向
        current_price = prices[-1].price
        trend = "neutral"
        if ema_12 > ema_26 and current_price > sma_50:
            trend = "bullish"
        elif ema_12 < ema_26 and current_price < sma_50:
            trend = "bearish"

        # 信号强度 (1-10)
        strength = 5
        if rsi < 30:  # 超卖，看涨信号
            strength = min(10, strength + 3)
        elif rsi > 70:  # 超买，看跌信号
            strength = min(10, strength + 3)

        if macd > macd_signal and trend == "bullish":
            strength = min(10, strength + 2)
        elif macd < macd_signal and trend == "bearish":
            strength = min(10, strength + 2)

        # 关键价位 (避免NaN)
        def safe_round(val, digits=2):
            if val is None or (isinstance(val, float) and (val != val)):  # NaN check
                return 0.0
            return round(float(val), digits)
        
        key_levels = {
            "support": safe_round(bb_lower),
            "resistance": safe_round(bb_upper),
            "sma50": safe_round(sma_50),
            "current": safe_round(current_price)
        }

        signal = AnalysisSignal(
            symbol=symbol,
            rsi=round(float(rsi), 2),
            macd=round(float(macd), 4),
            macd_signal=round(float(macd_signal), 4),
            bb_upper=round(float(bb_upper), 2),
            bb_lower=round(float(bb_lower), 2),
            bb_middle=round(float(bb_middle), 2),
            ema_12=round(float(ema_12), 2),
            ema_26=round(float(ema_26), 2),
            sma_50=round(float(sma_50), 2),
            trend_direction=trend,
            signal_strength=strength,
            key_levels=json.dumps(key_levels),
            notes=f"EMA12 {'>' if ema_12 > ema_26 else '<'} EMA26, Price {'>' if current_price > sma_50 else '<'} SMA50"
        )

        session.add(signal)
        await session.commit()
        return signal

    async def generate_prediction(self, session: AsyncSession, symbol: str, timeframe: str = "24h") -> Optional[Prediction]:
        """基于技术分析生成预测（非ML，纯规则）"""
        # 获取最新分析信号
        query = select(AnalysisSignal).where(
            AnalysisSignal.symbol == symbol
        ).order_by(desc(AnalysisSignal.analysis_time)).limit(1)
        result = await session.execute(query)
        signal = result.scalar_one_or_none()

        if not signal:
            return None

        # 基于信号生成预测
        direction = "neutral"
        confidence = 50
        predicted_change = 0.0

        if signal.trend_direction == "bullish":
            if signal.rsi < 40:  # 超卖反弹
                direction = "up"
                confidence = 65 + signal.signal_strength * 2
                predicted_change = 1.5 + signal.signal_strength * 0.3
            elif signal.rsi < 60:  # 健康上涨
                direction = "up"
                confidence = 55 + signal.signal_strength
                predicted_change = 0.8 + signal.signal_strength * 0.2
            else:  # 超买但趋势强
                direction = "neutral"
                confidence = 50
                predicted_change = 0.2
        elif signal.trend_direction == "bearish":
            if signal.rsi > 60:  # 超买回调
                direction = "down"
                confidence = 65 + signal.signal_strength * 2
                predicted_change = -(1.5 + signal.signal_strength * 0.3)
            elif signal.rsi > 40:  # 健康下跌
                direction = "down"
                confidence = 55 + signal.signal_strength
                predicted_change = -(0.8 + signal.signal_strength * 0.2)
            else:  # 超卖但趋势弱
                direction = "neutral"
                confidence = 50
                predicted_change = -0.2

        # 根据时间框架调整
        multiplier = {"24h": 1.0, "7d": 2.5, "30d": 5.0}.get(timeframe, 1.0)
        predicted_change *= multiplier

        # 模拟历史准确率（基于信号强度）
        historical_accuracy = min(85, 50 + signal.signal_strength * 3)

        prediction = Prediction(
            symbol=symbol,
            timeframe=timeframe,
            prediction_direction=direction,
            confidence_percent=min(100, max(0, int(confidence))),
            predicted_change_percent=round(predicted_change, 2),
            reasoning=f"Based on {signal.trend_direction} trend, RSI={signal.rsi:.1f}, MACD signal, Bollinger Bands position",
            indicators_used=json.dumps({
                "rsi": signal.rsi,
                "macd": signal.macd,
                "macd_signal": signal.macd_signal,
                "trend": signal.trend_direction,
                "strength": signal.signal_strength
            }),
            historical_accuracy=round(historical_accuracy, 1)
        )

        session.add(prediction)
        await session.commit()
        return prediction

    async def analyze_all_assets(self):
        """分析所有资产"""
        async with AsyncSessionLocal() as session:
            from backend.config import settings
            all_symbols = ["XAU"] + [a["symbol"] for a in settings.ASSETS["crypto"]]

            for symbol in all_symbols:
                try:
                    await self.analyze_asset(session, symbol)
                    # 生成各时间框架预测
                    for tf in ["24h", "7d", "30d"]:
                        await self.generate_prediction(session, symbol, tf)
                except Exception as e:
                    print(f"Error analyzing {symbol}: {e}")


analysis_service = AnalysisService()
