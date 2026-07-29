"""评测框架测试."""

import pytest
import yaml

from tests.evaluation import (
    check_required_fields,
    load_test_scenarios,
)


class TestScenarioLoading:
    """测试场景加载."""

    def test_load_all_scenarios(self):
        """所有测试场景应能正确加载."""
        scenarios = load_test_scenarios()
        assert len(scenarios) == 10
        ids = [s["id"] for s in scenarios]
        expected = [f"TC-{i:02d}" for i in range(1, 11)]
        assert ids == expected

    def test_required_fields_exist(self):
        """每个场景应有必填字段定义."""
        scenarios = load_test_scenarios()
        for sc in scenarios:
            assert "required_fields" in sc
            assert len(sc["required_fields"]) > 0

    def test_must_check_exist(self):
        """每个场景应有检查项."""
        scenarios = load_test_scenarios()
        for sc in scenarios:
            assert "must_check" in sc
            assert len(sc["must_check"]) > 0

    def test_must_not_exist(self):
        """每个场景应有禁止项."""
        scenarios = load_test_scenarios()
        for sc in scenarios:
            # TC-04 和 TC-06 有 must_not
            assert "must_not" in sc

    def test_pass_criteria_exist(self):
        """每个场景应有通过标准."""
        scenarios = load_test_scenarios()
        for sc in scenarios:
            assert "pass_criteria" in sc
            assert len(sc["pass_criteria"]) > 0


class TestRequiredFieldsCheck:
    """必填字段检查测试."""

    def test_all_collected(self):
        """全部采集时应通过."""
        scenario = {"required_fields": ["employer_name", "period"]}
        result = check_required_fields(scenario, ["employer_name", "period"])
        assert result["pass"] is True
        assert result["missing"] == []

    def test_missing_fields(self):
        """有缺失时应不通过."""
        scenario = {"required_fields": ["employer_name", "period", "amount_expected"]}
        result = check_required_fields(scenario, ["employer_name"])
        assert result["pass"] is False
        assert "period" in result["missing"]
        assert "amount_expected" in result["missing"]
