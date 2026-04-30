from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    initial_balance = Column(Float, default=10000.0)
    current_balance = Column(Float, default=10000.0)
    total_deposited = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
