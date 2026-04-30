import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from backend.database import AsyncSessionLocal
from backend.models.price import Price
from backend.config import settings


class PriceService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_gold_price(self) -> Optional[dict]:
        """获取黄金价格 - 优先 gold-api.com，失败则用备用源"""
        try:
            # 尝试 gold-api.com
            resp = await self.client.get(
                "https://gold-api.com/api/v1/stats",
                headers={"Accept": "application/json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "symbol": "XAU",
                    "name": "Gold",
                    "price": float(data.get("price", 0)),
                    "price_change_24h": float(data.get("change", 0)),
                    "high_24h": float(data.get("high", 0)),
                    "low_24h": float(data.get("low", 0)),
                    "source": "gold-api"
                }
        except Exception:
            pass

        # 备用1：使用 CoinGecko 获取黄金价格
        try:
            resp = await self.client.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_24hr_change=true",
                timeout=5.0
            )
            if resp.status_code == 200:
                data = resp.json()
                gold_data = data.get("tether-gold", {})
                return {
                    "symbol": "XAU",
                    "name": "Gold",
                    "price": float(gold_data.get("usd", 0)),
                    "price_change_24h": float(gold_data.get("usd_24h_change", 0)),
                    "source": "coingecko"
                }
        except Exception:
            pass

        # 备用2：使用 Binance PAXG (Paxos Gold) 作为黄金价格代理
        try:
            resp = await self.client.get(
                "https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT",
                timeout=5.0
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "symbol": "XAU",
                    "name": "Gold",
                    "price": float(data["lastPrice"]),
                    "price_change_24h": float(data["priceChangePercent"]),
                    "high_24h": float(data["highPrice"]),
                    "low_24h": float(data["lowPrice"]),
                    "volume_24h": float(data["volume"]),
                    "source": "binance-paxg"
                }
        except Exception:
            pass

        return None

    async def fetch_crypto_prices(self) -> list[dict]:
        """获取加密货币价格 - 使用 Binance API"""
        results = []
        symbols = [a["symbol"] for a in settings.ASSETS["crypto"]]

        try:
            # Binance 批量查询 - symbols 参数需要 URL 编码的 JSON 数组
            symbols_str = "%5B" + "%2C".join([f"%22{s}%22" for s in symbols]) + "%5D"
            resp = await self.client.get(
                f"https://api.binance.com/api/v3/ticker/24hr?symbols={symbols_str}"
            )
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    symbol = item["symbol"]
                    asset_info = next((a for a in settings.ASSETS["crypto"] if a["symbol"] == symbol), None)
                    if asset_info:
                        results.append({
                            "symbol": symbol,
                            "name": asset_info["name"],
                            "price": float(item["lastPrice"]),
                            "price_change_24h": float(item["priceChangePercent"]),
                            "high_24h": float(item["highPrice"]),
                            "low_24h": float(item["lowPrice"]),
                            "volume_24h": float(item["volume"]),
                            "source": "binance"
                        })
        except Exception as e:
            print(f"Error fetching crypto prices: {e}")

        return results

    async def update_all_prices(self):
        """更新所有资产价格到数据库"""
        async with AsyncSessionLocal() as session:
            # 获取黄金价格
            gold_data = await self.fetch_gold_price()
            if gold_data:
                gold_price = Price(
                    asset_type="gold",
                    symbol=gold_data["symbol"],
                    name=gold_data["name"],
                    price=gold_data["price"],
                    price_change_24h=gold_data.get("price_change_24h"),
                    high_24h=gold_data.get("high_24h"),
                    low_24h=gold_data.get("low_24h"),
                    volume_24h=gold_data.get("volume_24h"),
                    source=gold_data["source"]
                )
                session.add(gold_price)

            # 获取加密货币价格
            crypto_data = await self.fetch_crypto_prices()
            for data in crypto_data:
                crypto_price = Price(
                    asset_type="crypto",
                    symbol=data["symbol"],
                    name=data["name"],
                    price=data["price"],
                    price_change_24h=data.get("price_change_24h"),
                    high_24h=data.get("high_24h"),
                    low_24h=data.get("low_24h"),
                    volume_24h=data.get("volume_24h"),
                    source=data["source"]
                )
                session.add(crypto_price)

            await session.commit()

    async def get_latest_prices(self, session: AsyncSession) -> list[Price]:
        """获取每种资产的最新价格"""
        # 子查询获取每个 symbol 的最新记录
        subq = select(
            Price.symbol,
            func.max(Price.timestamp).label("max_time")
        ).group_by(Price.symbol).subquery()

        query = select(Price).join(
            subq,
            (Price.symbol == subq.c.symbol) & (Price.timestamp == subq.c.max_time)
        )
        result = await session.execute(query)
        return result.scalars().all()

    async def get_price_history(self, session: AsyncSession, symbol: str, hours: int = 24) -> list[Price]:
        """获取指定资产的价格历史"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        query = select(Price).where(
            Price.symbol == symbol,
            Price.timestamp >= cutoff
        ).order_by(Price.timestamp)
        result = await session.execute(query)
        return result.scalars().all()

    async def close(self):
        await self.client.aclose()


price_service = PriceService()
