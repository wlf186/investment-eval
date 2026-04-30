from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.database import AsyncSessionLocal
from backend.models.user import User
from backend.models.portfolio import Portfolio
from backend.models.transaction import Transaction
from backend.services.price_service import price_service


class LeaderboardService:
    async def get_leaderboard(self, limit: int = 10) -> list[dict]:
        """获取TOP N排行榜"""
        async with AsyncSessionLocal() as session:
            # 获取所有用户
            query = select(User)
            result = await session.execute(query)
            users = result.scalars().all()

            rankings = []
            for user in users:
                # 计算用户总资产
                from backend.services.trading_service import trading_service
                portfolio_data = await trading_service.get_portfolio(session, user.id)

                if "error" not in portfolio_data:
                    rankings.append({
                        "user_id": user.id,
                        "name": user.name,
                        "total_value": portfolio_data.get("total_value", user.initial_balance),
                        "initial_balance": portfolio_data.get("total_invested", user.initial_balance),
                        "return_pct": portfolio_data.get("total_pnl_percent", 0.0),
                        "balance": portfolio_data.get("balance", user.current_balance),
                        "holdings_count": len(portfolio_data.get("holdings", []))
                    })

            # 按收益率排序
            rankings.sort(key=lambda x: x["return_pct"], reverse=True)

            # 添加排名
            for i, r in enumerate(rankings[:limit], 1):
                r["rank"] = i

            return rankings[:limit]

leaderboard_service = LeaderboardService()
