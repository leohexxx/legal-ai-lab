"""知识包 Schema 定义 - 场景卡."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class ScenarioCard(BaseModel):
    """场景卡.

    定义必问事实、可能责任主体、证据清单、
    规则、流程、风险和转人工条件。
    """
    scenario_id: str = Field(
        ..., description="场景唯一标识",
        pattern=r"^sc_[a-z0-9_]+$",
    )
    title: str = Field(..., description="场景名称")
    domain: str = Field(..., description="法律领域")
    topic: str = Field(..., description="主题")

    description: str = Field(..., description="场景描述")
    trigger_keywords: list[str] = Field(
        default_factory=list,
        description="触发该场景的用户输入关键词",
    )

    required_facts: list[dict[str, Any]] = Field(
        default_factory=list,
        description="必问事实列表（含字段、类型、提问话术）",
    )
    possible_liable_parties: list[str] = Field(
        default_factory=list,
        description="可能责任主体类型",
    )

    evidence_checklist: list[str] = Field(
        default_factory=list,
        description="证据清单 ID 列表",
    )
    rules_reference: list[str] = Field(
        default_factory=list,
        description="相关规则 ID 列表",
    )
    procedures_reference: list[str] = Field(
        default_factory=list,
        description="相关程序 ID 列表",
    )

    risks: list[str] = Field(
        default_factory=list,
        description="风险提示",
    )
    escalation_conditions: list[str] = Field(
        default_factory=list,
        description="转人工咨询条件",
    )
