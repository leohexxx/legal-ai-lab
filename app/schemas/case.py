"""知识包 Schema 定义 - 案例卡."""

from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, Field


class CaseCard(BaseModel):
    """案例卡.

    记录事实、争点、请求、证据、适用规则、
    裁判理由、结果、局限与权威来源。
    案例不能被写成普遍规则。
    """
    case_id: str = Field(
        ..., description="案例唯一标识",
        pattern=r"^case_[a-z0-9_]+$",
    )
    case_number: str = Field(..., description="案号")
    court: str = Field(..., description="审理法院")
    judgment_date: date = Field(..., description="裁判日期")

    domain: str = Field(..., description="法律领域")
    topic: Optional[str] = Field(None, description="主题")

    facts_abstract: str = Field(..., description="事实摘要")
    dispute_focus: list[str] = Field(
        default_factory=list,
        description="争议焦点",
    )
    claims: list[str] = Field(
        default_factory=list,
        description="当事人的请求",
    )

    reasoning: str = Field(
        ..., description='裁判理由（尽量引用"本院认为"原文）',
    )
    result: str = Field(..., description="裁判结果")

    applicable_rules: list[dict[str, Any]] = Field(
        default_factory=list,
        description="适用的法律规则引用",
    )
    source: str = Field(..., description="案例来源")
    limitations: str = Field(
        default="个案结果不可直接类推。", description="适用范围与局限说明",
    )
