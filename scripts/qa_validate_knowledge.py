#!/usr/bin/env python3
"""
QA Validation Script — B1 Rule Cards + B2 Case Cards Integrity Check
验证劳动法知识库规则卡和案例卡的完整性、格式正确性、必填字段及分类覆盖。

验证范围：
  B1: data/knowledge/labor/rules/labor_rule_021.yml ~ labor_rule_060.yml (40条)
  B2: data/knowledge/labor/cases/labor_case_001.yml ~ labor_case_030.yml (30条)
"""

import json
import os
import sys
from collections import defaultdict, Counter

import yaml

# ---------- Paths ----------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_DIR    = os.path.join(PROJECT_ROOT, "data", "knowledge", "labor", "rules")
CASES_DIR    = os.path.join(PROJECT_ROOT, "data", "knowledge", "labor", "cases")
KGRAPH_PATH  = os.path.join(PROJECT_ROOT, "data", "knowledge", "knowledge_graph.json")

# ---------- Load knowledge graph for level1 classification ----------
def load_knowledge_graph():
    """Load knowledge_graph.json and build categoryId -> level1 mapping."""
    with open(KGRAPH_PATH, "r", encoding="utf-8") as f:
        kg = json.load(f)
    cat_to_level1 = {}
    for cat in kg.get("categories", []):
        cat_to_level1[cat["categoryId"]] = cat["level1"]
    return cat_to_level1

CAT_TO_LEVEL1 = load_knowledge_graph()
LEVEL1_CATEGORIES = sorted(set(CAT_TO_LEVEL1.values()))
print(f"[INFO] 知识图谱一级分类 ({len(LEVEL1_CATEGORIES)}个):")
for l1 in LEVEL1_CATEGORIES:
    print(f"       - {l1}")
print()

# ---------- Helpers ----------
PASS = "PASS"
FAIL = "FAIL"

results = []  # list of (check_name, status, detail)


def check(ok, name, detail=""):
    status = PASS if ok else FAIL
    results.append((name, status, detail))


def resolve_level1(category_ids, cat_to_level1):
    """Resolve a list of categoryIds to their level1 names."""
    level1s = set()
    unknown = []
    for cid in category_ids:
        l1 = cat_to_level1.get(cid)
        if l1:
            level1s.add(l1)
        else:
            unknown.append(cid)
    return level1s, unknown


# ============================================================
# 1. File Existence Check
# ============================================================
print("=" * 60)
print("1. 文件存在性检查")
print("=" * 60)

# B1: labor_rule_021 ~ 060
rule_files_expected = [f"labor_rule_{i:03d}.yml" for i in range(21, 61)]
rule_files_found = set(os.listdir(RULES_DIR))
rule_missing = []
rule_present = []
for f in rule_files_expected:
    if f in rule_files_found:
        rule_present.append(f)
    else:
        rule_missing.append(f)

check(len(rule_missing) == 0,
      "B1-文件存在性（40条）",
      f"期望={len(rule_files_expected)}, 存在={len(rule_present)}, "
      f"缺失={rule_missing if rule_missing else '无'}")

if rule_missing:
    for f in rule_missing:
        print(f"  [MISSING] {f}")
else:
    print(f"  [PASS] 全部 {len(rule_present)} 个规则卡文件均存在")

print()

# B2: labor_case_001 ~ 030
case_files_expected = [f"labor_case_{i:03d}.yml" for i in range(1, 31)]
case_files_found = set(os.listdir(CASES_DIR))
case_missing = []
case_present = []
for f in case_files_expected:
    if f in case_files_found:
        case_present.append(f)
    else:
        case_missing.append(f)

check(len(case_missing) == 0,
      "B2-文件存在性（30条）",
      f"期望={len(case_files_expected)}, 存在={len(case_present)}, "
      f"缺失={case_missing if case_missing else '无'}")

if case_missing:
    for f in case_missing:
        print(f"  [MISSING] {f}")
else:
    print(f"  [PASS] 全部 {len(case_present)} 个案例卡文件均存在")

print()

# ============================================================
# 2. YAML Parsing Check
# ============================================================
print("=" * 60)
print("2. YAML 解析检查")
print("=" * 60)

parse_errors = []

# Check all rule files
rule_all_files = sorted(
    f for f in os.listdir(RULES_DIR)
    if f.endswith((".yml", ".yaml"))
)

rule_data = {}
case_data = {}

for fname in rule_all_files:
    fpath = os.path.join(RULES_DIR, fname)
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if data is None:
            parse_errors.append((fname, "Empty file (None)"))
        else:
            rule_data[fname] = data
    except yaml.YAMLError as e:
        parse_errors.append((fname, str(e)))
    except Exception as e:
        parse_errors.append((fname, str(e)))

# Check all case files
case_all_files = sorted(
    f for f in os.listdir(CASES_DIR)
    if f.endswith((".yml", ".yaml"))
)

for fname in case_all_files:
    fpath = os.path.join(CASES_DIR, fname)
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if data is None:
            parse_errors.append((fname, "Empty file (None)"))
        else:
            case_data[fname] = data
    except yaml.YAMLError as e:
        parse_errors.append((fname, str(e)))
    except Exception as e:
        parse_errors.append((fname, str(e)))

check(len(parse_errors) == 0,
      "YAML解析",
      f"总文件={len(rule_all_files) + len(case_all_files)}, 解析失败={len(parse_errors)}")

if parse_errors:
    for fname, err in parse_errors:
        print(f"  [PARSE_ERROR] {fname}: {err}")
else:
    print(f"  [PASS] 全部 {(len(rule_all_files) + len(case_all_files))} 个文件YAML解析成功")

print()

# ============================================================
# 3. Required Fields — Rule Cards
# ============================================================
print("=" * 60)
print("3. 必填字段检查 — 规则卡 (labor_rule_*.yml)")
print("=" * 60)

RULE_REQUIRED_FIELDS = ["rule_id", "title", "domain", "conditions",
                        "legal_effect", "law_reference"]
RULE_LAWREF_SUBFIELDS = ["law", "articles"]

rule_field_errors = []
rule_field_ok_count = 0

# Only check labor_rule_*.yml files in the B1 range
rule_b1_files = [f for f in rule_files_expected if f in rule_data]

for fname in rule_b1_files:
    data = rule_data[fname]
    file_errors = []

    # Check top-level fields
    for field in RULE_REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            file_errors.append(f"缺少必填字段 '{field}'")
        elif isinstance(data[field], (list, dict)) and len(data[field]) == 0:
            file_errors.append(f"必填字段 '{field}' 为空")

    # Check law_reference subfields (only if law_reference exists)
    if "law_reference" in data and data["law_reference"] is not None:
        lr = data["law_reference"]
        for sub in RULE_LAWREF_SUBFIELDS:
            if sub not in lr or lr[sub] is None:
                file_errors.append(f"law_reference 缺少子字段 '{sub}'")
            elif isinstance(lr[sub], (list, dict)) and len(lr[sub]) == 0:
                file_errors.append(f"law_reference.{sub} 为空")

    if file_errors:
        rule_field_errors.append((fname, file_errors))
    else:
        rule_field_ok_count += 1

check(rule_field_ok_count == len(rule_b1_files),
      "B1-规则卡必填字段",
      f"检查={len(rule_b1_files)}, 通过={rule_field_ok_count}, 失败={len(rule_field_errors)}")

if rule_field_errors:
    for fname, errs in field_errors:
        print(f"  [FIELD_ERROR] {fname}:")
        for e in errs:
            print(f"    - {e}")
else:
    print(f"  [PASS] 全部 {rule_field_ok_count} 个规则卡必填字段完整")

print()

# ============================================================
# 4. Required Fields — Case Cards
# ============================================================
print("=" * 60)
print("4. 必填字段检查 — 案例卡 (labor_case_*.yml)")
print("=" * 60)

CASE_REQUIRED_FIELDS = ["case_id", "title", "domain", "related_categories",
                        "summary", "facts", "judgment", "legal_principles"]

case_field_errors = []
case_field_ok_count = 0

# Only check labor_case_*.yml files in the B2 range
case_b2_files = [f for f in case_files_expected if f in case_data]

for fname in case_b2_files:
    data = case_data[fname]
    file_errors = []

    for field in CASE_REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            file_errors.append(f"缺少必填字段 '{field}'")
        elif isinstance(data[field], (list, dict)) and len(data[field]) == 0:
            file_errors.append(f"必填字段 '{field}' 为空")

    if file_errors:
        case_field_errors.append((fname, file_errors))
    else:
        case_field_ok_count += 1

check(case_field_ok_count == len(case_b2_files),
      "B2-案例卡必填字段",
      f"检查={len(case_b2_files)}, 通过={case_field_ok_count}, 失败={len(case_field_errors)}")

if case_field_errors:
    for fname, errs in case_field_errors:
        print(f"  [FIELD_ERROR] {fname}:")
        for e in errs:
            print(f"    - {e}")
else:
    print(f"  [PASS] 全部 {case_field_ok_count} 个案例卡必填字段完整")

print()

# ============================================================
# 5. Category Coverage Statistics — by level1
# ============================================================
print("=" * 60)
print("5. 分类覆盖统计 (按 level1 一级分类)")
print("=" * 60)

# Collect level1 coverage for rules
rule_level1_coverage = defaultdict(set)  # level1 -> set of filenames
rule_unknown_cats = []

for fname in rule_b1_files:
    data = rule_data[fname]
    cats = data.get("related_categories", data.get("topic"))
    if isinstance(cats, str):
        cats = [cats]
    if isinstance(cats, list):
        level1s, unknown = resolve_level1(cats, CAT_TO_LEVEL1)
        for l1 in level1s:
            rule_level1_coverage[l1].add(fname)
        if unknown:
            rule_unknown_cats.append((fname, unknown))
    elif cats is None:
        rule_unknown_cats.append((fname, ["no related_categories field"]))

# Collect level1 coverage for cases
case_level1_coverage = defaultdict(set)  # level1 -> set of filenames
case_unknown_cats = []

for fname in case_b2_files:
    data = case_data[fname]
    cats = data.get("related_categories", [])
    if isinstance(cats, str):
        cats = [cats]
    if isinstance(cats, list):
        level1s, unknown = resolve_level1(cats, CAT_TO_LEVEL1)
        for l1 in level1s:
            case_level1_coverage[l1].add(fname)
        if unknown:
            case_unknown_cats.append((fname, unknown))
    elif cats is None:
        case_unknown_cats.append((fname, ["no related_categories field"]))

# Print coverage table
print(f"{'一级分类':<20} {'规则卡覆盖':>10} {'案例卡覆盖':>10} {'总覆盖':>8}")
print("-" * 50)
total_rules = len(rule_b1_files)
total_cases = len(case_b2_files)

for l1 in LEVEL1_CATEGORIES:
    r_count = len(rule_level1_coverage.get(l1, set()))
    c_count = len(case_level1_coverage.get(l1, set()))
    r_pct = r_count / total_rules * 100 if total_rules else 0
    c_pct = c_count / total_cases * 100 if total_cases else 0
    print(f"{l1:<20} {r_count:>4}({r_pct:>5.1f}%) {c_count:>4}({c_pct:>5.1f}%) "
          f"{'':>2}")

# Check for unknown categories
if rule_unknown_cats or case_unknown_cats:
    print()
    print("  [WARN] 以下文件中的 related_categories 未在知识图谱中找到对应 level1:")
    for fname, uk in rule_unknown_cats:
        print(f"    规则卡 {fname}: unknown categories = {uk}")
    for fname, uk in case_unknown_cats:
        print(f"    案例卡 {fname}: unknown categories = {uk}")

print()

# ============================================================
# 5b. Rule topic distribution (alternative breakdown)
# ============================================================
print("--- 规则卡 topic 分布 ---")
topic_counter = Counter()
for fname in rule_b1_files:
    data = rule_data[fname]
    topic = data.get("topic", "N/A")
    topic_counter[topic] += 1

for topic, count in topic_counter.most_common():
    print(f"  {topic:<40} {count:>3} 条")

print()

# ============================================================
# 6. Total Asset Statistics
# ============================================================
print("=" * 60)
print("6. 总资产统计")
print("=" * 60)

# Count all rule files (rule_*.yaml + labor_rule_*.yml)
all_rule_files = sorted(
    f for f in os.listdir(RULES_DIR)
    if f.endswith((".yml", ".yaml"))
)
total_rules_all = len(all_rule_files)
old_rule_count = len([f for f in all_rule_files if f.startswith("rule_")])
new_rule_count = len([f for f in all_rule_files if f.startswith("labor_rule_")])

# Count all case files
all_case_files = sorted(
    f for f in os.listdir(CASES_DIR)
    if f.endswith((".yml", ".yaml"))
)
total_cases_all = len(all_case_files)

# Total files
total_files = total_rules_all + total_cases_all

print(f"  规则卡文件总数:        {total_rules_all}")
print(f"    ├─ 旧版 rule_*.yaml: {old_rule_count} 条")
print(f"    └─ 新版 labor_rule_*.yml: {new_rule_count} 条 (其中 B1 新增: {len(rule_b1_files)})")
print(f"  案例卡文件总数:        {total_cases_all}")
print(f"    └─ B2 新增 labor_case_*.yml: {len(case_b2_files)} 条")
print(f"  总知识库文件数:        {total_files}")

check(total_rules_all >= 40 + 20,
      "资产-规则卡总量",
      f"总计={total_rules_all}（旧版{old_rule_count}+新版{new_rule_count}）")
check(total_cases_all >= 30,
      "资产-案例卡总量",
      f"总计={total_cases_all}")
check(total_files >= 40 + 20 + 30,
      "资产-文件总量",
      f"总计={total_files}")

print()

# ============================================================
# Summary Report
# ============================================================
print("=" * 60)
print("QA 验证报告摘要")
print("=" * 60)

passed = sum(1 for _, s, _ in results if s == PASS)
failed = sum(1 for _, s, _ in results if s == FAIL)
total = len(results)

print(f"  总检查项: {total}")
print(f"  通过:     {passed}")
print(f"  失败:     {failed}")
print()

if failed == 0:
    print("  >>> 全部检查通过！知识库 B1+B2 验证通过。")
else:
    print("  >>> 以下检查项未通过:")
    for name, status, detail in results:
        if status == FAIL:
            print(f"    [{FAIL}] {name}")
            if detail:
                print(f"            {detail}")
    print()
    print("  请修复上述问题后重新运行验证。")

print()
print(f"  (脚本: scripts/qa_validate_knowledge.py)")
