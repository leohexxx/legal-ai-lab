"""知识包 Schema 定义 - 程序卡."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class ProcedureCard(BaseModel):
    """程序卡.

    记录进入条件、主管机关、材料、步骤、
    可能结果、期限、地区差异与风险。
    """
    procedure_id: str = Field(
        ..., description="程序唯一标识",
        pattern=r"^proc_[a-z0-9_]+$",
    )
    title: str = Field(..., description="程序名称")
    domain: str = Field(..., description="法律领域")
    topic: Optional[str] = Field(None, description="主题")

    prerequisites: list[dict[str, Any]] = Field(
        default_factory=list,
        description="进入条件列表",
    )
    authority: str = Field(..., description="主管机关", examples=["劳动监察大队"])
    required_materials: list[str] = Field(
        default_factory=list,
        description="所需材料清单",
    )
    steps: list[dict[str, Any]] = Field(
        default_factory=list,
        description="具体步骤（含说明、时限、注意事项）",
    )
    possible_outcomes: list[str] = Field(
        default_factory=list,
        description="可能结果",
    )
    deadlines: list[dict[str, Any]] = Field(
        default_factory=list,
        description="期限说明（含法律依据）",
    )

    jurisdiction: Optional[str] = Field(None, description="适用地区")
    risks: Optional[str] = Field(None, description="风险提示")
