"""Chat 路由 — 意图识别、对话、追问."""

import logging

from fastapi import APIRouter, Depends

from app.schemas.chat import (
    ApiResponse,
    AskRequest,
    AskResponse,
    IdentifyRequest,
    IdentifyResponse,
    SkipRequest,
    SkipResponse,
)
from app.services.chat_service import ChatService
from app.services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


def get_knowledge_service() -> KnowledgeService:
    """获取知识图谱服务实例（单例）."""
    return KnowledgeService()


def get_chat_service(
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
) -> ChatService:
    """获取 Chat 服务实例."""
    return ChatService(knowledge_service)


@router.post("/identify", response_model=ApiResponse)
async def identify_intent(
    request: IdentifyRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    """意图识别 — 提交用户消息，返回意图分类结果.

    Args:
        request: { message: "用户输入的自然语言" }

    Returns:
        { code: 0, data: { categoryId, level1, level2, confidence, ... }, message: "ok" }
    """
    try:
        result = await chat_service.identify_intent(request.message)
        return ApiResponse(code=0, data=result.model_dump(), message="ok")
    except ConnectionError as e:
        logger.error(f"DeepSeek API 不可达: {e}")
        return ApiResponse(
            code=51001,
            data=None,
            message="AI 服务暂时不可用，请稍后重试",
        )
    except ValueError as e:
        logger.error(f"意图识别处理失败: {e}")
        return ApiResponse(
            code=51002,
            data=None,
            message="意图识别处理失败，请重新描述",
        )
    except Exception as e:
        logger.exception(f"意图识别未知错误: {e}")
        return ApiResponse(
            code=51000,
            data=None,
            message="服务器内部错误，请稍后重试",
        )


@router.post("/ask", response_model=ApiResponse)
async def ask(
    request: AskRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    """对话/追问 — 提交用户消息和上下文，返回系统回复.

    支持首次识别后的确认消息和后续追问轮次。

    Args:
        request: {
            message: "用户消息",
            contextId: "对话上下文ID（首次为空）",
            categoryId: "已确认的分类ID（首次为空）",
            collectedFields: { "fieldId": "value" }
        }

    Returns:
        { code: 0, data: { message, intent?, fields[], isComplete }, message: "ok" }
    """
    try:
        result = await chat_service.ask(
            message=request.message,
            context_id=request.contextId,
            category_id=request.categoryId,
            collected_fields=request.collectedFields,
        )
        return ApiResponse(code=0, data=result.model_dump(), message="ok")
    except Exception as e:
        logger.exception(f"对话处理失败: {e}")
        return ApiResponse(
            code=51000,
            data=None,
            message="对话处理失败，请稍后重试",
        )


@router.post("/skip", response_model=ApiResponse)
async def skip(
    request: SkipRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    """跳过追问 — 基于已有信息直接生成初步结果.

    Args:
        request: {
            contextId: "对话上下文ID",
            categoryId: "已确认的分类ID",
            collectedFields: { "fieldId": "value" }
        }

    Returns:
        { code: 0, data: { message, factsExtracted[] }, message: "ok" }
    """
    try:
        result = await chat_service.skip_and_generate(
            context_id=request.contextId,
            category_id=request.categoryId,
            collected_fields=request.collectedFields,
        )
        return ApiResponse(code=0, data=result.model_dump(), message="ok")
    except Exception as e:
        logger.exception(f"跳过追问失败: {e}")
        return ApiResponse(
            code=51000,
            data=None,
            message="处理失败，请稍后重试",
        )
