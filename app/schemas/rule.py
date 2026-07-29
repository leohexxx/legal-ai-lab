"""知识包 Schema 定义 - 法律规则卡."""

from datetime import date
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ReviewStatus(str, Enum):
    """审核状态."""
    DRAFT = "draft"
    REVIEWED = "reviewed"
    PUBLISHED = "published"


class LegalRuleCard(BaseModel):
    """法律规则卡.

    将法规拆分为可检索、可判断的独立规则单元，
    而不是把整部法律直接交给模型。
    """
    rule_id: str = Field(
        ..., description="规则唯一标识",
        pattern=r"^rule_[a-z0-9_]+$",
    )
    title: str = Field(..., description="规则标题")
    domain: str = Field(..., description="法律领域", examples=["labor"])
    topic: str = Field(..., description="主题", examples=["wage_arrears"])
    jurisdiction: str = Field(..., description="适用地区")
    effective_from: date = Field(..., description="生效起始日期")
    effective_to: Optional[date] = Field(None, description="生效截止日期")
    status: str = Field(default="active", description="状态: active/amended/repealed")

    conditions: list[dict[str, Any]] = Field(
        default_factory=list,
        description="适用条件列表，每项含 description + 逻辑表达式",
    )
    legal_effect: str = Field(..., description="法律效果/后果描述")
    exceptions: list[dict[str, Any]] = Field(
        default_factory=list,
        description="但书/例外情况",
    )

    facts_required: list[str] = Field(
        default_factory=list,
        description="适用本规则需要确认的事实项",
    )
    evidence_related: list[str] = Field(
        default_factory=list,
        description="相关证据类型 ID",
    )
    procedure_related: list[str] = Field(
        default_factory=list,
        description="相关程序 ID",
    )

    source_id: str = Field(..., description="来源登记 ID")
    article_ref: str = Field(..., description="条款号", examples=["第五十条"])
    official_url: Optional[str] = Field(None, description="原文链接")

    review_status: ReviewStatus = Field(
        default=ReviewStatus.DRAFT, description="审核状态",
    )
