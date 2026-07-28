"""Chat 相关 Schema 定义."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class IdentifyRequest(BaseModel):
    """意图识别请求."""
    message: str = Field(..., description="用户输入的自然语言描述", min_length=1, max_length=2000)


class AlternativeCategory(BaseModel):
    """备选分类."""
    categoryId: str = Field(..., description="分类 ID")
    reason: str = Field(..., description="选择原因")


class IdentifyResponse(BaseModel):
    """意图识别响应."""
    categoryId: str = Field(..., description="最匹配的二级分类 ID")
    level1: str = Field(..., description="一级分类名称")
    level2: str = Field(..., description="二级分类名称")
    confidence: float = Field(..., ge=0, le=1, description="置信度 0-1")
    extractedKeywords: list[str] = Field(default_factory=list, description="抽取的关键词")
    summary: str = Field(..., description="系统理解摘要（不超过50字）")
    alternativeCategories: list[AlternativeCategory] = Field(
        default_factory=list, description="备选分类列表"
    )


class FollowUpOption(BaseModel):
    """追问选项."""
    label: str = Field(..., description="选项显示文本")
    value: str = Field(..., description="选项值")


class FollowUpField(BaseModel):
    """追问字段定义."""
    fieldId: str = Field(..., description="字段唯一 ID")
    label: str = Field(..., description="问题描述")
    type: Literal["text", "select", "date", "number"] = Field(..., description="输入类型")
    options: list[FollowUpOption] | None = Field(None, description="选项列表（select 类型时必填）")
    required: bool = Field(default=False, description="是否必填")


class AskRequest(BaseModel):
    """对话/追问请求."""
    message: str = Field(..., description="用户消息", min_length=1, max_length=2000)
    contextId: str | None = Field(None, description="对话上下文 ID")
    categoryId: str | None = Field(None, description="已确认的分类 ID")
    collectedFields: dict[str, str] = Field(
        default_factory=dict, description="已收集的字段映射 {fieldId: value}"
    )


class AskResponse(BaseModel):
    """对话/追问响应."""
    message: str = Field(..., description="系统回复文本")
    intent: IdentifyResponse | None = Field(None, description="意图识别结果（首次识别时附带）")
    fields: list[FollowUpField] = Field(default_factory=list, description="追问字段列表")
    isComplete: bool = Field(default=False, description="信息是否已足够，可以生成结果")


class SkipRequest(BaseModel):
    """跳过追问请求."""
    contextId: str = Field(..., description="对话上下文 ID")
    categoryId: str = Field(..., description="已确认的分类 ID")
    collectedFields: dict[str, str] = Field(
        ..., description="已收集的字段映射 {fieldId: value}"
    )


class FactExtracted(BaseModel):
    """从对话中提取的事实."""
    label: str = Field(..., description="事实标签")
    value: str = Field(..., description="事实内容")
    source: str = Field("对话提取", description="来源说明")


class SkipResponse(BaseModel):
    """跳过追问响应."""
    message: str = Field(..., description="系统回复（初步分析结果）")
    factsExtracted: list[FactExtracted] = Field(
        default_factory=list, description="提取的事实列表"
    )


class KnowledgeCategoryResponse(BaseModel):
    """知识图谱分类响应."""
    categoryId: str
    level1: str
    level2: str
    displayName: str
    keywords: list[str]
    requiredFields: list[str]


class KnowledgeCategoryDetailResponse(KnowledgeCategoryResponse):
    """知识图谱分类详细信息."""
    relatedQuestions: list[str] = Field(default_factory=list)
    relevantLaws: list[dict[str, Any]] = Field(default_factory=list)
    excludeFrom: list[str] = Field(default_factory=list)


class KnowledgesearchRequest(BaseModel):
    """知识检索请求."""
    query: str = Field(..., description="检索关键词", min_length=1, max_length=500)


class KnowledgeSearchResponse(BaseModel):
    """知识检索响应."""
    results: list[dict[str, Any]] = Field(default_factory=list, description="检索结果列表")


class ApiResponse(BaseModel):
    """统一 API 响应格式."""
    code: int = Field(default=0, description="状态码，0 表示成功")
    data: Any = Field(default=None, description="响应数据")
    message: str = Field(default="ok", description="提示信息")
