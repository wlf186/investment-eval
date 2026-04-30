from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PORT: int = 30306
    DATABASE_URL: str = "sqlite+aiosqlite:///data/tracker.db"
    PRICE_UPDATE_INTERVAL_MINUTES: int = 30
    ANALYSIS_INTERVAL_HOURS: int = 6

    # API URLs
    GOLD_API_URL: str = "https://gold-api.com/api/v1/stats"
    BINANCE_API_URL: str = "https://api.binance.com"
    COINGECKO_API_URL: str = "https://api.coingecko.com/api/v3"

    # Assets
    ASSETS: dict = {
        "gold": [{"symbol": "XAU", "name": "Gold", "source_priority": ["gold-api", "yfinance", "freegoldapi"]}],
        "crypto": [
            {"symbol": "BTCUSDT", "name": "Bitcoin", "coingecko_id": "bitcoin"},
            {"symbol": "ETHUSDT", "name": "Ethereum", "coingecko_id": "ethereum"},
            {"symbol": "ADAUSDT", "name": "Cardano", "coingecko_id": "cardano"},
            {"symbol": "SOLUSDT", "name": "Solana", "coingecko_id": "solana"},
            {"symbol": "XRPUSDT", "name": "Ripple", "coingecko_id": "ripple"},
            {"symbol": "DOGEUSDT", "name": "Dogecoin", "coingecko_id": "dogecoin"},
            {"symbol": "DOTUSDT", "name": "Polkadot", "coingecko_id": "polkadot"},
            {"symbol": "MATICUSDT", "name": "Polygon", "coingecko_id": "matic-network"},
            {"symbol": "LTCUSDT", "name": "Litecoin", "coingecko_id": "litecoin"},
            {"symbol": "BCHUSDT", "name": "Bitcoin Cash", "coingecko_id": "bitcoin-cash"},
        ]
    }

    # Trading config
    MAKER_FEE: float = 0.0008  # 0.08%
    TAKER_FEE: float = 0.0010  # 0.10%
    SPREAD: dict = {
        "XAU": 0.0003,
        "BTCUSDT": 0.0005,
        "ETHUSDT": 0.0005,
        "default": 0.0008
    }
    MIN_ORDER_USD: float = 10.0
    INITIAL_BALANCE: float = 10000.0


settings = Settings()
