"""健康检查路由."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """服务健康检查."""
    return {"status": "ok", "service": "legal-ai-lab", "version": "0.1.0"}
