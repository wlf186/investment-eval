# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gold & Crypto Tracker is a local-deployed real-time dashboard for tracking gold (XAU/USD) and cryptocurrencies (BTC, ETH, etc.) with technical analysis, predictions, and paper trading. It uses only public APIs — no API keys or external AI services.

## Architecture

- **Backend**: Python FastAPI with async SQLAlchemy + aiosqlite, APScheduler for periodic tasks.
- **Frontend**: Next.js 14 (App Router) + React 18 + Tailwind CSS + Recharts.
- **Database**: SQLite (`data/tracker.db`), initialized automatically on startup.
- **Ports**: Backend runs on `30306`, frontend dev server on `30305`. Frontend rewrites `/api/*` and `/health` to the backend.

### Key Backend Modules

- `backend/main.py`: FastAPI entry point. Registers routers and sets up the APScheduler lifespan (price updates every 30 min, analysis every 6 hours).
- `backend/config.py`: `Settings` singleton (Pydantic) with assets, API URLs, trading fees, and spreads.
- `backend/database.py`: Async SQLAlchemy engine and session factory.
- `backend/services/price_service.py`: Fetches prices from public APIs with failover (gold-api.com → yfinance; Binance → CoinGecko).
- `backend/services/analysis_service.py`: Pure technical analysis (RSI, MACD, Bollinger Bands, EMA, SMA, ATR) — no ML/AI.
- `backend/services/trading_service.py`: Paper trading engine with fees/spreads.
- `backend/routers/`: API route modules (`prices`, `analysis`, `trading`, `users`, `leaderboard`).

### Key Frontend Files

- `frontend/next.config.mjs`: Configures rewrites so `/api/*` proxies to `http://localhost:30306/api/*`.
- `frontend/src/lib/api.ts`: Thin `fetchAPI` wrapper using relative paths.
- `frontend/src/app/page.tsx`: Dashboard with price cards, charts, predictions preview, and leaderboard.
- `frontend/src/app/asset/[symbol]/page.tsx`: Asset detail page.
- `frontend/src/app/trade/page.tsx`: Paper trading UI.

## Common Commands

### Start / Stop

Use the provided scripts to run both services:

```bash
# Start backend (port 30306) and frontend (port 30305)
./start.sh

# Stop both
./stop.sh
```

### Backend (Python)

Requires virtualenv at `.venv`:

```bash
source .venv/bin/activate

# Run dev server with auto-reload
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30306 --reload

# Install dependencies
pip install -r requirements.txt
```

### Frontend (Next.js)

```bash
cd frontend
source ~/.nvm/nvm.sh && nvm use 24

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

The frontend `package.json` scripts use `-p 30305 -H 0.0.0.0`.

### Running Tests

There are currently no test suites configured. If adding tests:

- **Backend**: Use `pytest`. Add it to `requirements.txt` if not present.
- **Frontend**: Next.js projects typically use Jest or Vitest; check `frontend/package.json` for available test scripts.

## Data Sources & Scheduling

- **Prices**: Collected every 30 minutes from gold-api.com and Binance public API, with automatic failover.
- **Analysis**: Runs every 6 hours, computing technical indicators and generating 24h/7d/30d predictions.
- **Zero API Keys**: All external data comes from unauthenticated public endpoints. Do not introduce API-key-dependent services.

## Environment

`.env` at the repo root sets:

```
PORT=30306
DATABASE_URL=sqlite+aiosqlite:///data/tracker.db
PRICE_UPDATE_INTERVAL_MINUTES=30
ANALYSIS_INTERVAL_HOURS=6
```

Additional settings (assets, API URLs, fees) are hardcoded in `backend/config.py` via Pydantic `BaseSettings` defaults.

## Notes

- The backend logs to `backend.log`, frontend to `frontend/frontend.log`.
- PIDs are tracked in `backend.pid` and `frontend.pid`.
- When adding new API endpoints, ensure they are registered in `backend/main.py` and proxied in `frontend/next.config.mjs` if needed.
