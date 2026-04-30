# Gold & Crypto Tracker - 完整开发方案

## 1. 项目概述与核心需求

### 1.1 目标
构建一个本地部署的黄金（XAU/USD）与主流加密货币（BTC、ETH等）实时追踪与模拟交易系统，以现代数据看板形式呈现，集成纯技术分析驱动的预测能力，无需任何第三方API Key或大模型服务。

### 1.2 核心需求清单

| 需求ID | 需求描述 | 验收标准 |
|--------|----------|----------|
| R1 | 实时价格追踪 | 30分钟粒度采集黄金和加密货币价格数据，首页展示实时价格卡片 |
| R2 | 现代美观报表 | 使用专业金融图表（K线/折线图）、数据卡片、趋势指标展示 |
| R3 | 本地部署 | 系统运行在 `http://localhost:30305`，提供一键启动/停止脚本 |
| R4 | 6小时波动分析 | 每6小时自动分析价格数据，基于技术指标生成上涨/下跌信号 |
| R5 | 多时间维度预测 | 预测未来24小时/7天/1个月的涨跌比例及理由，不依赖大模型 |
| R6 | 零API Key依赖 | 所有数据从公开端点获取，系统运行无需输入任何第三方服务API Key |
| R7 | 合规数据获取 | 仅使用交易所/数据平台公开的API端点，遵守速率限制，不做网页爬取 |
| R8 | 模拟交易 | 用户输入名字+初始本金即可交易，买卖各种资产，参考主流交易所手续费/点差 |
| R9 | 用户排名展示 | 首页展示当前用户信息（名字、本金、收益率）和TOP10排行榜 |

---

## 2. 技术架构选型

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                         │
│  Next.js 14 + React 18 + Tailwind CSS + shadcn/ui + Recharts   │
│  ├─ 实时价格看板 Dashboard                                     │
│  ├─ 资产详情页 (K线图 + 技术指标)                              │
│  ├─ 预测分析页 (24h/7d/30d 预测卡片)                           │
│  ├─ 模拟交易页 (买卖界面 + 持仓管理)                            │
│  └─ 排行榜页 (TOP10 + 个人资产)                                │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP REST API (JSON)
┌────────────────────────▼────────────────────────────────────────┐
│                        后端层 (Backend)                          │
│                    Python FastAPI (异步)                        │
│  ├─ /api/prices          - 获取实时/历史价格                     │
│  ├─ /api/analysis        - 获取技术分析信号                      │
│  ├─ /api/predictions     - 获取多时间维度预测                    │
│  ├─ /api/trade           - 模拟交易接口 (买入/卖出)               │
│  ├─ /api/portfolio       - 用户资产/持仓查询                     │
│  └─ /api/leaderboard     - 排行榜数据                          │
│                                                                 │
│  定时任务调度 (APScheduler):                                   │
│  ├─ price_collector      - 每30分钟采集价格                     │
│  └─ volatility_analyzer  - 每6小时分析波动并生成预测              │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQLAlchemy ORM
┌────────────────────────▼────────────────────────────────────────┐
│                      数据层 (Data Layer)                         │
│                      SQLite (单文件数据库)                       │
│  ├─ prices table         - 价格历史数据                          │
│  ├─ predictions table    - 预测结果记录                          │
│  ├─ users table          - 模拟交易用户信息                       │
│  ├─ portfolios table     - 用户持仓                              │
│  └─ transactions table   - 交易记录                              │
└─────────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      外部数据源 (Public APIs)                    │
│  ├─ Binance Public API    - BTC/ETH/ADA/SOL等实时价格            │
│  │   GET /api/v3/ticker/24hr (无需认证)                        │
│  ├─ CoinGecko Demo API    - 加密货币历史数据 + 简单价格          │
│  │   GET /api/v3/simple/price (无需API Key)                    │
│  ├─ gold-api.com          - 黄金实时价格 (免费, 无Key)          │
│  │   GET https://gold-api.com/api/v1/stats                    │
│  └─ freegoldapi.com       - 黄金CSV历史数据 (备选)               │
│      GET https://freegoldapi.com/data/latest.csv              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选型理由

| 层次 | 选型 | 备选 | 选型理由 |
|------|------|------|----------|
| 前端框架 | **Next.js 14** (App Router) | React SPA | 全栈能力、API路由、SSR优化首屏、现代React特性 |
| 前端样式 | **Tailwind CSS** + shadcn/ui | Bootstrap/MUI | 高度可定制、低饱和现代设计、组件丰富 |
| 图表库 | **Recharts** + Lightweight Charts | D3.js/ECharts | React原生集成、金融图表支持、性能优秀 |
| 后端框架 | **FastAPI** | Flask/Express | 异步高性能、自动OpenAPI文档、Pydantic类型安全 |
| 数据库 | **SQLite** | PostgreSQL | 零配置、单文件、本地部署友好、足够支撑本项目 |
| ORM | **SQLAlchemy 2.0** | Peewee/Tortoise | Python标准、支持异步、成熟稳定 |
| 定时任务 | **APScheduler** | Celery/Node-cron | Python原生、调度灵活、与FastAPI集成简单 |
| HTTP客户端 | **httpx** (异步) | requests/aiohttp | 异步支持、现代Python标准、性能优秀 |
| 部署方式 | **Uvicorn** (ASGI) | Gunicorn | FastAPI原生支持、轻量、生产级 |

---

## 3. 数据源配置（核心 - 无需API Key）

### 3.1 黄金数据源

**主数据源: gold-api.com**
```
端点: GET https://gold-api.com/api/v1/stats
响应: JSON
字段: { "price": 2341.50, "symbol": "XAU", "currency": "USD", ... }
特点: 免费、无需API Key、CORS已启用、无速率限制
频率: 每30分钟调用一次
```

**备用数据源: freegoldapi.com (CSV)**
```
端点: GET https://freegoldapi.com/data/latest.csv
响应: CSV格式 (日期, 价格)
用途: 补充历史数据或主源失效时切换
```

**Yahoo Finance (via yfinance Python库)**
```python
import yfinance as yf
gold = yf.Ticker("GC=F")  # 黄金期货
data = gold.history(period="1d", interval="30m")
```

### 3.2 加密货币数据源

**主数据源: Binance Public API**
```
端点: GET https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","ADAUSDT","SOLUSDT","XRPUSDT","DOGEUSDT","DOTUSDT","MATICUSDT","LTCUSDT","BCHUSDT"]
响应: JSON数组
字段: { "symbol": "BTCUSDT", "lastPrice": "67321.45", "priceChangePercent": "2.34", "highPrice": "...", "lowPrice": "...", "volume": "..." }
特点: 完全公开、无需认证、速率限制 1200 req/min (足够)
频率: 每30分钟调用一次
文档: https://binance-docs.github.io/apidocs/spot/en/#24hr-ticker-price-change-statistics
```

**备用数据源: CoinGecko Demo API**
```
端点: GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,solana,ripple,dogecoin,polkadot,matic-network,litecoin,bitcoin-cash&vs_currencies=usd&include_24hr_change=true
响应: JSON
字段: { "bitcoin": { "usd": 67321.45, "usd_24h_change": 2.34 } }
特点: 公开端点、无需API Key、速率限制约30 calls/min (注意限制)
用途: Binance不可用时降级使用
```

### 3.3 数据源轮换与容错机制

```python
# 数据源优先级与降级策略
GOLD_SOURCES = [
    {"name": "gold-api", "url": "https://gold-api.com/api/v1/stats", "type": "json"},
    {"name": "yfinance", "ticker": "GC=F", "type": "library"},
    {"name": "freegoldapi", "url": "https://freegoldapi.com/data/latest.csv", "type": "csv"},
]

CRYPTO_SOURCES = [
    {"name": "binance", "url": "https://api.binance.com/api/v3/ticker/24hr", "type": "json"},
    {"name": "coingecko", "url": "https://api.coingecko.com/api/v3/simple/price", "type": "json"},
]
```

**关键规则：**
- 每次采集尝试主源，失败（网络错误/5xx/超时）后自动切换备用源
- **不同数据源并行请求**（黄金和加密货币同时获取，互不等待）
- 同一数据源链内降级重试时间隔 1 秒——仍然远低于所有平台的速率限制
- 不使用任何认证头（API Key、Bearer Token等）
- 响应数据本地缓存30分钟，减少外部请求

> **频率说明**：每30分钟仅发起 2~4 个 GET 请求，远低于 Binance（1200 req/min）和 CoinGecko（~30 req/min）的速率限制，属于极低速友好调用。

---

## 4. 数据库设计

### 4.1 表结构（SQLite）

```sql
-- 价格历史表
CREATE TABLE prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_type TEXT NOT NULL CHECK(asset_type IN ('gold', 'crypto')),  -- 'gold' 或 'crypto'
    symbol TEXT NOT NULL,  -- 'XAU', 'BTCUSDT', 'ETHUSDT' 等
    name TEXT,             -- 'Gold', 'Bitcoin', 'Ethereum'
    price REAL NOT NULL,
    price_change_24h REAL, -- 24小时变化百分比
    high_24h REAL,
    low_24h REAL,
    volume_24h REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT            -- 数据来源: 'binance', 'gold-api', 'coingecko'
);
CREATE INDEX idx_prices_symbol_time ON prices(symbol, timestamp);

-- 技术分析信号表 (每6小时生成)
CREATE TABLE analysis_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    analysis_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    rsi REAL,
    macd REAL,
    macd_signal REAL,
    bb_upper REAL,
    bb_lower REAL,
    bb_middle REAL,
    ema_12 REAL,
    ema_26 REAL,
    sma_50 REAL,
    trend_direction TEXT CHECK(trend_direction IN ('bullish', 'bearish', 'neutral')),
    signal_strength INTEGER CHECK(signal_strength BETWEEN 1 AND 10),
    key_levels TEXT,        -- JSON: {"support": [...], "resistance": [...]}
    notes TEXT              -- 分析摘要
);

-- 预测结果表
CREATE TABLE predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeframe TEXT CHECK(timeframe IN ('24h', '7d', '30d')),  -- 预测时间维度
    prediction_direction TEXT CHECK(prediction_direction IN ('up', 'down', 'neutral')),
    confidence_percent INTEGER CHECK(confidence_percent BETWEEN 0 AND 100),
    predicted_change_percent REAL,  -- 预测涨跌幅度百分比
    reasoning TEXT,                -- 预测理由文本
    indicators_used TEXT,          -- JSON: 使用的指标和信号
    historical_accuracy REAL        -- 该资产该时间维度的历史准确率
);

-- 用户表 (模拟交易)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,     -- 用户名，无需密码
    initial_balance REAL NOT NULL DEFAULT 10000.0,  -- 初始本金 (USD)
    current_balance REAL NOT NULL DEFAULT 10000.0,  -- 当前可用余额
    total_deposited REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 持仓表
CREATE TABLE portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    asset_name TEXT,
    quantity REAL NOT NULL DEFAULT 0,
    avg_buy_price REAL NOT NULL DEFAULT 0,
    total_invested REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 交易记录表
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('buy', 'sell')),
    quantity REAL NOT NULL,
    price REAL NOT NULL,           -- 成交时价格
    total_amount REAL NOT NULL,    -- 成交额
    fee_amount REAL NOT NULL DEFAULT 0,  -- 手续费
    spread_cost REAL NOT NULL DEFAULT 0, -- 点差成本
    net_amount REAL NOT NULL,      -- 净额 (扣除费用后)
    profit_loss REAL DEFAULT 0,    -- 卖出时盈亏
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_prices_time ON prices(timestamp);
CREATE INDEX idx_signals_symbol ON analysis_signals(symbol, analysis_time);
CREATE INDEX idx_predictions_symbol ON predictions(symbol, timeframe, generated_at);
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id, timestamp);
```

---

## 5. 核心功能模块设计

### 5.1 价格采集模块 (price_collector.py)

**职责**：每30分钟从公开API获取黄金和加密货币价格，存入数据库。

**资产列表**：
```python
ASSETS = {
    "gold": [
        {"symbol": "XAU", "name": "Gold", "source_priority": ["gold-api", "yfinance", "freegoldapi"]}
    ],
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
```

**采集逻辑**：
1. 定时触发（APScheduler `interval` 30分钟）
2. 并行获取黄金 + 各加密货币价格（httpx AsyncClient）
3. 主源失败自动降级到备用源
4. 数据清洗和标准化后写入 `prices` 表
5. 每次采集后保留最近 90 天的数据（自动清理更早的数据）

### 5.2 技术分析与预测模块 (analyzer.py)

**核心原则：不依赖任何大模型或机器学习。纯基于技术指标和统计方法。**

**职责**：每6小时运行一次，基于最近价格数据计算技术指标，生成交易信号，预测未来走势。

#### 5.2.1 技术指标计算

```python
# 使用 pandas + numpy 计算，无需外部服务
import pandas as pd
import numpy as np

def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """相对强弱指标 RSI"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs)).iloc[-1]

def calculate_macd(prices: pd.Series, fast=12, slow=26, signal=9):
    """MACD 指标"""
    ema_fast = prices.ewm(span=fast, adjust=False).mean()
    ema_slow = prices.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line.iloc[-1], signal_line.iloc[-1], histogram.iloc[-1]

def calculate_bollinger_bands(prices: pd.Series, period=20, std_dev=2):
    """布林带"""
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    return upper.iloc[-1], sma.iloc[-1], lower.iloc[-1]

def calculate_ema(prices: pd.Series, span: int) -> float:
    """指数移动平均线"""
    return prices.ewm(span=span, adjust=False).mean().iloc[-1]

def calculate_sma(prices: pd.Series, window: int) -> float:
    """简单移动平均线"""
    return prices.rolling(window=window).mean().iloc[-1]

def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period=14) -> float:
    """平均真实波幅 (用于波动率分析)"""
    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean().iloc[-1]
```

#### 5.2.2 信号生成引擎（核心规则引擎）

```python
class SignalEngine:
    """基于多指标的信号生成引擎，无ML/AI依赖"""
    
    def generate_signal(self, df: pd.DataFrame) -> dict:
        """
        综合多指标生成交易信号
        返回: {
            "direction": "bullish" | "bearish" | "neutral",
            "strength": 1-10,
            "indicators": [...],
            "reasoning": "..."
        }
        """
        close = df['price']
        signals = []
        score = 0  # 正向得分
        
        # 1. RSI 信号
        rsi = calculate_rsi(close)
        if rsi < 30:
            signals.append({"indicator": "RSI", "signal": "oversold", "value": rsi, "weight": +2})
            score += 2
        elif rsi > 70:
            signals.append({"indicator": "RSI", "signal": "overbought", "value": rsi, "weight": -2})
            score -= 2
        elif rsi < 45:
            signals.append({"indicator": "RSI", "signal": "weak_bullish", "value": rsi, "weight": +1})
            score += 1
        elif rsi > 55:
            signals.append({"indicator": "RSI", "signal": "weak_bearish", "value": rsi, "weight": -1})
            score -= 1
            
        # 2. MACD 信号
        macd, macd_signal, histogram = calculate_macd(close)
        if macd > macd_signal and histogram > 0:
            signals.append({"indicator": "MACD", "signal": "bullish_crossover", "weight": +2})
            score += 2
        elif macd < macd_signal and histogram < 0:
            signals.append({"indicator": "MACD", "signal": "bearish_crossover", "weight": -2})
            score -= 2
        elif macd > 0:
            signals.append({"indicator": "MACD", "signal": "above_zero", "weight": +1})
            score += 1
        elif macd < 0:
            signals.append({"indicator": "MACD", "signal": "below_zero", "weight": -1})
            score -= 1
            
        # 3. 布林带信号
        bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(close)
        current_price = close.iloc[-1]
        if current_price < bb_lower:
            signals.append({"indicator": "BB", "signal": "below_lower", "weight": +2})
            score += 2
        elif current_price > bb_upper:
            signals.append({"indicator": "BB", "signal": "above_upper", "weight": -2})
            score -= 2
        elif current_price < bb_middle:
            signals.append({"indicator": "BB", "signal": "below_middle", "weight": +1})
            score += 1
        else:
            signals.append({"indicator": "BB", "signal": "above_middle", "weight": -1})
            score -= 1
            
        # 4. 趋势强度 (EMA交叉)
        ema_12 = calculate_ema(close, 12)
        ema_26 = calculate_ema(close, 26)
        if ema_12 > ema_26:
            signals.append({"indicator": "EMA", "signal": "golden_cross", "weight": +2})
            score += 2
        else:
            signals.append({"indicator": "EMA", "signal": "death_cross", "weight": -2})
            score -= 2
            
        # 5. 波动率分析 (ATR)
        if 'high' in df.columns and 'low' in df.columns:
            atr = calculate_atr(df['high'], df['low'], close)
            atr_percent = atr / current_price * 100
            if atr_percent > 5:  # 高波动
                signals.append({"indicator": "ATR", "signal": "high_volatility", "value": atr_percent, "weight": 0})
            elif atr_percent < 1:  # 低波动
                signals.append({"indicator": "ATR", "signal": "low_volatility", "value": atr_percent, "weight": 0})
        
        # 综合判断
        if score >= 4:
            direction = "bullish"
            strength = min(abs(score), 10)
        elif score <= -4:
            direction = "bearish"
            strength = min(abs(score), 10)
        else:
            direction = "neutral"
            strength = min(abs(score) + 3, 10)
            
        return {
            "direction": direction,
            "strength": strength,
            "indicators": signals,
            "reasoning": self._build_reasoning(signals, direction, current_price, bb_upper, bb_lower),
            "metadata": {
                "rsi": rsi,
                "macd": macd,
                "macd_signal": macd_signal,
                "bb_upper": bb_upper,
                "bb_middle": bb_middle,
                "bb_lower": bb_lower,
                "ema_12": ema_12,
                "ema_26": ema_26
            }
        }
```

#### 5.2.3 多时间维度预测引擎

```python
class PredictionEngine:
    """
    基于历史波动率和指标趋势，预测未来24h/7d/30d走势
    不依赖机器学习，基于统计外推和模式匹配
    """
    
    TIMEFRAME_MULTIPLIERS = {
        "24h": 1.0,      # 基于当前趋势外推1天
        "7d": 3.5,       # 基于周趋势外推
        "30d": 14.0      # 基于月趋势外推
    }
    
    def predict(self, df: pd.DataFrame, signal_result: dict, timeframe: str) -> dict:
        close = df['price']
        current_price = close.iloc[-1]
        
        # 计算近期统计特征
        returns = close.pct_change().dropna()
        recent_volatility = returns.tail(48).std() * 100  # 最近24h (假设30分钟粒度)
        recent_trend = (close.iloc[-1] - close.iloc[-48]) / close.iloc[-48] * 100 if len(close) >= 48 else 0
        
        # 历史模式匹配: 查找历史上相似的指标组合后的走势
        historical_similar = self._find_similar_patterns(df, signal_result)
        
        # 基础方向从信号来
        base_direction = signal_result["direction"]
        base_strength = signal_result["strength"]
        
        # 根据时间维度调整预期波动幅度
        multiplier = self.TIMEFRAME_MULTIPLIERS[timeframe]
        
        # 波动率范围预测 (基于历史ATR和波动率)
        if base_direction == "bullish":
            predicted_change = recent_trend * multiplier * 0.5 + recent_volatility * multiplier * 0.3
            predicted_change = max(predicted_change, 0.5)  # 最小0.5%
            confidence = min(base_strength * 10 + 30, 85)  # 最高85%
        elif base_direction == "bearish":
            predicted_change = recent_trend * multiplier * 0.5 - recent_volatility * multiplier * 0.3
            predicted_change = min(predicted_change, -0.5)  # 最小-0.5%
            confidence = min(base_strength * 10 + 30, 85)
        else:
            # 中性: 预测区间收窄
            predicted_change = recent_trend * multiplier * 0.2
            confidence = 40 + base_strength * 3
            
        # 历史准确率修正
        if historical_similar:
            hist_accuracy = historical_similar["accuracy"]
            confidence = (confidence + hist_accuracy * 100) / 2
            
        # 构建理由
        reasoning = self._build_prediction_reasoning(
            timeframe, base_direction, signal_result, 
            recent_volatility, recent_trend, historical_similar
        )
        
        return {
            "timeframe": timeframe,
            "direction": base_direction,
            "predicted_change_percent": round(predicted_change, 2),
            "confidence_percent": round(confidence, 1),
            "reasoning": reasoning,
            "indicators_used": signal_result["indicators"],
            "current_price": current_price,
            "target_price": round(current_price * (1 + predicted_change / 100), 2)
        }
        
    def _build_prediction_reasoning(self, timeframe, direction, signal, vol, trend, hist) -> str:
        """生成人类可读的预测理由"""
        reasons = []
        
        if direction == "bullish":
            reasons.append(f"技术指标综合显示 bullish 信号，强度评分 {signal['strength']}/10")
        elif direction == "bearish":
            reasons.append(f"技术指标综合显示 bearish 信号，强度评分 {signal['strength']}/10")
        else:
            reasons.append(f"技术指标显示 neutral 信号，多空力量相对均衡")
            
        # 添加具体指标解释
        for ind in signal["indicators"]:
            if ind["weight"] != 0:
                reasons.append(f"- {ind['indicator']}: {ind['signal']} (权重 {ind['weight']:+d})")
                
        reasons.append(f"近期24h波动率: {vol:.2f}%, 趋势: {trend:+.2f}%")
        
        if hist and hist["count"] > 5:
            reasons.append(f"历史相似模式 {hist['count']} 次，后续{timeframe}准确率 {hist['accuracy']*100:.1f}%")
            
        if timeframe == "24h":
            reasons.append("短期预测受市场情绪和突发事件影响较大，准确率相对较低。")
        elif timeframe == "30d":
            reasons.append("月度预测基于趋势外推，实际走势可能因宏观因素偏离。")
            
        return "\n".join(reasons)
```

### 5.3 模拟交易模块 (trading_engine.py)

**交易手续费与点差设定**（参考主流交易所）：

| 参数 | 设定值 | 参考来源 |
|------|--------|----------|
| Maker手续费 | 0.08% | Binance普通用户现货0.1%，略优惠 |
| Taker手续费 | 0.10% | Binance/Coinbase平均水平 |
| 黄金点差 | 0.03% | 参考外汇黄金交易平台 |
| BTC/USDT点差 | 0.05% | 参考主流交易所实际点差 |
| ETH/USDT点差 | 0.05% | 同上 |
| 其他加密货币点差 | 0.08% | 流动性较低的币种点差更大 |
| 最小下单金额 | $10 | 防止过小金额交易 |

```python
TRADING_CONFIG = {
    "maker_fee": 0.0008,      # 0.08%
    "taker_fee": 0.0010,      # 0.10%
    "spread": {
        "XAU": 0.0003,        # 0.03%
        "BTCUSDT": 0.0005,    # 0.05%
        "ETHUSDT": 0.0005,
        "default": 0.0008     # 0.08%
    },
    "min_order_usd": 10.0,   # 最小10美元
    "max_leverage": 1,        # 无杠杆，现货交易
}

class PaperTradingEngine:
    """模拟交易引擎"""
    
    def buy(self, user_id: int, symbol: str, quantity: float, current_price: float) -> dict:
        """买入资产"""
        # 买入价格 = 当前价格 * (1 + spread)  # 买方支付更高价格
        buy_price = current_price * (1 + self._get_spread(symbol))
        total = quantity * buy_price
        fee = total * TRADING_CONFIG["taker_fee"]
        net_total = total + fee
        
        # 检查余额
        user = get_user(user_id)
        if user.current_balance < net_total:
            raise InsufficientBalance()
        if net_total < TRADING_CONFIG["min_order_usd"]:
            raise OrderTooSmall()
            
        # 更新用户余额和持仓
        user.current_balance -= net_total
        portfolio = get_or_create_portfolio(user_id, symbol)
        # 加权平均更新持仓成本
        new_total_qty = portfolio.quantity + quantity
        portfolio.avg_buy_price = (portfolio.avg_buy_price * portfolio.quantity + buy_price * quantity) / new_total_qty
        portfolio.quantity = new_total_qty
        portfolio.total_invested += net_total
        
        # 记录交易
        transaction = Transaction(
            user_id=user_id, symbol=symbol, transaction_type="buy",
            quantity=quantity, price=buy_price, total_amount=total,
            fee_amount=fee, spread_cost=total * self._get_spread(symbol),
            net_amount=net_total
        )
        
        return {"status": "success", "transaction": transaction, "new_balance": user.current_balance}
    
    def sell(self, user_id: int, symbol: str, quantity: float, current_price: float) -> dict:
        """卖出资产"""
        portfolio = get_portfolio(user_id, symbol)
        if portfolio.quantity < quantity:
            raise InsufficientHoldings()
            
        # 卖出价格 = 当前价格 * (1 - spread)  # 卖方获得更低价格
        sell_price = current_price * (1 - self._get_spread(symbol))
        total = quantity * sell_price
        fee = total * TRADING_CONFIG["taker_fee"]
        net_total = total - fee
        
        # 计算盈亏
        cost_basis = quantity * portfolio.avg_buy_price
        profit_loss = net_total - cost_basis
        
        # 更新余额和持仓
        user = get_user(user_id)
        user.current_balance += net_total
        portfolio.quantity -= quantity
        if portfolio.quantity == 0:
            portfolio.avg_buy_price = 0
            portfolio.total_invested = 0
            
        # 记录交易
        transaction = Transaction(
            user_id=user_id, symbol=symbol, transaction_type="sell",
            quantity=quantity, price=sell_price, total_amount=total,
            fee_amount=fee, spread_cost=total * self._get_spread(symbol),
            net_amount=net_total, profit_loss=profit_loss
        )
        
        return {"status": "success", "transaction": transaction, 
                "profit_loss": profit_loss, "new_balance": user.current_balance}
                
    def get_portfolio_value(self, user_id: int, current_prices: dict) -> dict:
        """计算用户总资产（余额 + 持仓市值）"""
        user = get_user(user_id)
        portfolios = get_all_portfolios(user_id)
        
        holdings_value = 0
        for p in portfolios:
            if p.quantity > 0 and p.symbol in current_prices:
                holdings_value += p.quantity * current_prices[p.symbol]
                
        total_value = user.current_balance + holdings_value
        total_return_pct = (total_value - user.initial_balance) / user.initial_balance * 100
        
        return {
            "balance": user.current_balance,
            "holdings_value": holdings_value,
            "total_value": total_value,
            "initial_balance": user.initial_balance,
            "total_return_pct": round(total_return_pct, 2),
            "holdings": portfolios
        }
```

### 5.4 排行榜模块 (leaderboard.py)

```python
def get_leaderboard(limit: int = 10) -> list:
    """获取TOP10排行榜"""
    # 获取所有用户及其最新资产总值
    users = session.query(User).all()
    current_prices = get_latest_prices()  # 获取所有资产的最新价格
    
    rankings = []
    for user in users:
        portfolio = get_portfolio_value(user.id, current_prices)
        rankings.append({
            "user_id": user.id,
            "name": user.name,
            "total_value": portfolio["total_value"],
            "return_pct": portfolio["total_return_pct"],
            "initial_balance": user.initial_balance
        })
    
    # 按总收益率排序
    rankings.sort(key=lambda x: x["return_pct"], reverse=True)
    return rankings[:limit]
```

---

## 6. API接口设计 (FastAPI)

### 6.1 REST API端点

```python
# ========== 价格数据接口 ==========

@router.get("/api/prices/latest")
async def get_latest_prices():
    """获取所有资产的最新价格"""
    # 返回: { "XAU": {...}, "BTCUSDT": {...}, ... }
    pass

@router.get("/api/prices/history/{symbol}")
async def get_price_history(symbol: str, days: int = 7):
    """获取某资产的历史价格数据 (默认7天)"""
    # 返回: [{"timestamp": "...", "price": ..., "change": ...}, ...]
    pass

# ========== 分析信号接口 ==========

@router.get("/api/analysis/{symbol}")
async def get_analysis(symbol: str):
    """获取某资产的最新技术分析信号"""
    # 返回: { "symbol": "BTCUSDT", "direction": "bullish", "strength": 7, 
    #         "indicators": [...], "reasoning": "...", "metadata": {...} }
    pass

# ========== 预测接口 ==========

@router.get("/api/predictions/{symbol}")
async def get_predictions(symbol: str):
    """获取某资产的多时间维度预测 (24h/7d/30d)"""
    # 返回: { "symbol": "BTCUSDT", "predictions": [
    #   { "timeframe": "24h", "direction": "up", "confidence": 65, 
    #     "predicted_change": 2.3, "reasoning": "..." }, ... ] }
    pass

# ========== 用户/模拟交易接口 ==========

@router.post("/api/users")
async def create_user(name: str, initial_balance: float = 10000.0):
    """创建新用户 (仅名字+本金，无密码)"""
    pass

@router.get("/api/users/{user_id}")
async def get_user(user_id: int):
    """获取用户信息"""
    pass

@router.post("/api/trade/buy")
async def buy_asset(user_id: int, symbol: str, quantity: float):
    """买入资产"""
    pass

@router.post("/api/trade/sell")
async def sell_asset(user_id: int, symbol: str, quantity: float):
    """卖出资产 (quantity=-1表示全部卖出)"""
    pass

@router.get("/api/portfolio/{user_id}")
async def get_portfolio(user_id: int):
    """获取用户持仓和资产总值"""
    pass

@router.get("/api/transactions/{user_id}")
async def get_transactions(user_id: int, limit: int = 50):
    """获取用户交易历史"""
    pass

# ========== 排行榜接口 ==========

@router.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10):
    """获取排行榜 TOP N"""
    # 返回: { "rankings": [{"rank": 1, "name": "...", "return_pct": 15.3, "total_value": 11530}, ...] }
    pass

# ========== 系统状态接口 ==========

@router.get("/api/health")
async def health_check():
    """健康检查 + 系统状态"""
    # 返回: { "status": "ok", "last_price_update": "...", "last_analysis": "...", "assets_tracked": 11 }
    pass
```

---

## 7. 前端页面设计

### 7.1 页面结构

| 页面 | 路由 | 功能描述 |
|------|------|----------|
| 首页/看板 | `/` | 实时价格卡片、资产趋势图、预测概览、用户资产快照、TOP5排行榜 |
| 资产详情 | `/asset/{symbol}` | 某资产的K线图(30分钟)、技术指标面板、详细预测 |
| 模拟交易 | `/trade` | 资产选择、买卖操作、持仓列表、交易历史 |
| 排行榜 | `/leaderboard` | TOP10完整排行榜、搜索用户 |
| 预测中心 | `/predictions` | 所有资产的24h/7d/30d预测汇总 |

### 7.2 关键UI组件

```
┌─────────────────────────────────────────────────────────────────┐
│  🏆 Gold & Crypto Tracker                    [模拟交易入口 👤]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  🥇 GOLD  │ │  ₿ BTC   │ │  Ξ ETH   │ │  ◈ SOL   │          │
│  │ $2,341.50│ │ $67,321 │ │ $3,456  │ │ $145.30 │          │
│  │  +1.24%  │ │  +2.34%  │ │  -0.56%  │ │  +5.67%  │          │
│  │ [趋势图] │ │ [趋势图] │ │ [趋势图] │ │ [趋势图] │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📊 市场概览 (折线图: 多资产价格走势对比, 可选时间范围)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────┐ ┌─────────────────────────────┐  │
│  │ 🔮 24小时预测信号        │ │ 💰 我的资产 (如已登录)        │  │
│  │ BTC: 看涨 65%          │ │ 用户名: Alice               │  │
│  │ ETH: 看跌 42%          │ │ 总资产: $12,340 (+23.4%)    │  │
│  │ SOL: 强烈看涨 78%      │ │ 持仓: BTC, ETH, SOL        │  │
│  │ ...                    │ │ [去交易 →]                  │  │
│  └────────────────────────┘ └─────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏅 TOP 10 排行榜                                          │   │
│  │ Rank  Name      Return%    Total Value    Main Holdings  │   │
│  │  1    Bob      +45.2%     $14,520        BTC, SOL       │   │
│  │  2    Alice    +23.4%     $12,340        BTC, ETH, SOL  │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 视觉设计规范

```css
/* 低饱和度、温暖色调、现代金融风格 */
:root {
  --bg-primary: #0f172a;        /* 深蓝灰背景 */
  --bg-card: #1e293b;           /* 卡片背景 */
  --bg-hover: #334155;          /* 悬停背景 */
  --text-primary: #f8fafc;      /* 主文字白色 */
  --text-secondary: #94a3b8;    /* 次要文字灰 */
  --accent-gold: #f59e0b;       /* 黄金强调色 */
  --accent-green: #22c55e;      /* 上涨绿色 */
  --accent-red: #ef4444;        /* 下跌红色 */
  --accent-blue: #3b82f6;       /* 信息蓝色 */
  --border: #334155;
  --radius: 12px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

/* 暗色主题金融数据看板 */
body { background: var(--bg-primary); color: var(--text-primary); font-family: 'Inter', sans-serif; }
.card { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); }
.price-up { color: var(--accent-green); }
.price-down { color: var(--accent-red); }
```

---

## 8. 项目目录结构

```
gold-crypto-tracker/
├── README.md                      # 项目说明
├── requirements.txt               # Python依赖
├── package.json                   # Node.js依赖
├── start.sh                       # 一键启动脚本 (Linux/Mac)
├── start.bat                      # 一键启动脚本 (Windows)
├── stop.sh                        # 停止脚本
├── .env.example                   # 环境变量示例
│
├── backend/                       # FastAPI 后端
│   ├── main.py                    # FastAPI应用入口
│   ├── config.py                  # 配置管理
│   ├── database.py                # SQLAlchemy数据库连接
│   ├── scheduler.py               # APScheduler定时任务
│   │
│   ├── models/                    # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── price.py
│   │   ├── analysis.py
│   │   ├── prediction.py
│   │   ├── user.py
│   │   └── transaction.py
│   │
│   ├── services/                  # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── price_collector.py     # 价格采集服务
│   │   ├── analyzer.py            # 技术分析服务
│   │   ├── predictor.py           # 预测引擎
│   │   ├── trading_engine.py      # 模拟交易引擎
│   │   └── leaderboard.py         # 排行榜服务
│   │
│   ├── routers/                   # API路由
│   │   ├── __init__.py
│   │   ├── prices.py
│   │   ├── analysis.py
│   │   ├── predictions.py
│   │   ├── trading.py
│   │   ├── users.py
│   │   └── leaderboard.py
│   │
│   └── utils/                     # 工具函数
│       ├── __init__.py
│       ├── indicators.py          # 技术指标计算
│       └── http_client.py         # 异步HTTP客户端
│
├── frontend/                      # Next.js 前端
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   ├── app/                   # App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # 首页/看板
│   │   │   ├── asset/
│   │   │   │   └── [symbol]/
│   │   │   │       └── page.tsx   # 资产详情页
│   │   │   ├── trade/
│   │   │   │   └── page.tsx       # 模拟交易页
│   │   │   ├── leaderboard/
│   │   │   │   └── page.tsx       # 排行榜页
│   │   │   └── predictions/
│   │   │       └── page.tsx       # 预测中心
│   │   │
│   │   ├── components/            # React组件
│   │   │   ├── ui/                # shadcn/ui基础组件
│   │   │   ├── PriceCard.tsx      # 价格卡片
│   │   │   ├── PriceChart.tsx     # 价格图表
│   │   │   ├── IndicatorPanel.tsx # 技术指标面板
│   │   │   ├── PredictionCard.tsx # 预测卡片
│   │   │   ├── TradeForm.tsx      # 交易表单
│   │   │   ├── PortfolioView.tsx  # 资产视图
│   │   │   └── LeaderboardTable.tsx # 排行榜表格
│   │   │
│   │   ├── hooks/                 # 自定义React Hooks
│   │   │   ├── usePrices.ts
│   │   │   ├── useUser.ts
│   │   │   └── useAutoRefresh.ts
│   │   │
│   │   ├── lib/                   # 工具库
│   │   │   ├── api.ts             # API调用封装
│   │   │   └── utils.ts
│   │   │
│   │   └── types/                 # TypeScript类型
│   │       └── index.ts
│   │
│   └── public/                    # 静态资源
│
└── data/                          # SQLite数据库文件 (运行时生成)
    └── tracker.db
```

---

## 9. 开发执行计划 (供Claude Code执行)

### 阶段1: 项目初始化与环境搭建 (预计30分钟)

```bash
# 1. 创建项目目录
mkdir -p gold-crypto-tracker/{backend,frontend,data}
cd gold-crypto-tracker

# 2. 初始化Python后端环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 创建 requirements.txt
cat > requirements.txt << 'EOF'
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
sqlalchemy>=2.0.25
aiosqlite>=0.19.0
httpx>=0.26.0
apscheduler>=3.10.4
pandas>=2.1.4
numpy>=1.26.3
yfinance>=0.2.28
python-dotenv>=1.0.0
pydantic>=2.5.3
pydantic-settings>=2.1.0
EOF

pip install -r requirements.txt

# 4. 初始化Next.js前端 (使用shadcn/ui模板)
npx shadcn@latest init --yes --template next --base-color slate

# 5. 安装前端额外依赖
npm install recharts axios
```

### 阶段2: 后端核心开发 (预计2-3小时)

**任务清单：**

1. **配置与数据库层** (`config.py`, `database.py`)
   - 环境变量配置 (端口、数据库路径、采集间隔)
   - SQLAlchemy异步引擎 + SQLite配置
   - 所有数据模型定义（7个表）
   - 数据库迁移/初始化脚本

2. **价格采集服务** (`services/price_collector.py`)
   - 实现 `GoldPriceSource` 类（gold-api.com + yfinance + freegoldapi降级）
   - 实现 `CryptoPriceSource` 类（Binance API + CoinGecko降级）
   - 异步采集主函数 `collect_all_prices()`
   - 数据清洗和标准化

3. **技术指标计算** (`utils/indicators.py`)
   - 实现RSI, MACD, Bollinger Bands, EMA, SMA, ATR计算函数
   - 纯pandas+numpy实现，无外部依赖

4. **分析与预测引擎** (`services/analyzer.py`, `services/predictor.py`)
   - 实现 `SignalEngine.generate_signal()`
   - 实现 `PredictionEngine.predict()` (24h/7d/30d)
   - 实现历史模式匹配 `_find_similar_patterns()`

5. **模拟交易引擎** (`services/trading_engine.py`)
   - 实现买入/卖出/持仓查询/资产计算
   - 手续费和点差计算
   - 交易记录和持仓更新

6. **排行榜服务** (`services/leaderboard.py`)
   - 实现 `get_leaderboard()`
   - 实时资产总值计算

7. **API路由层** (`routers/`)
   - 实现所有REST端点（见第6节）
   - Pydantic请求/响应模型
   - 错误处理标准化

8. **定时任务调度** (`scheduler.py`)
   - APScheduler配置
   - price_collector: 每30分钟
   - analyzer: 每6小时

9. **主入口** (`main.py`)
   - FastAPI应用实例
   - 生命周期事件（启动/关闭）
   - 静态文件服务（前端build产物）

### 阶段3: 前端核心开发 (预计2-3小时)

**任务清单：**

1. **全局配置**
   - `lib/api.ts`: axios封装，指向 `http://localhost:30305/api`
   - `types/index.ts`: 所有TypeScript接口定义

2. **首页/看板** (`app/page.tsx`)
   - 实时价格卡片网格（11个资产）
   - 市场概览多资产折线图 (Recharts)
   - 24小时预测信号汇总
   - 用户资产快照（localStorage存储user_id）
   - TOP5排行榜预览

3. **资产详情页** (`app/asset/[symbol]/page.tsx`)
   - 大型K线/折线图（30分钟粒度）
   - 技术指标面板（RSI, MACD, BB数值展示）
   - 三时间维度预测卡片（24h/7d/30d）
   - 买入/卖出快捷入口

4. **模拟交易页** (`app/trade/page.tsx`)
   - 资产选择器 + 当前价格显示
   - 买入表单（数量/金额切换）
   - 卖出表单（支持全部卖出）
   - 当前持仓列表（资产/数量/成本/市值/盈亏）
   - 最近交易历史

5. **排行榜页** (`app/leaderboard/page.tsx`)
   - TOP10完整表格
   - 收益率柱状图
   - 用户名搜索

6. **预测中心页** (`app/predictions/page.tsx`)
   - 所有资产预测汇总表格
   - 按时间维度筛选（24h/7d/30d）
   - 置信度热力图

7. **共享组件**
   - `PriceCard`: 价格卡片（支持趋势迷你图）
   - `PriceChart`: 通用图表组件
   - `PredictionCard`: 预测展示卡片
   - `TradeForm`: 交易表单
   - `LeaderboardTable`: 排行榜表格

8. **自定义Hooks**
   - `usePrices`: 实时价格轮询 (每30秒刷新)
   - `useUser`: 用户状态管理
   - `useAutoRefresh`: 自动刷新封装

### 阶段4: 集成与部署脚本 (预计30分钟)

**任务清单：**

1. **构建脚本**
   ```bash
   # frontend/package.json scripts
   "build": "next build"
   "export": "next build"  # 配置static export
   ```
   
   修改 `next.config.js`:
   ```js
   const nextConfig = {
     output: 'export',
     distDir: 'dist',
     assetPrefix: '.',
   }
   ```

2. **启动脚本** (`start.sh` / `start.bat`)
   ```bash
   #!/bin/bash
   # start.sh - 一键启动整个系统
   
   echo "🚀 Starting Gold & Crypto Tracker..."
   
   # 激活Python环境
   source venv/bin/activate
   
   # 启动FastAPI后端 (后台运行)
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 30305 --reload &
   BACKEND_PID=$!
   echo $BACKEND_PID > ../.backend.pid
   
   cd ../frontend
   # 开发模式: npm run dev (端口3000, 代理到30305)
   # 生产模式: npx serve dist/ (如果已构建)
   
   echo "✅ Backend running at http://localhost:30305"
   echo "📊 API docs at http://localhost:30305/docs"
   ```

3. **停止脚本** (`stop.sh`)
   ```bash
   #!/bin/bash
   if [ -f .backend.pid ]; then
     kill $(cat .backend.pid) 2>/dev/null
     rm .backend.pid
     echo "🛑 Backend stopped"
   fi
   ```

4. **环境变量文件** (`.env`)
   ```
   PORT=30305
   DATABASE_URL=sqlite:///data/tracker.db
   PRICE_UPDATE_INTERVAL_MINUTES=30
   ANALYSIS_INTERVAL_HOURS=6
   GOLD_API_URL=https://gold-api.com/api/v1/stats
   BINANCE_API_URL=https://api.binance.com
   COINGECKO_API_URL=https://api.coingecko.com/api/v3
   ```

### 阶段5: 测试与验证 (预计30分钟)

**验证清单：**

| 验证项 | 方法 | 预期结果 |
|--------|------|----------|
| 后端启动 | `uvicorn main:app --port 30305` | 服务启动，访问 `/api/health` 返回200 |
| 价格采集 | 等待30分钟或手动触发 | `prices`表有数据，包含XAU和10个加密货币 |
| API文档 | 访问 `/docs` | Swagger UI正确显示所有端点 |
| 前端构建 | `npm run build` | 无错误，生成`frontend/dist` |
| 首页加载 | 访问 `http://localhost:30305` | 看到价格卡片和图表 |
| 模拟交易 | 创建用户 → 买入BTC → 查看持仓 | 余额减少，持仓增加，交易记录正确 |
| 排行榜 | 创建多个用户交易后查看 | 按收益率正确排序 |
| 预测生成 | 等待6小时或手动触发 | `predictions`表有24h/7d/30d记录 |
| 合规检查 | 检查代码中无API Key输入 | 确认无API Key配置项，仅使用公开端点 |
| 停止脚本 | 运行 `./stop.sh` | 进程终止，30305端口释放 |

---

## 10. 关键技术要点与约束

### 10.1 数据源合规使用清单

| 数据源 | 端点 | 认证 | 速率限制 | 本项目使用方式 |
|--------|------|------|----------|--------------|
| gold-api.com | `/api/v1/stats` | 无 | 无限制（实时价格） | 每30分钟1次 |
| Binance Public | `/api/v3/ticker/24hr` | 无 | 1200 req/min/IP | 每30分钟1次（批量 symbols） |
| CoinGecko Demo | `/simple/price` | 无 | 30 calls/min | 降级备用，失败时使用 |
| freegoldapi | `/data/latest.csv` | 无 | 无明确限制 | 黄金数据备用源 |
| yfinance | Python库 | 无 | 无明确限制 | 黄金数据备用源 |

**合规保障措施：**
- 黄金和加密货币数据源**并行请求**，不同源之间无间隔
- 同一源内连续请求（如降级重试）间隔 **1 秒**——仍然远低于任何平台限制
- 仅使用 `GET` 只读端点
- 不抓取任何网页HTML（纯API调用）
- 缓存响应数据30分钟，减少重复请求
- 本地存储历史数据，避免频繁请求历史接口

### 10.2 零API Key / 零大模型保障

```python
# 代码审查清单 - 确保:
# 1. 无 os.getenv("API_KEY") / os.getenv("OPENAI_API_KEY") 等调用
# 2. 无 requests.post("api.openai.com/...") 等大模型请求
# 3. 所有外部请求仅指向 Binance / CoinGecko / gold-api 公开端点
# 4. 预测引擎纯基于 pandas/numpy 计算，无模型加载/推理代码
```

### 10.3 部署与启动方式

```bash
# 开发模式 (前后端分离)
# 终端1:
cd backend && uvicorn main:app --host 0.0.0.0 --port 30305 --reload
# 终端2:
cd frontend && npm run dev  # Next.js开发服务器 (3000端口)

# 生产模式 (单端口)
# 构建前端:
cd frontend && npm run build  # 生成 dist/ 目录
# 后端配置static files挂载，将dist/作为静态文件服务
# FastAPI会同时服务API和前端页面
# 访问 http://localhost:30305 即打开应用
```

---

## 11. 交付清单

交付时确保以下文件完整：

```
gold-crypto-tracker/
├── ✅ README.md              # 项目说明，包含启动命令
├── ✅ requirements.txt       # Python依赖
├── ✅ package.json          # Node依赖
├── ✅ .env.example          # 环境变量模板
├── ✅ start.sh / start.bat  # 一键启动脚本
├── ✅ stop.sh               # 停止脚本
├── ✅ backend/
│   ├── ✅ main.py           # FastAPI入口
│   ├── ✅ config.py
│   ├── ✅ database.py
│   ├── ✅ scheduler.py
│   ├── ✅ models/           # 5+模型文件
│   ├── ✅ services/         # 5+服务文件
│   ├── ✅ routers/          # 6+路由文件
│   └── ✅ utils/            # 工具文件
├── ✅ frontend/
│   ├── ✅ src/app/          # 5+页面
│   ├── ✅ src/components/   # 8+组件
│   ├── ✅ src/hooks/        # 3+Hooks
│   ├── ✅ src/lib/          # API封装
│   └── ✅ src/types/        # 类型定义
└── ✅ data/tracker.db       # 运行时数据库
```

**运行验证：**
1. `./start.sh` 启动后，浏览器打开 `http://localhost:30305`
2. 首页显示11个资产的价格卡片（实时数据）
3. 点击资产进入详情页，显示图表和预测
4. 模拟交易页面可创建用户、买卖资产
5. 排行榜显示TOP10用户
6. 系统运行24小时后，数据库中有 ≥48条价格记录和 ≥4组分析预测
7. `./stop.sh` 可完全停止系统

---

## 12. 风险与降级方案

| 风险 | 影响 | 降级方案 |
|------|------|----------|
| gold-api.com 停止服务 | 黄金价格无法获取 | 自动切换至 yfinance (GC=F) 或 freegoldapi CSV |
| Binance API 限制IP | 加密货币价格无法获取 | 自动切换至 CoinGecko API |
| CoinGecko 速率限制 | 备用源不可用 | 延长降级切换间隔至3秒，使用本地缓存数据 |
| 本地30305端口占用 | 无法启动 | 脚本检测并提示更换端口，或自动选择可用端口 |
| 前端构建失败 | UI不可用 | 后端独立运行，API仍可通过 `/docs` 访问和测试 |
| 数据库损坏 | 数据丢失 | 自动备份机制（定期复制.db文件），损坏时重建 |

---

*文档版本: 1.0*
*生成日期: 2026-04-29*
*适用目标: Claude Code 自主开发执行*
