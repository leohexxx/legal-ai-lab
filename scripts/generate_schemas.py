"""生成 JSON Schema 文件，供数据校验和文档使用."""

import json
from pathlib import Path

from app.schemas.source import SourceRegistry
from app.schemas.rule import LegalRuleCard
from app.schemas.evidence import EvidenceCard
from app.schemas.procedure import ProcedureCard
from app.schemas.case import CaseCard
from app.schemas.scenario import ScenarioCard

SCHEMAS_DIR = Path("app/schemas/json_schemas")

MODELS = {
    "source_registry": SourceRegistry,
    "legal_rule_card": LegalRuleCard,
    "evidence_card": EvidenceCard,
    "procedure_card": ProcedureCard,
    "case_card": CaseCard,
    "scenario_card": ScenarioCard,
}


def generate():
    """生成所有 JSON Schema 文件."""
    SCHEMAS_DIR.mkdir(parents=True, exist_ok=True)

    for name, model in MODELS.items():
        schema = model.model_json_schema()
        output_path = SCHEMAS_DIR / f"{name}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2, ensure_ascii=False)
        print(f"✅ Generated {output_path}")


if __name__ == "__main__":
    generate()
