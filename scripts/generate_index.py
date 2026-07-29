#!/usr/bin/env python3
"""
生成完整的劳动法知识库索引 INDEX.md
涵盖：规则卡(80)、案例卡(30)、证据卡(11)、程序卡(7)、法律JSON(9)、证据链
"""

import yaml
import json
import glob
import os
from collections import defaultdict
from datetime import date


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # 加载知识图谱
    with open("data/knowledge/knowledge_graph.json", encoding="utf-8") as f:
        kg = json.load(f)
    cat_map = {c["categoryId"]: c["displayName"] for c in kg["categories"]}

    # 收集数据
    rules_old = _load_rules_old()
    rules_new = _load_rules_new()
    cases = _load_cases(cat_map)
    evidence = _load_evidence()
    procedures = _load_procedures()
    laws = _load_laws()
    evidence_chain = _load_evidence_chain(cat_map)

    # 按一级分类统计
    level1_stats = _calc_level1_stats(kg, rules_old + rules_new)

    # 生成 INDEX.md
    lines = []

    # 标题
    lines.append("# 劳动法知识库索引")
    lines.append("")
    lines.append(f"> 生成日期：{date.today().isoformat()}")
    lines.append(f"> 法律领域：labor（劳动法）")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 总览统计
    total_cards = len(rules_old) + len(rules_new) + len(cases) + len(evidence) + len(procedures)
    total_articles = sum(l["articles"] for l in laws)
    lines.append("## 总览")
    lines.append("")
    lines.append(f"| 资产类型 | 数量 | 说明 |")
    lines.append(f"|---------|:----:|------|")
    lines.append(f"| 规则卡 | **{len(rules_old)+len(rules_new)}** | 旧{len(rules_old)}条 + 新{len(rules_new)}条，覆盖11个一级分类 |")
    lines.append(f"| 案例卡 | **{len(cases)}** | 覆盖全部11个一级分类 |")
    lines.append(f"| 证据卡 | **{len(evidence)}** | 各类证据类型 |")
    lines.append(f"| 程序卡 | **{len(procedures)}** | 劳动争议维权全流程 |")
    lines.append(f"| 法律原文 | **{len(laws)}** | {total_articles}条法律条文，JSON结构化 |")
    lines.append(f"| 证据链 | **{len(evidence_chain)}** | 推理逻辑规则 |")
    lines.append(f"| **知识卡片总计** | **{total_cards}** | 可检索知识卡片 |")
    lines.append("")

    # 一级分类覆盖
    lines.append("### 一级分类覆盖")
    lines.append("")
    lines.append("| 一级分类 | 规则卡 | 案例卡 | 二级分类 |")
    lines.append("|---------|:-----:|:-----:|---------|")
    for l1 in ["劳动合同", "工资报酬", "劳动关系认定", "社保福利", "辞退裁员",
               "工伤赔偿", "休息休假", "竞业限制", "女职工保护", "集体争议", "程序时效"]:
        stats = level1_stats.get(l1, {"rules": 0, "cases": 0, "subs": []})
        sub_names = "、".join(stats.get("subs", []))
        lines.append(f"| {l1} | {stats['rules']} | {stats['cases']} | {sub_names} |")
    lines.append("")

    lines.append("---")
    lines.append("")

    # 一、规则卡
    lines.append("## 一、规则卡（80条）")
    lines.append("")

    lines.append("### 1.1 工资报酬（旧格式 20条）")
    lines.append("")
    lines.append("| # | 文件 | 标题 | 来源法规 | 条款 |")
    lines.append("|---|------|------|----------|------|")
    for i, r in enumerate(rules_old, 1):
        articles = ", ".join(r["articles"]) if isinstance(r["articles"], list) else str(r["articles"])
        lines.append(f"| {i} | `{r['file']}` | {r['title']} | {r['law']} | {articles} |")
    lines.append("")

    # 新规则卡按 topic 分组
    lines.append("### 1.2 全分类规则卡（新格式 60条）")
    lines.append("")

    topic_groups = defaultdict(list)
    for r in rules_new:
        topic_groups[r["topic"]].append(r)

    for topic in sorted(topic_groups.keys()):
        cat_display = cat_map.get(topic, topic)
        group = topic_groups[topic]
        lines.append(f"#### {cat_display}（{len(group)}条）")
        lines.append("")
        lines.append("| # | 文件 | 标题 | 来源法规 | 条款 |")
        lines.append("|---|------|------|----------|------|")
        for i, r in enumerate(group, 1):
            articles = ", ".join(r["articles"]) if isinstance(r["articles"], list) else ""
            lines.append(f"| {r['num']} | `{r['file']}` | {r['title']} | {r['law']} | {articles} |")
        lines.append("")

    # 二、案例卡
    lines.append("---")
    lines.append("")
    lines.append("## 二、案例卡（30个）")
    lines.append("")
    lines.append("| # | 文件 | 标题 | 涉及分类 |")
    lines.append("|---|------|------|---------|")
    for i, c in enumerate(cases, 1):
        lines.append(f"| {i} | `{c['file']}` | {c['title'][:60]} | {c['categories']} |")
    lines.append("")

    # 三、证据卡
    lines.append("---")
    lines.append("")
    lines.append("## 三、证据卡（11张）")
    lines.append("")
    lines.append("| # | 文件 | 名称 | 证据类型 |")
    lines.append("|---|------|------|----------|")
    for i, e in enumerate(evidence, 1):
        lines.append(f"| {i} | `{e['file']}` | {e['name']} | {e['type']} |")
    lines.append("")

    # 四、程序卡
    lines.append("---")
    lines.append("")
    lines.append("## 四、程序卡（7张）")
    lines.append("")
    lines.append("| # | 文件 | 名称 |")
    lines.append("|---|------|------|")
    for i, p in enumerate(procedures, 1):
        lines.append(f"| {i} | `{p['file']}` | {p['name']} |")
    lines.append("")

    # 五、法律原文
    lines.append("---")
    lines.append("")
    lines.append("## 五、法律原文结构化（9部）")
    lines.append("")
    lines.append("| # | 文件 | 法律名称 | 章数 | 条文数 |")
    lines.append("|---|------|---------|:---:|:-----:|")
    for i, l in enumerate(laws, 1):
        lines.append(f"| {i} | `{l['file']}` | {l['title']} | {l['chapters']} | {l['articles']} |")
    lines.append("")

    # 六、证据链
    lines.append("---")
    lines.append("")
    lines.append("## 六、证据链推理规则（11条）")
    lines.append("")
    lines.append("| # | 分类 | 证据数 | 逻辑规则 |")
    lines.append("|---|------|:------:|:--------:|")
    for i, ec in enumerate(evidence_chain, 1):
        lines.append(f"| {i} | {ec['name']} | {ec['evidence_count']} | {ec['rule_count']} |")
    lines.append("")

    # 七、数据来源
    lines.append("---")
    lines.append("")
    lines.append("## 七、数据来源")
    lines.append("")
    lines.append("| source_id | 法规名称 | 爬取来源 |")
    lines.append("|-----------|---------|---------|")
    sources = [
        ("labor_law_2018", "中华人民共和国劳动法（2018年修正）", "已爬取 gov.cn"),
        ("labor_contract_law_2012", "中华人民共和国劳动合同法（2012年修正）", "已爬取 gov.cn"),
        ("labor_dispute_mediation_law_2007", "中华人民共和国劳动争议调解仲裁法", "已爬取 gov.cn"),
        ("social_insurance_law_2018", "中华人民共和国社会保险法（2018年修正）", "已爬取 gov.cn"),
        ("work_injury_regulation_2010", "工伤保险条例（2010年修订）", "已爬取 gov.cn"),
        ("labor_contract_implementation_2008", "中华人民共和国劳动合同法实施条例", "已爬取 gov.cn"),
        ("female_protection_regulation_2012", "女职工劳动保护特别规定", "已爬取 gov.cn"),
        ("annual_leave_regulation_2007", "职工带薪年休假条例", "已爬取 gov.cn"),
        ("annual_leave_implementation_2008", "企业职工带薪年休假实施办法", "已爬取 gov.cn"),
        ("labor_supervision_regulation_2004", "劳动保障监察条例", "待补充"),
        ("minimum_wage_regulation_2004", "最低工资规定", "待补充"),
        ("labor_dispute_interpretation_1", "最高人民法院关于审理劳动争议案件适用法律问题的解释（一）", "待补充"),
        ("wage_arrears_criminal_interpretation_2013", "拒不支付劳动报酬司法解释", "待补充"),
    ]
    for sid, name, source in sources:
        lines.append(f"| {sid} | {name} | {source} |")
    lines.append("")

    # 写入文件
    output_path = "data/knowledge/labor/INDEX.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"✅ 已生成 {output_path}")
    print(f"   行数: {len(lines)}")
    print(f"   规则卡: {len(rules_old)+len(rules_new)}")
    print(f"   案例卡: {len(cases)}")
    print(f"   证据卡: {len(evidence)}")
    print(f"   程序卡: {len(procedures)}")
    print(f"   法律: {len(laws)}")
    print(f"   证据链: {len(evidence_chain)}")


def _load_rules_old():
    rules = []
    for f in sorted(glob.glob("data/knowledge/labor/rules/rule_*.yaml")):
        with open(f, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        rules.append({
            "file": os.path.basename(f),
            "title": data.get("title", ""),
            "law": data.get("法规来源", data.get("source_law", "")),
            "articles": data.get("条款", data.get("articles", [])),
        })
    return rules


def _load_rules_new():
    rules = []
    for f in sorted(glob.glob("data/knowledge/labor/rules/labor_rule_*.yml")):
        with open(f, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        # Extract number from filename
        num = os.path.basename(f).replace("labor_rule_", "").replace(".yml", "")
        law_ref = data.get("law_reference", {})
        rules.append({
            "file": os.path.basename(f),
            "num": num,
            "title": data.get("title", ""),
            "topic": data.get("topic", ""),
            "law": law_ref.get("law", ""),
            "articles": law_ref.get("articles", []),
        })
    return rules


def _load_cases(cat_map):
    cases = []
    for f in sorted(glob.glob("data/knowledge/labor/cases/*.yml")):
        with open(f, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        cats = data.get("related_categories", [])
        cat_names = [cat_map.get(c, c) for c in cats]
        cases.append({
            "file": os.path.basename(f),
            "title": data.get("title", ""),
            "categories": ", ".join(cat_names),
        })
    return cases


def _load_evidence():
    ev = []
    for f in sorted(glob.glob("data/knowledge/labor/evidence/*.yaml")):
        with open(f, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        ev.append({
            "file": os.path.basename(f),
            "name": data.get("name", ""),
            "type": data.get("type", data.get("evidence_type", "")),
        })
    return ev


def _load_procedures():
    procs = []
    for f in sorted(glob.glob("data/knowledge/labor/procedures/*.yaml")):
        with open(f, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        procs.append({
            "file": os.path.basename(f),
            "name": data.get("name", ""),
        })
    return procs


def _load_laws():
    laws = []
    for f in sorted(glob.glob("data/knowledge/labor/laws/*.json")):
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
        total_arts = sum(len(ch.get("articles", [])) for ch in data["chapters"])
        laws.append({
            "file": os.path.basename(f),
            "title": data.get("title", ""),
            "chapters": len(data["chapters"]),
            "articles": total_arts,
        })
    return laws


def _load_evidence_chain(cat_map):
    chains = []
    with open("data/knowledge/labor/evidence-chain.json", encoding="utf-8") as f:
        data = json.load(f)
    for ch in data.get("chains", []):
        chains.append({
            "name": cat_map.get(ch.get("categoryId", ""), ch.get("categoryName", "")),
            "evidence_count": len(ch.get("requiredEvidence", [])),
            "rule_count": len(ch.get("logicRules", [])),
        })
    return chains


def _calc_level1_stats(kg, rules):
    stats = {}
    for c in kg["categories"]:
        l1 = c["level1"]
        if l1 not in stats:
            stats[l1] = {"rules": 0, "cases": 0, "subs": []}
        stats[l1]["subs"].append(c["level2"])

    for r in rules:
        topic = r.get("topic", "")
        for c in kg["categories"]:
            if c["categoryId"] == topic:
                stats[c["level1"]]["rules"] += 1
                break

    # 案例卡统计
    for f in glob.glob("data/knowledge/labor/cases/*.yml"):
        with open(f, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        for cat_id in data.get("related_categories", []):
            for c in kg["categories"]:
                if c["categoryId"] == cat_id:
                    stats[c["level1"]]["cases"] += 1
                    break

    return stats


if __name__ == "__main__":
    main()
