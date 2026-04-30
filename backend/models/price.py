from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from sqlalchemy.sql import func
from backend.database import Base


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(String, nullable=False)  # 'gold' or 'crypto'
    symbol = Column(String, nullable=False, index=True)
    name = Column(String)
    price = Column(Float, nullable=False)
    price_change_24h = Column(Float)
    high_24h = Column(Float)
    low_24h = Column(Float)
    volume_24h = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    source = Column(String)

    __table_args__ = (
        Index('idx_prices_symbol_time', 'symbol', 'timestamp'),
    )
