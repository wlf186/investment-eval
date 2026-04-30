from fastapi import APIRouter
from backend.services.leaderboard_service import leaderboard_service

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("")
@router.get("/")
async def get_leaderboard(limit: int = 10):
    """获取排行榜 TOP N"""
    rankings = await leaderboard_service.get_leaderboard(limit)
    return {
        "rankings": rankings,
        "total_users": len(rankings)
    }
