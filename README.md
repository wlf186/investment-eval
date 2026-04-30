# Gold & Crypto Tracker

本地部署的黄金与加密货币实时追踪及模拟交易系统。系统以现代数据看板形式呈现实时价格、技术指标、多时间维度预测和模拟交易排行榜，无需任何第三方 API Key 或大模型服务。

## 功能特性

- **实时价格追踪**：每 30 分钟采集黄金（XAU/USD）和 10 种主流加密货币的最新价格
- **技术分析看板**：基于 RSI、MACD、布林带、EMA 等指标自动生成交易信号
- **多时间维度预测**：预测未来 24 小时 / 7 天 / 30 天的涨跌比例及理由，纯基于统计外推与模式匹配
- **模拟交易**：用户输入名字即可开始模拟交易，买卖资产时参考主流交易所手续费与点差
- **排行榜**：首页展示用户资产快照及 TOP 10 收益排行榜
- **零 API Key 依赖**：所有数据均从公开端点获取

## 技术栈

- **前端**：Next.js 14 + React 18 + Tailwind CSS + Recharts
- **后端**：Python FastAPI + SQLAlchemy 2.0 (async) + aiosqlite
- **数据库**：SQLite（单文件，零配置）
- **任务调度**：APScheduler（价格采集每 30 分钟，分析每 6 小时）

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 20+

### 安装依赖

```bash
# Python 后端
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

### 启动系统

```bash
# 一键启动前后端（推荐）
./start.sh

# 手动启动后端
source .venv/bin/activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30306 --reload

# 手动启动前端
cd frontend
npm run dev
```

启动后访问：http://localhost:30305

### 停止系统

```bash
./stop.sh
```

## 项目结构

```
gold-crypto-tracker/
├── backend/              # FastAPI 后端
│   ├── main.py           # 应用入口与定时任务配置
│   ├── config.py         # 资产、API 地址、交易费率配置
│   ├── database.py       # SQLAlchemy 异步数据库连接
│   ├── models/           # 数据模型（价格、用户、持仓、交易记录等）
│   ├── routers/          # API 路由（prices, analysis, trading, users, leaderboard）
│   ├── services/         # 业务逻辑（价格采集、技术分析、交易引擎）
│   └── utils/            # 技术指标计算与 HTTP 客户端
├── frontend/             # Next.js 前端
│   ├── src/app/          # 页面路由（/, /trade, /leaderboard, /predictions, /asset/[symbol]）
│   ├── src/components/   # React 组件
│   └── src/lib/api.ts    # API 请求封装
├── data/                 # SQLite 数据库文件（运行时生成）
├── start.sh              # 一键启动脚本
└── stop.sh               # 停止脚本
```

## 数据来源

所有外部数据均来自公开 API，无需认证：

- **黄金价格**：gold-api.com / yfinance (GC=F) / freegoldapi.com
- **加密货币价格**：Binance Public API / CoinGecko Demo API

主源失败时自动降级到备用源。采集频率远低于各平台速率限制。

## 追踪资产

| 类型 | 资产 |
|------|------|
| 黄金 | XAU/USD |
| 加密货币 | BTC, ETH, ADA, SOL, XRP, DOGE, DOT, MATIC, LTC, BCH |

## 默认端口

- 前端开发服务器：`30305`
- 后端 API：`30306`

> **注意**：以上端口仅为默认值，实际部署时可按需修改。
>
> **修改方法**：
> - **前端端口**：修改 `start.sh` 中的 `FRONTEND_PORT` 变量，并同步修改 `frontend/package.json` 中 `dev` 和 `start` 脚本的 `-p` 参数。
> - **后端端口**：修改 `.env` 中的 `PORT` 变量、`start.sh` 中的 `BACKEND_PORT` 变量，并同步修改 `frontend/next.config.mjs` 中 rewrite 规则的 `destination` 端口号。
>
> `backend/config.py` 中的 `PORT` 默认值为 `30306`，会被 `.env` 中的同名变量覆盖。

前端通过 `next.config.mjs` 的 rewrite 规则将 `/api/*` 代理到后端。

## 远程访问注意事项

前端 API 调用必须使用**相对路径**（`API_BASE = ""`），由 Next.js 的 rewrite 规则代理到后端。

**坑点**：若在前端代码中硬编码 `http://localhost:30305`，当用户通过远程 IP 访问页面时，浏览器会在客户端本地寻找后端服务，导致页面数据为空。

**正确做法**：
- `frontend/src/lib/api.ts` 中使用相对路径发起请求
- `frontend/next.config.mjs` 配置 rewrite 规则，将 `/api/*` 转发到后端端口

这样无论通过 `localhost` 还是远程 IP 访问，API 请求都会先到达 Next.js 前端服务器，再由其代理到后端，确保前后端衔接正常。
