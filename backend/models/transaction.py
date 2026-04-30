from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from backend.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False)
    transaction_type = Column(String, CheckConstraint("transaction_type IN ('buy', 'sell')"))
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    fee_amount = Column(Float, default=0.0)
    spread_cost = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)
    profit_loss = Column(Float, default=0.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
