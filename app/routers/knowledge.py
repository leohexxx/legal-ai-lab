"""Knowledge 路由 — 知识图谱查询."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.chat import (
    ApiResponse,
    KnowledgeCategoryDetailResponse,
    KnowledgeCategoryResponse,
    KnowledgeSearchResponse,
    KnowledgesearchRequest,
)
from app.services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def get_knowledge_service() -> KnowledgeService:
    """获取知识图谱服务实例."""
    return KnowledgeService()


@router.get("/categories", response_model=ApiResponse)
async def get_categories(
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取知识图谱全部分类树.

    Returns:
        { code: 0, data: [{ categoryId, level1, level2, displayName, keywords, requiredFields }], message: "ok" }
    """
    try:
        categories = knowledge_service.get_all_categories()
        result = [
            KnowledgeCategoryResponse(
                categoryId=cat["categoryId"],
                level1=cat["level1"],
                level2=cat["level2"],
                displayName=cat["displayName"],
                keywords=cat.get("keywords", []),
                requiredFields=cat.get("requiredFields", []),
            )
            for cat in categories
        ]
        return ApiResponse(
            code=0,
            data=[r.model_dump() for r in result],
            message="ok",
        )
    except Exception as e:
        logger.exception(f"获取分类树失败: {e}")
        return ApiResponse(code=52000, data=None, message="获取分类树失败")


@router.get("/categories/{category_id}", response_model=ApiResponse)
async def get_category_detail(
    category_id: str,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取某分类的详细信息.

    Args:
        category_id: 分类 ID

    Returns:
        分类详情（含 relatedQuestions, relevantLaws, excludeFrom）
    """
    try:
        cat = knowledge_service.get_category_by_id(category_id)
        if not cat:
            raise HTTPException(status_code=404, detail=f"分类 {category_id} 不存在")

        result = KnowledgeCategoryDetailResponse(
            categoryId=cat["categoryId"],
            level1=cat["level1"],
            level2=cat["level2"],
            displayName=cat["displayName"],
            keywords=cat.get("keywords", []),
            requiredFields=cat.get("requiredFields", []),
            relatedQuestions=cat.get("relatedQuestions", []),
            relevantLaws=cat.get("relevantLaws", []),
            excludeFrom=cat.get("excludeFrom", []),
        )
        return ApiResponse(code=0, data=result.model_dump(), message="ok")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"获取分类详情失败: {e}")
        return ApiResponse(code=52000, data=None, message="获取分类详情失败")


@router.get("/categories/{category_id}/fields", response_model=ApiResponse)
async def get_category_fields(
    category_id: str,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """获取某分类的最小信息集字段定义.

    返回该分类需要采集的字段列表（含输入类型、选项等）。

    Args:
        category_id: 分类 ID

    Returns:
        字段定义列表
    """
    try:
        cat = knowledge_service.get_category_by_id(category_id)
        if not cat:
            raise HTTPException(status_code=404, detail=f"分类 {category_id} 不存在")

        fields = knowledge_service.get_category_fields(category_id)
        return ApiResponse(code=0, data=fields, message="ok")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"获取分类字段失败: {e}")
        return ApiResponse(code=52000, data=None, message="获取分类字段失败")


@router.post("/search", response_model=ApiResponse)
async def search(
    request: KnowledgesearchRequest,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    """知识检索（简单关键词匹配，Phase 4 升级为向量检索）.

    Args:
        request: { query: "用户问题" }

    Returns:
        匹配的分类列表
    """
    try:
        results = knowledge_service.search_by_keywords(request.query)
        return ApiResponse(
            code=0,
            data=[{
                "categoryId": cat["categoryId"],
                "level1": cat["level1"],
                "level2": cat["level2"],
                "displayName": cat["displayName"],
                "relevance": idx + 1,
            } for idx, cat in enumerate(results)],
            message="ok",
        )
    except Exception as e:
        logger.exception(f"知识检索失败: {e}")
        return ApiResponse(code=52000, data=None, message="知识检索失败")
