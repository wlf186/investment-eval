from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.models.user import User
from backend.models.portfolio import Portfolio
from backend.models.transaction import Transaction
from backend.models.price import Price
from backend.config import settings


class TradingService:
    async def get_or_create_user(self, session: AsyncSession, name: str = "default") -> User:
        """获取或创建默认用户"""
        query = select(User).where(User.name == name)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            user = User(name=name, initial_balance=settings.INITIAL_BALANCE, current_balance=settings.INITIAL_BALANCE)
            session.add(user)
            await session.commit()
            await session.refresh(user)

        return user

    async def get_current_price(self, session: AsyncSession, symbol: str) -> Optional[float]:
        """获取资产当前价格"""
        query = select(Price).where(Price.symbol == symbol).order_by(desc(Price.timestamp)).limit(1)
        result = await session.execute(query)
        price = result.scalar_one_or_none()
        return price.price if price else None

    async def buy(self, session: AsyncSession, user_id: int, symbol: str, quantity: float) -> dict:
        """买入资产"""
        # 获取用户
        query = select(User).where(User.id == user_id)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return {"success": False, "error": "User not found"}

        # 获取当前价格
        price = await self.get_current_price(session, symbol)
        if not price:
            return {"success": False, "error": "Price not available"}

        # 计算成本（含点差和手续费）
        spread = settings.SPREAD.get(symbol, settings.SPREAD["default"])
        adjusted_price = price * (1 + spread)  # 买入价 = 市场价 + 点差
        total_amount = adjusted_price * quantity
        fee = total_amount * settings.TAKER_FEE
        net_amount = total_amount + fee

        # 检查余额
        if net_amount > user.current_balance:
            return {"success": False, "error": "Insufficient balance"}

        # 检查最小订单
        if total_amount < settings.MIN_ORDER_USD:
            return {"success": False, "error": f"Minimum order is ${settings.MIN_ORDER_USD}"}

        # 更新用户余额
        user.current_balance -= net_amount

        # 更新或创建持仓
        query = select(Portfolio).where(Portfolio.user_id == user_id, Portfolio.symbol == symbol)
        result = await session.execute(query)
        portfolio = result.scalar_one_or_none()

        if portfolio:
            # 更新现有持仓（加权平均成本）
            total_qty = portfolio.quantity + quantity
            total_cost = portfolio.quantity * portfolio.avg_buy_price + quantity * adjusted_price
            portfolio.quantity = total_qty
            portfolio.avg_buy_price = total_cost / total_qty
            portfolio.total_invested += net_amount
        else:
            portfolio = Portfolio(
                user_id=user_id,
                symbol=symbol,
                asset_name=symbol,
                quantity=quantity,
                avg_buy_price=adjusted_price,
                total_invested=net_amount
            )
            session.add(portfolio)

        # 记录交易
        transaction = Transaction(
            user_id=user_id,
            symbol=symbol,
            transaction_type="buy",
            quantity=quantity,
            price=adjusted_price,
            total_amount=total_amount,
            fee_amount=fee,
            spread_cost=total_amount * spread,
            net_amount=net_amount
        )
        session.add(transaction)

        await session.commit()

        return {
            "success": True,
            "transaction_id": transaction.id,
            "symbol": symbol,
            "quantity": quantity,
            "price": adjusted_price,
            "total": total_amount,
            "fee": fee,
            "net_cost": net_amount,
            "remaining_balance": user.current_balance
        }

    async def sell(self, session: AsyncSession, user_id: int, symbol: str, quantity: float) -> dict:
        """卖出资产"""
        # 获取用户和持仓
        query = select(User).where(User.id == user_id)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return {"success": False, "error": "User not found"}

        query = select(Portfolio).where(Portfolio.user_id == user_id, Portfolio.symbol == symbol)
        result = await session.execute(query)
        portfolio = result.scalar_one_or_none()

        if not portfolio or portfolio.quantity < quantity:
            return {"success": False, "error": "Insufficient holdings"}

        # 获取当前价格
        price = await self.get_current_price(session, symbol)
        if not price:
            return {"success": False, "error": "Price not available"}

        # 计算收入（含点差和手续费）
        spread = settings.SPREAD.get(symbol, settings.SPREAD["default"])
        adjusted_price = price * (1 - spread)  # 卖出价 = 市场价 - 点差
        total_amount = adjusted_price * quantity
        fee = total_amount * settings.TAKER_FEE
        net_amount = total_amount - fee

        # 计算盈亏
        cost_basis = quantity * portfolio.avg_buy_price
        profit_loss = net_amount - cost_basis

        # 更新用户余额
        user.current_balance += net_amount

        # 更新持仓
        portfolio.quantity -= quantity
        if portfolio.quantity == 0:
            portfolio.avg_buy_price = 0
            portfolio.total_invested = 0
        else:
            portfolio.total_invested = portfolio.quantity * portfolio.avg_buy_price

        # 记录交易
        transaction = Transaction(
            user_id=user_id,
            symbol=symbol,
            transaction_type="sell",
            quantity=quantity,
            price=adjusted_price,
            total_amount=total_amount,
            fee_amount=fee,
            spread_cost=total_amount * spread,
            net_amount=net_amount,
            profit_loss=profit_loss
        )
        session.add(transaction)

        await session.commit()

        return {
            "success": True,
            "transaction_id": transaction.id,
            "symbol": symbol,
            "quantity": quantity,
            "price": adjusted_price,
            "total": total_amount,
            "fee": fee,
            "net_revenue": net_amount,
            "profit_loss": profit_loss,
            "remaining_balance": user.current_balance
        }

    async def get_portfolio(self, session: AsyncSession, user_id: int) -> dict:
        """获取用户投资组合"""
        query = select(User).where(User.id == user_id)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return {"error": "User not found"}

        query = select(Portfolio).where(Portfolio.user_id == user_id)
        result = await session.execute(query)
        holdings = result.scalars().all()

        # 计算持仓市值
        total_value = user.current_balance
        holdings_detail = []

        for h in holdings:
            if h.quantity > 0:
                current_price = await self.get_current_price(session, h.symbol)
                market_value = h.quantity * current_price if current_price else 0
                total_value += market_value

                pnl = market_value - h.total_invested if current_price else 0
                pnl_percent = (pnl / h.total_invested * 100) if h.total_invested > 0 else 0

                holdings_detail.append({
                    "symbol": h.symbol,
                    "asset_name": h.asset_name,
                    "quantity": h.quantity,
                    "avg_buy_price": h.avg_buy_price,
                    "current_price": current_price,
                    "market_value": market_value,
                    "total_invested": h.total_invested,
                    "pnl": pnl,
                    "pnl_percent": pnl_percent
                })

        total_invested = user.initial_balance + user.total_deposited
        total_pnl = total_value - total_invested
        total_pnl_percent = (total_pnl / total_invested * 100) if total_invested > 0 else 0

        return {
            "user_id": user_id,
            "balance": user.current_balance,
            "total_value": total_value,
            "total_invested": total_invested,
            "total_pnl": total_pnl,
            "total_pnl_percent": total_pnl_percent,
            "holdings": holdings_detail
        }


trading_service = TradingService()
