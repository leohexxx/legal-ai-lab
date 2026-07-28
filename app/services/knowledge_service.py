"""知识图谱服务 — 加载、查询劳动法知识图谱."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

# 默认知识图谱路径
DEFAULT_GRAPH_PATH = Path("data/knowledge/knowledge_graph.json")


class KnowledgeService:
    """知识图谱服务.

    功能：
    - 加载 knowledge_graph.json 到内存
    - 按 ID 查询分类节点
    - 按关键词模糊匹配
    - 获取分类的 requiredFields 定义
    """

    def __init__(self, graph_path: Path = DEFAULT_GRAPH_PATH):
        self.graph_path = graph_path
        self._graph: list[dict[str, Any]] = []
        self._index: dict[str, dict[str, Any]] = {}
        self._load()

    def _load(self):
        """从 JSON 文���加载知识图谱."""
        if not self.graph_path.exists():
            raise FileNotFoundError(
                f"知识图谱文件不存在: {self.graph_path}"
            )
        with open(self.graph_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self._graph = data.get("categories", [])
        # 建立 ID 索引
        self._index = {cat["categoryId"]: cat for cat in self._graph}

    def reload(self):
        """重新加载图谱（文件更新后调用）."""
        self._load()

    def get_all_categories(self) -> list[dict[str, Any]]:
        """获取全部分类列表."""
        return self._graph

    def get_category_by_id(self, category_id: str) -> Optional[dict[str, Any]]:
        """按 ID 获取分类."""
        return self._index.get(category_id)

    def get_category_fields(self, category_id: str) -> list[dict[str, Any]]:
        """获取某分类的字段定义.

        返回格式同 FollowUpField，包含字段ID、标签、类型、选项等。
        当前返回简单映射，后续可扩展为从独立配置文件读取。
        """
        category = self.get_category_by_id(category_id)
        if not category:
            return []

        # 基础字段定义映射（可扩展）
        field_definitions = {
            "employerName": {"fieldId": "employerName", "label": "用人单位全称", "type": "text", "required": True},
            "workplace": {"fieldId": "workplace", "label": "实际工作地点", "type": "text", "required": False},
            "hireDate": {"fieldId": "hireDate", "label": "入职日期", "type": "date", "required": True},
            "contractPeriod": {"fieldId": "contractPeriod", "label": "当前合同期限", "type": "text", "required": True},
            "hasNotice": {"fieldId": "hasNotice", "label": "公司是否提前通知？", "type": "select", "options": [
                {"label": "提前30天以上通知", "value": "more_than_30"},
                {"label": "提前不到30天通知", "value": "less_than_30"},
                {"label": "没有提前通知", "value": "no_notice"},
            ], "required": True},
            "reasonForNonRenewal": {"fieldId": "reasonForNonRenewal", "label": "公司不续签的理由是什么？", "type": "text", "required": False},
            "yearsOfService": {"fieldId": "yearsOfService", "label": "您在这家公司工作了多少年？", "type": "text", "required": True},
            "contractSignCount": {"fieldId": "contractSignCount", "label": "之前签过几次劳动合同？", "type": "select", "options": [
                {"label": "1次", "value": "1"},
                {"label": "2次", "value": "2"},
                {"label": "3次及以上", "value": "3+"},
                {"label": "不确定", "value": "unknown"},
            ], "required": False},
            "baseSalary": {"fieldId": "baseSalary", "label": "您的月工资是多少？", "type": "text", "required": True},
            "salaryPeriod": {"fieldId": "salaryPeriod", "label": "发薪周期", "type": "select", "options": [
                {"label": "每月", "value": "monthly"},
                {"label": "每半月", "value": "biweekly"},
                {"label": "每周", "value": "weekly"},
                {"label": "其他", "value": "other"},
            ], "required": True},
            "arrearsStart": {"fieldId": "arrearsStart", "label": "从哪个月开始欠薪？", "type": "text", "required": True},
            "arrearsEnd": {"fieldId": "arrearsEnd", "label": "到哪个月为止欠薪？", "type": "text", "required": True},
            "totalOwed": {"fieldId": "totalOwed", "label": "大概欠了多少钱？", "type": "text", "required": True},
            "hasNegotiated": {"fieldId": "hasNegotiated", "label": "是否已经和公司协商过？", "type": "select", "options": [
                {"label": "协商过", "value": "yes"},
                {"label": "没有协商过", "value": "no"},
            ], "required": False},
            "terminationDate": {"fieldId": "terminationDate", "label": "什么时候被辞退的？", "type": "date", "required": True},
            "terminationReason": {"fieldId": "terminationReason", "label": "公司给出的辞退理由是什么？", "type": "text", "required": True},
            "noticePeriod": {"fieldId": "noticePeriod", "label": "公司提前多久通知的？", "type": "select", "options": [
                {"label": "提前30天通知", "value": "30_days"},
                {"label": "提前不到30天", "value": "less_than_30"},
                {"label": "没有提前通知，立即辞退", "value": "no_notice"},
            ], "required": True},
            "severancePaid": {"fieldId": "severancePaid", "label": "公司是否支付了经济补偿？", "type": "select", "options": [
                {"label": "支付了", "value": "yes"},
                {"label": "没有支付", "value": "no"},
                {"label": "还在协商中", "value": "negotiating"},
            ], "required": True},
            "workSchedule": {"fieldId": "workSchedule", "label": "您的工作制是怎样的？", "type": "select", "options": [
                {"label": "标准工时制（周一到周五）", "value": "standard"},
                {"label": "综合计算工时制", "value": "comprehensive"},
                {"label": "不定时工作制", "value": "irregular"},
                {"label": "不确定", "value": "unknown"},
            ], "required": True},
            "overtimeType": {"fieldId": "overtimeType", "label": "哪种加班？", "type": "select", "options": [
                {"label": "工作日加班（平时晚上）", "value": "weekday"},
                {"label": "休息日加班（周六日）", "value": "weekend"},
                {"label": "法定节假日加班", "value": "holiday"},
                {"label": "以上都有", "value": "all"},
            ], "required": True},
            "overtimeHours": {"fieldId": "overtimeHours", "label": "平均每月加班多少小时？", "type": "text", "required": True},
            "payMethod": {"fieldId": "payMethod", "label": "公司怎么发工资的？", "type": "text", "required": False},
            "contractStatus": {"fieldId": "contractStatus", "label": "是否签订了劳动合同？", "type": "select", "options": [
                {"label": "签了书面合同", "value": "signed"},
                {"label": "没签合同", "value": "unsigned"},
                {"label": "不确定", "value": "unknown"},
            ], "required": True},
            "injuryDate": {"fieldId": "injuryDate", "label": "受伤日期是哪天？", "type": "date", "required": True},
            "injuryCause": {"fieldId": "injuryCause", "label": "受伤原因是什么？", "type": "text", "required": True},
            "injuryLocation": {"fieldId": "injuryLocation", "label": "受伤地点在哪？", "type": "text", "required": True},
            "insuredStatus": {"fieldId": "insuredStatus", "label": "目前社保缴纳状态？", "type": "select", "options": [
                {"label": "公司一直在交", "value": "paying"},
                {"label": "公司从未交过", "value": "never"},
                {"label": "断缴了", "value": "interrupted"},
                {"label": "不确定", "value": "unknown"},
            ], "required": True},
            "missedMonths": {"fieldId": "missedMonths", "label": "欠缴了几个月？", "type": "text", "required": False},
            "isPregnant": {"fieldId": "isPregnant", "label": "是否怀孕？", "type": "select", "options": [
                {"label": "是", "value": "yes"},
                {"label": "否", "value": "no"},
            ], "required": True},
            "leaveDays": {"fieldId": "leaveDays", "label": "已经休了多少天假？", "type": "text", "required": False},
            "evidenceTypes": {"fieldId": "evidenceTypes", "label": "目前有哪些证据？", "type": "text", "required": False},
        }

        required_ids = category.get("requiredFields", [])
        return [field_definitions[fid] for fid in required_ids if fid in field_definitions]

    def get_level1_groups(self) -> dict[str, list[dict[str, Any]]]:
        """按一级分类分组."""
        groups: dict[str, list[dict[str, Any]]] = {}
        for cat in self._graph:
            groups.setdefault(cat["level1"], []).append(cat)
        return groups

    def search_by_keywords(self, query: str) -> list[dict[str, Any]]:
        """基于关键词的简单匹配检索.

        Args:
            query: 用户查询文本

        Returns:
            匹配的分类列表（按匹配度降序）
        """
        query_lower = query.lower()
        results = []

        for cat in self._graph:
            score = 0
            # 关键词匹配
            for kw in cat.get("keywords", []):
                if kw.lower() in query_lower:
                    score += 10
            # 分类名匹配
            if cat["displayName"].lower() in query_lower:
                score += 5
            if cat["level1"].lower() in query_lower:
                score += 3
            if cat["level2"].lower() in query_lower:
                score += 3
            # 相关问题匹配
            for q in cat.get("relatedQuestions", []):
                if any(kw.lower() in query_lower for kw in q.split() if len(kw) > 2):
                    score += 1

            if score > 0:
                results.append((score, cat))

        results.sort(key=lambda x: x[0], reverse=True)
        return [cat for _, cat in results]
