from sqlalchemy import Column, Integer, String, Float, DateTime, Text, CheckConstraint, Index
from sqlalchemy.sql import func
from backend.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    timeframe = Column(String, CheckConstraint("timeframe IN ('24h', '7d', '30d')"))
    prediction_direction = Column(String, CheckConstraint("prediction_direction IN ('up', 'down', 'neutral')"))
    confidence_percent = Column(Integer, CheckConstraint("confidence_percent BETWEEN 0 AND 100"))
    predicted_change_percent = Column(Float)
    reasoning = Column(Text)
    indicators_used = Column(Text)  # JSON string
    historical_accuracy = Column(Float)

    __table_args__ = (
        Index('idx_predictions_symbol_timeframe', 'symbol', 'timeframe', 'generated_at'),
    )
