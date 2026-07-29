"""Legal AI Lab - 主应用入口."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.routers import health
from app.routers import chat as chat_router
from app.routers import knowledge as knowledge_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理."""
    settings = get_settings()
    # 启动时：检查数据库连接、初始化知识库等
    yield
    # 关闭时：清理资源


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Legal AI Lab - AI-powered legal assistance platform",
        lifespan=lifespan,
    )

    # 注册路由
    app.include_router(health.router, prefix="/api/v1", tags=["health"])
    app.include_router(chat_router.router, prefix="/api/v1", tags=["chat"])
    app.include_router(knowledge_router.router, prefix="/api/v1", tags=["knowledge"])

    return app


app = create_app()
