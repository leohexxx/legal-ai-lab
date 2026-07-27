"""来源白名单与注册系统.

维护所有法律来源的权威白名单，确保每条法律信息可回溯至有效来源。
"""

from pathlib import Path
from typing import Optional

import yaml

from app.schemas.source import SourceRegistry

# 默认白名单文件路径
DEFAULT_WHITELIST_PATH = Path("data/knowledge/source_whitelist.yaml")


class SourceRegistryManager:
    """来源注册管理器."""

    def __init__(self, whitelist_path: Path = DEFAULT_WHITELIST_PATH):
        self.whitelist_path = whitelist_path
        self._registry: dict[str, SourceRegistry] = {}
        self._load()

    def _load(self):
        """从 YAML 文件加载白名单."""
        if not self.whitelist_path.exists():
            return
        with open(self.whitelist_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not data:
            return
        for item in data.get("sources", []):
            source = SourceRegistry(**item)
            self._registry[source.source_id] = source

    def register(self, source: SourceRegistry):
        """注册新来源."""
        self._registry[source.source_id] = source
        self._save()

    def get(self, source_id: str) -> Optional[SourceRegistry]:
        """按 ID 获取来源."""
        return self._registry.get(source_id)

    def list_active(self) -> list[SourceRegistry]:
        """列出所有现行有效的来源."""
        return [
            s for s in self._registry.values()
            if s.status.value == "active"
        ]

    def list_by_domain(self, domain: str) -> list[SourceRegistry]:
        """按领域列出来源."""
        # 来源本身不直接标记 domain，可通过 source_id 前缀判断
        return [s for s in self._registry.values()
                if s.source_id.startswith(domain)]

    def _save(self):
        """保存白名单到 YAML 文件."""
        self.whitelist_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "sources": [s.model_dump(mode="json") for s in self._registry.values()],
        }
        with open(self.whitelist_path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, allow_unicode=True, sort_keys=False)
