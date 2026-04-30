from sqlalchemy import Column, Integer, String, Float, DateTime, Text, CheckConstraint
from sqlalchemy.sql import func
from backend.database import Base


class AnalysisSignal(Base):
    __tablename__ = "analysis_signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    analysis_time = Column(DateTime(timezone=True), server_default=func.now())
    rsi = Column(Float)
    macd = Column(Float)
    macd_signal = Column(Float)
    bb_upper = Column(Float)
    bb_lower = Column(Float)
    bb_middle = Column(Float)
    ema_12 = Column(Float)
    ema_26 = Column(Float)
    sma_50 = Column(Float)
    trend_direction = Column(String, CheckConstraint("trend_direction IN ('bullish', 'bearish', 'neutral')"))
    signal_strength = Column(Integer, CheckConstraint("signal_strength BETWEEN 1 AND 10"))
    key_levels = Column(Text)  # JSON string
    notes = Column(Text)
