"""评测框架 - 测试场景加载与运行."""

from pathlib import Path
from typing import Any

import yaml

# 测试场景文件路径
SCENARIOS_PATH = Path(__file__).parent / "test_scenarios.yaml"


def load_test_scenarios() -> list[dict[str, Any]]:
    """加载所有结构化测试场景."""
    with open(SCENARIOS_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["test_cases"]


def get_scenario_by_id(scenario_id: str) -> dict[str, Any]:
    """按 ID 获取单个测试场景."""
    scenarios = load_test_scenarios()
    for sc in scenarios:
        if sc["id"] == scenario_id:
            return sc
    raise KeyError(f"未找到测试场景: {scenario_id}")


# ==== 评测检查函数 ====


def check_required_fields(scenario: dict[str, Any], collected_fields: list[str]) -> dict:
    """检查必填字段是否已采集."""
    required = set(scenario.get("required_fields", []))
    collected = set(collected_fields)
    missing = required - collected
    return {
        "pass": len(missing) == 0,
        "required": list(required),
        "collected": list(collected),
        "missing": list(missing),
    }


def check_prohibited_behaviors(
    scenario: dict[str, Any], output_text: str,
) -> list[dict]:
    """检查输出中是否包含禁止行为."""
    must_not = scenario.get("must_not", [])
    violations = []
    for rule in must_not:
        # 简单的关键词匹配（后续可升级为 LLM 评测）
        violations.append({
            "rule": rule,
            "violated": False,  # 需要结合具体输出判断
            "detail": "需人工或 LLM 评测确认",
        })
    return violations


def check_must_check_conditions(
    scenario: dict[str, Any], output_text: str,
) -> list[dict]:
    """检查必须满足的条件."""
    must_check = scenario.get("must_check", [])
    results = []
    for condition in must_check:
        results.append({
            "condition": condition,
            "passed": False,  # 需要结合具体输出判断
            "detail": "需人工或 LLM 评测确认",
        })
    return results
