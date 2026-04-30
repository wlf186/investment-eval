from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.database import init_db
from backend.services.price_service import price_service
from backend.services.analysis_service import analysis_service
from backend.routers import prices, analysis, trading, users, leaderboard

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化数据库
    await init_db()

    # 启动时立即获取一次价格
    await price_service.update_all_prices()

    # 设置定时任务
    scheduler.add_job(
        price_service.update_all_prices,
        IntervalTrigger(minutes=30),
        id="price_update",
        replace_existing=True
    )
    scheduler.add_job(
        analysis_service.analyze_all_assets,
        IntervalTrigger(hours=6),
        id="analysis",
        replace_existing=True
    )
    scheduler.start()

    yield

    # 关闭时清理
    scheduler.shutdown()
    await price_service.close()


app = FastAPI(
    title="Gold & Crypto Tracker API",
    description="Real-time gold and cryptocurrency tracking with technical analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(prices.router)
app.include_router(analysis.router)
app.include_router(trading.router)
app.include_router(users.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "gold-crypto-tracker"}


@app.get("/api/assets")
async def get_assets():
    from backend.config import settings
    return {
        "gold": settings.ASSETS["gold"],
        "crypto": settings.ASSETS["crypto"]
    }
