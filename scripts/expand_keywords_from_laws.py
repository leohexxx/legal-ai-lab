#!/usr/bin/env python3
"""
基于爬取的法律原文，扩充知识图谱的关键词和相关问题
目标：从 558 关键词 → 2000+ 关键词
"""

import json
import re
import glob
from collections import defaultdict

# 加载知识图谱
with open("data/knowledge/knowledge_graph.json", encoding="utf-8") as f:
    kg = json.load(f)

categories = kg["categories"]
print(f"当前分类: {len(categories)}")
total_keywords = sum(len(c["keywords"]) for c in categories)
print(f"当前关键词: {total_keywords}")

# 加载所有法律 JSON
laws = {}
for fpath in glob.glob("data/knowledge/labor/laws/*.json"):
    with open(fpath, encoding="utf-8") as f:
        data = json.load(f)
    laws[data.get("title", "")] = data

print(f"已加载法律: {len(laws)} 部")

# 法律全文索引
law_texts = {}
for title, data in laws.items():
    text = ""
    for ch in data.get("chapters", []):
        for art in ch.get("articles", []):
            text += art.get("content", "") + "\n"
    law_texts[title] = text

# 为每个分类提取新关键词
CATEGORY_TERMS = {
    "contract_conclusion": ["未签合同", "双倍工资", "书面合同", "合同订立", "劳动合同期限", "固定期限", "无固定期限", "以完成一定工作为期限", "合同生效"],
    "contract_renewal": ["合同到期", "续签", "合同期满", "续订", "维持原条件", "提高条件", "期满终止"],
    "contract_termination_by_employer": ["单位解除", "过失性解除", "非过失性解除", "经济性裁员", "通知解除", "立即解除"],
    "contract_expiration": ["合同终止", "期满终止", "终止条件", "终止情形", "顺延"],
    "contract_change": ["合同变更", "岗位调整", "工作地点变更", "变更协议", "调岗"],
    "probation_dispute": ["试用期", "试用期工资", "试用期解除", "试用期长度", "录用条件", "不符合录用条件"],
    "salary_arrears": ["欠薪", "拖欠工资", "克扣工资", "未足额支付", "工资支付", "工资拖欠"],
    "overtime_pay": ["加班费", "加班工资", "延时加班", "休息日加班", "法定假日加班", "加班时长", "加班审批"],
    "minimum_wage": ["最低工资", "最低工资标准", "最低工资调整", "最低工资扣除", "最低工资保障"],
    "bonus_commission": ["奖金", "提成", "年终奖", "绩效工资", "业务提成", "绩效奖金"],
    "de_facto_relation": ["事实劳动关系", "用工关系", "从属性", "经济从属性", "人身从属性", "事实雇佣"],
    "dual_relation": ["双重劳动关系", "多重劳动关系", "兼职", "第二职业", "双重用工"],
    "dispatch": ["劳务派遣", "派遣单位", "用工单位", "同工同酬", "派遣岗位", "三性", "临时性", "辅助性", "替代性"],
    "part_time": ["非全日制", "小时工", "兼职", "非全日制用工", "小时工资", "每日工作时间"],
    "labor_outstaffing": ["劳务外包", "业务外包", "外包", "承揽", "外包协议"],
    "social_insurance_payment": ["社保缴纳", "社会保险费", "社保基数", "未缴社保", "社保登记", "社保账户"],
    "housing_fund": ["公积金", "住房公积金", "住房公积金缴存", "公积金提取", "公积金贷款"],
    "medical_insurance": ["医疗保险", "医保", "基本医疗保险", "医疗期", "病假工资", "医疗补助"],
    "pension": ["养老保险", "基本养老保险", "养老金", "退休", "退休金", "退休年龄", "缴费年限", "个人账户", "统筹基金"],
    "illegal_termination": ["违法解除", "违法辞退", "2N", "赔偿金", "违法终止", "双倍赔偿"],
    "severance_pay": ["经济补偿", "N+1", "经济补偿金", "补偿年限", "月工资标准", "工作年限"],
    "layoff_procedure": ["裁员", "经济性裁员", "集体裁员", "裁员程序", "工会", "裁员报告", "优先留用"],
    "resignation_certificate": ["离职证明", "解除证明", "离职手续", "工作交接", "档案转移"],
    "injury_identification": ["工伤认定", "工伤", "工伤鉴定", "工伤申请", "工伤认定时效", "上下班途中", "职业病"],
    "disability_grade": ["伤残等级", "劳动能力鉴定", "伤残", "伤残津贴", "劳动功能障碍", "生活自理障碍"],
    "lump_sum_compensation": ["一次性赔偿", "一次性伤残补助", "一次性医疗补助", "一次性就业补助", "伤残就业补助"],
    "death_compensation": ["工亡", "工亡赔偿", "丧葬补助", "供养亲属", "抚恤金", "死亡赔偿"],
    "annual_leave": ["年休假", "带薪年休假", "年假", "未休年假", "年休假天数", "未休年假300%"],
    "sick_personal_leave": ["病假", "事假", "医疗期", "病假工资", "疾病救济费", "医疗期待遇"],
    "marriage_funeral_leave": ["婚假", "丧假", "婚丧假", "结婚", "直系亲属"],
    "maternity_paternity_leave": ["产假", "陪产假", "护理假", "生育", "产检假", "产前假", "哺乳假", "生育津贴"],
    "non_compete_agreement": ["竞业限制", "竞业禁止", "竞业限制协议", "竞业范围", "竞业期限", "竞业限制义务"],
    "non_compete_compensation": ["竞业补偿", "竞业限制补偿金", "竞业补偿标准", "竞业违约金"],
    "pregnancy_protection": ["孕期保护", "孕期", "降薪", "孕期禁忌", "怀孕", "调岗", "减轻劳动"],
    "maternity_benefits": ["生育津贴", "产假待遇", "生育保险", "生育医疗费", "生育基金"],
    "nursing_period": ["哺乳期", "哺乳假", "哺乳时间", "哺乳室", "哺乳期调岗"],
    "collective_bargaining": ["集体合同", "集体协商", "集体谈判", "工会协商", "工资集体协商"],
    "mass_arrears": ["群体性欠薪", "集体欠薪", "欠薪群体", "欠薪上访", "农民工欠薪"],
    "strike_work_stoppage": ["停工", "怠工", "停工怠工", "罢工", "集体停工"],
    "arbitration_period": ["仲裁时效", "仲裁时效起算", "仲裁时效中断", "仲裁时效中止", "一年时效"],
    "litigation_period": ["诉讼时效", "起诉期限", "法院起诉", "诉讼时效起算"],
    "evidence_preservation": ["证据保全", "举证责任", "举证", "证据保全申请", "证据固定", "举证责任倒置"],
}

# 不再使用统一通用术语列表，改为从法律文本逐分类提取

# 更丰富的相关问题
CATEGORY_QUESTIONS = {
    "contract_conclusion": [
        "公司不跟我签劳动合同怎么办？",
        "没签劳动合同怎么证明劳动关系？",
        "未签劳动合同双倍工资怎么计算？",
        "签了劳动合同但没给我一份怎么办？",
    ],
    "contract_renewal": [
        "合同到期公司不续签有赔偿吗？",
        "合同到期我不续签需要提前通知吗？",
        "连续签了两次固定期限合同，第三次能要求签无固定期限吗？",
    ],
    "salary_arrears": [
        "公司拖欠工资怎么办？",
        "欠薪多久可以起诉？",
        "欠薪的仲裁时效是多久？",
        "公司欠薪我可以直接离职吗？",
    ],
    "overtime_pay": [
        "加班费怎么计算？",
        "周末加班是双倍工资吗？",
        "法定节假日加班是三倍工资吗？",
        "公司不支付加班费怎么办？",
    ],
    "illegal_termination": [
        "被公司违法辞退怎么赔偿？",
        "什么情况属于违法解除劳动合同？",
        "2N赔偿金怎么计算？",
        "违法解除和合法解除的区别是什么？",
    ],
    "pregnancy_protection": [
        "怀孕期间被辞退怎么办？",
        "孕期公司降薪合法吗？",
        "怀孕了公司可以调岗吗？",
        "产检假算工作时间吗？",
    ],
    "severance_pay": [
        "离职经济补偿金怎么算？",
        "N+1补偿是什么意思？",
        "什么情况下离职有经济补偿？",
        "工作年限不足一年怎么算补偿？",
    ],
    "arbitration_period": [
        "劳动仲裁时效是多久？",
        "仲裁时效从什么时候开始计算？",
        "过了仲裁时效还能维权吗？",
        "仲裁时效中断的情形有哪些？",
    ],
}

# 执行扩充
new_keywords_count = 0
new_questions_count = 0
for cat in categories:
    cid = cat["categoryId"]
    existing_kw = set(cat["keywords"])
    
    # 1. 添加分类特定术语
    if cid in CATEGORY_TERMS:
        for term in CATEGORY_TERMS[cid]:
            if term not in existing_kw:
                cat["keywords"].append(term)
                existing_kw.add(term)
                new_keywords_count += 1
    
    # 2. 从法律文本中搜索相关短语
    if cid in CATEGORY_TERMS:
        seed_terms = CATEGORY_TERMS[cid][:3]
        for law_title, law_text in law_texts.items():
            for seed in seed_terms:
                if seed in law_text:
                    # 提取包含种子词的句子
                    sentences = re.findall(rf'[^。]*{re.escape(seed)}[^。]*。', law_text)
                    for sent in sentences[:2]:
                        # 提取有意义的词组长（2-6字）
                        words = re.findall(r'[\u4e00-\u9fff]{2,6}', sent)
                        for w in words:
                            if w not in existing_kw and len(w) >= 2 and len(w) <= 8:
                                # 过滤无意义词
                                if any(kw in w for kw in ['劳动','合同','工资','保险','工伤','补偿','赔偿','解除',
                                    '终止','仲裁','诉讼','休假','派遣','聘用','录用','报酬','津贴','补贴',
                                    '补助','奖金','养老','医疗','失业','生育','福利','保护','义务','权利',
                                    '责任','协议','约定','争议','监察','处罚','违法']) or len(w) >= 4:
                                    if w not in ["中华人民共和国", "直接负责", "应当依照", "按照国家", "根据本法", 
                                                  "依法给予", "依照本法", "有关工作"]:
                                        cat["keywords"].append(w)
                                        existing_kw.add(w)
                                        new_keywords_count += 1
    
    # 3. 添加相关问题
    if cid in CATEGORY_QUESTIONS:
        existing_questions = set(cat.get("relatedQuestions", []))
        for q in CATEGORY_QUESTIONS[cid]:
            if q not in existing_questions:
                if "relatedQuestions" not in cat:
                    cat["relatedQuestions"] = []
                cat["relatedQuestions"].append(q)
                existing_questions.add(q)
                new_questions_count += 1

# 保存结果

# 统计结果
final_keywords = sum(len(c["keywords"]) for c in categories)
final_questions = sum(len(c.get("relatedQuestions", [])) for c in categories)

print(f"\n📊 扩充结果:")
print(f"   总分类: {len(categories)}")
print(f"   原关键词: {total_keywords}")
print(f"   新增关键词: {new_keywords_count}")
print(f"   最终关键词: {final_keywords}")
print(f"   新增问题: {new_questions_count}")
print(f"   最终问题: {final_questions}")

# 去重
for cat in categories:
    seen = set()
    deduped = []
    for kw in cat["keywords"]:
        if kw not in seen:
            seen.add(kw)
            deduped.append(kw)
    cat["keywords"] = deduped

deduped_keywords = sum(len(c["keywords"]) for c in categories)
print(f"   去重后关键词: {deduped_keywords}")

# 保存
with open("data/knowledge/knowledge_graph.json", "w", encoding="utf-8") as f:
    json.dump(kg, f, ensure_ascii=False, indent=2)

print(f"✅ 已保存到 knowledge_graph.json")
