"""知识包 Schema 定义 - 证据卡."""

from typing import Optional

from pydantic import BaseModel, Field


class EvidenceCard(BaseModel):
    """证据卡.

    说明某类证据可以支持什么、不能单独证明什么、
    如何保存以及隐私风险。
    """
    evidence_id: str = Field(
        ..., description="证据唯一标识",
        pattern=r"^ev_[a-z0-9_]+$",
    )
    name: str = Field(..., description="证据名称", examples=["银行流水"])
    evidence_type: str = Field(
        ..., description="证据类型",
        examples=["document", "electronic", "witness", "physical"],
    )
    description: str = Field(..., description="简要说明")

    supports: list[str] = Field(
        default_factory=list,
        description="能证明的事实列表",
    )
    cannot_prove_alone: list[str] = Field(
        default_factory=list,
        description="不能单独证明的事项",
    )

    preservation_tips: Optional[str] = Field(
        None, description="保存建议",
    )
    privacy_risks: Optional[str] = Field(
        None, description="隐私风险提示",
    )

    domain: str = Field(..., description="所属法律领域")
    topic: Optional[str] = Field(None, description="所属主题")
