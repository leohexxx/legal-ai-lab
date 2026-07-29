"""知识包 Schema 定义 - 来源登记表."""

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    """来源类型."""
    LAW = "law"                        # 法律
    ADMINISTRATIVE_REGULATION = "regulation"  # 行政法规
    LOCAL_REGULATION = "local_regulation"     # 地方性法规
    DEPARTMENTAL_RULE = "departmental_rule"   # 部门规章
    JUDICIAL_INTERPRETATION = "judicial_interpretation"  # 司法解释
    CASE = "case"                      # 案例
    GUIDELINE = "guideline"            # 规范性文件
    SECONDARY = "secondary"            # 二手资料


class SourceStatus(str, Enum):
    """来源效力状态."""
    ACTIVE = "active"                  # 现行有效
    AMENDED = "amended"                # 已修改
    REPEALED = "repealed"              # 已废止
    DRAFT = "draft"                    # 草案
    PENDING_REVIEW = "pending_review"  # 待核验


class SourceRegistry(BaseModel):
    """来源登记表.

    每个法律来源必须记录此信息，确保可回溯。
    """
    source_id: str = Field(
        ..., description="唯一来源标识符",
        pattern=r"^[a-z0-9_-]+$",
        examples=["labor_law_2018"],
    )
    title: str = Field(..., description="来源标题", examples=["中华人民共和国劳动法"])
    issuing_authority: str = Field(
        ..., description="发布机关",
        examples=["全国人民代表大会常务委员会"],
    )
    source_type: SourceType = Field(..., description="来源类型")
    official_url: Optional[str] = Field(
        None, description="官方原文 URL",
    )
    publication_date: date = Field(..., description="公布日期")
    effective_date: date = Field(..., description="生效日期")
    status: SourceStatus = Field(
        default=SourceStatus.ACTIVE, description="现行效力状态",
    )
    jurisdiction: str = Field(
        ..., description="适用地区",
        examples=["全国", "北京市", "广东省"],
    )
    retrieved_at: datetime = Field(
        default_factory=datetime.now,
        description="检索/采集日期",
    )
    content_hash: Optional[str] = Field(
        None, description="正文内容哈希值，用于监测官网变化",
    )
    supersedes: list[str] = Field(
        default_factory=list,
        description="被本文件取代的文件 ID 列表",
    )
    superseded_by: list[str] = Field(
        default_factory=list,
        description="取代本文件的文件 ID 列表",
    )
    notes: Optional[str] = Field(None, description="备注")
