"""Expand knowledge graph with enhanced keywords, excludeFrom, and new categories."""
import json

with open('data/knowledge/knowledge_graph.json', 'r', encoding='utf-8') as f:
    kg = json.load(f)

# ── 1. KEYWORD EXPANSION ──
expanded_keywords = {
    "contract_conclusion": ["双倍工资", "未签劳动合同", "不签", "拒签合同", "合同不签", "没有劳动合同", "签合同", "劳动合同不签", "入职不签合同", "试用期不签合同", "口头约定", "没有书面合同"],
    "contract_renewal": ["合同到期", "不续约", "续签合同", "续约", "合同期满", "合同到期公司不续", "签了两次合同", "连续签两次", "无固定期限", "固定期限合同到期", "第三次合同"],
    "contract_termination_by_employer": ["被解雇", "解雇", "公司辞退", "协商解除", "被迫离职", "公司让我走", "劝退", "变相辞退", "逼我辞职", "调岗逼走", "冷暴力辞退"],
    "contract_expiration": ["合同自然终止", "合同到期不续", "到期终止", "合同终止", "合同到期走人", "期满终止", "合同到期补偿"],
    "contract_change": ["调岗降薪", "调换岗位", "工作调动", "降职", "降薪", "变更工作内容", "换部门", "异地调动", "公司搬家", "搬迁"],
    "salary_arrears": ["不发工资", "几个月没发工资", "工资拖欠", "欠工资", "拖欠薪水", "不发薪水", "押工资", "工资不发", "拖工资", "老板跑路", "公司倒闭欠薪"],
    "overtime": ["经常加班", "天天加班", "强制加班", "无偿加班", "加班没有加班费", "加班不给钱", "大小周", "996", "周末加班", "晚上加班", "节假日加班", "调休"],
    "minimum_wage": ["工资低于最低", "底薪太低", "基本工资低于", "试用期工资低", "试用期没有最低工资", "低于最低工资标准", "工资标准低"],
    "bonus_commission": ["不发提成", "扣提成", "扣年终奖", "不发年终奖", "绩效扣款", "奖金不发", "年底双薪不发", "13薪", "项目提成", "业绩提成"],
    "de_facto_relation": ["事实用工", "实际上班", "没有合同但上班", "无合同工作", "事实雇佣", "实际工作关系", "没有签劳动合同但一直在工作"],
    "dual_relation": ["两份工作", "同时上班", "多个工作", "兼职两份工", "同时在两家公司", "身兼数职", "第二职业", "下班后做兼职"],
    "dispatch": ["派遣工", "派遣员工", "外派员工", "劳务工", "派遣公司", "用工单位", "同工不同酬", "派遣转正", "劳务派遣工"],
    "part_time": ["临时工", "钟点工", "小时工", "零工", "兼职工", "非全日制", "每天工作几小时", "一周工作几天"],
    "social_insurance_payment": ["社保", "不交社保", "不买社保", "没有社保", "五险一金", "断缴社保", "社保断交", "补社保", "社保欠费", "公司不买社保", "试用期不交社保", "不给交社保"],
    "housing_fund": ["公积金不交", "没有公积金", "不缴纳公积金", "公积金断缴", "公积金提取", "公积金贷款"],
    "medical_insurance": ["医疗期工资", "病假待遇", "生病工资", "病假期间工资", "病假工资怎么算", "生病被辞退", "医疗补助", "医保断缴"],
    "pension": ["退休金", "养老保险没交够", "养老金不够", "退休待遇", "社保不够15年", "退休年龄", "养老金领取"],
    "illegal_termination": ["无故辞退", "无理由开除", "违法解雇", "非法辞退", "随意开除", "被公司赶走", "被裁员", "孕期被辞", "工伤被辞", "病假被开", "辞退不赔偿"],
    "severance_pay": ["离职补偿", "N+1赔偿", "2N赔偿", "裁员补偿金", "补偿金标准", "经济补偿金怎么算", "离职赔偿", "买断工龄", "协商离职补偿"],
    "layoff_procedure": ["大规模裁员", "公司裁员", "裁员通知", "裁员名单", "结构性裁员", "部门解散", "公司缩减", "裁员流程"],
    "resignation_certificate": ["离职证明不给", "离职证明乱写", "离职证明负面", "离职证明纠纷", "离职证明影响入职", "不开离职证明"],
    "injury_identification": ["受伤", "工伤", "工作时受伤", "上班受伤", "出差受伤", "上下班车祸", "工作中受伤", "职业病", "工伤申报", "公司不报工伤"],
    "disability_grade": ["劳动能力鉴定", "伤残评定", "几级伤残", "伤情鉴定", "鉴定等级", "不认可鉴定", "重新鉴定"],
    "lump_sum_compensation": ["工伤赔偿金", "伤残补助金", "一次性赔偿金", "工伤赔付", "工伤赔偿多少钱", "离职后工伤赔偿"],
    "death_compensation": ["因工死亡", "工作中死亡", "工亡待遇", "死亡赔偿金", "工亡抚恤金", "丧葬费", "供养亲属"],
    "annual_leave": ["带薪年假", "年假未休", "年假折算", "年假补偿", "年假不休", "离职年假", "年假天数"],
    "sick_personal_leave": ["请病假", "请事假", "病假扣钱", "事假扣款", "病假工资", "事假规定", "病假证明", "扣病假工资"],
    "marriage_funeral_leave": ["婚假几天", "丧假几天", "婚假扣工资", "丧假扣工资", "结婚请假", "奔丧请假", "婚假申请", "丧假申请"],
    "maternity_paternity_leave": ["生孩子", "休产假", "产检", "陪产", "育儿假", "产假多久", "产假工资", "生育津贴", "产假待遇"],
    "non_compete_agreement": ["竞业限制协议", "竞业条款", "签了竞业", "竞业范围", "竞业期限", "竞业协议合法吗", "竞业限制范围"],
    "non_compete_compensation": ["竞业补偿金", "竞业补偿没发", "不付竞业补偿", "竞业补偿标准", "竞业限制补偿多少钱", "离职竞业补偿"],
    "pregnancy_protection": ["怀孕被辞", "孕妇被辞退", "怀孕调岗", "孕妇权益", "怀孕期间工作", "产检假", "孕期上班"],
    "maternity_benefits": ["生育险", "生育报销", "生孩子报销", "生育医疗费", "生育津贴领取", "产假工资谁发", "生育保险"],
    "nursing_period": ["哺乳假", "喂奶时间", "哺乳期妈妈", "背奶", "哺乳期工作安排", "哺乳期被辞退", "哺乳期权益保护"],
    "collective_bargaining": ["工会", "职工代表", "集体合同", "集体协商", "工会维权", "工会协商", "职工代表大会"],
    "mass_arrears": ["集体欠薪", "全公司欠薪", "很多人欠薪", "群体讨薪", "集体讨薪", "公司欠全体员工", "集体投诉"],
    "strike_work_stoppage": ["停工抗议", "罢工", "集体罢工", "停工维权", "怠工", "集体停工", "罢工合法吗"],
    "arbitration_period": ["仲裁时效", "劳动仲裁", "申请仲裁", "仲裁期限", "仲裁过期", "一年时效", "仲裁时间", "提起仲裁"],
    "litigation_period": ["起诉", "法院起诉", "不服仲裁", "起诉期限", "民事诉讼", "劳动诉讼", "收到裁决书", "上诉"],
    "evidence_preservation": ["证据", "什么证据", "聊天记录", "录音", "微信记录", "工资条", "考勤记录", "打卡记录", "劳动合同", "工牌", "工作群记录", "加班证据"]
}

for cat in kg['categories']:
    cid = cat['categoryId']
    if cid in expanded_keywords:
        existing = set(cat.get('keywords', []))
        new_kw = [kw for kw in expanded_keywords[cid] if kw not in existing]
        cat['keywords'] = cat.get('keywords', []) + new_kw

# ── 2. EXPAND excludeFrom ──
mutual_exclusion = {
    "contract_conclusion": ["salary_arrears", "illegal_termination", "overtime", "social_insurance_payment"],
    "contract_renewal": ["salary_arrears", "illegal_termination", "contract_conclusion", "overtime"],
    "contract_expiration": ["illegal_termination", "salary_arrears"],
    "contract_termination_by_employer": ["salary_arrears", "contract_renewal", "contract_expiration"],
    "contract_change": ["salary_arrears", "contract_conclusion"],
    "salary_arrears": ["contract_renewal", "illegal_termination", "annual_leave", "overtime", "bonus_commission"],
    "overtime": ["salary_arrears", "contract_renewal", "contract_conclusion"],
    "bonus_commission": ["salary_arrears", "contract_renewal"],
    "illegal_termination": ["salary_arrears", "contract_renewal", "annual_leave", "overtime"],
    "severance_pay": ["salary_arrears", "illegal_termination", "annual_leave"],
    "layoff_procedure": ["salary_arrears", "illegal_termination"],
    "social_insurance_payment": ["salary_arrears", "contract_renewal", "pension"],
    "pension": ["salary_arrears", "social_insurance_payment"],
    "annual_leave": ["salary_arrears", "illegal_termination"],
    "pregnancy_protection": ["illegal_termination", "salary_arrears", "overtime"],
    "nursing_period": ["illegal_termination", "salary_arrears"],
    "injury_identification": ["salary_arrears", "illegal_termination"],
    "arbitration_period": ["salary_arrears", "illegal_termination", "contract_renewal"],
    "litigation_period": ["salary_arrears", "illegal_termination"],
}

for cat in kg['categories']:
    cid = cat['categoryId']
    if cid in mutual_exclusion:
        existing = set(cat.get('excludeFrom', []))
        new_ex = [ex for ex in mutual_exclusion[cid] if ex not in existing]
        cat['excludeFrom'] = cat.get('excludeFrom', []) + new_ex

# ── 3. ADD NEW CATEGORIES ──
new_categories = [
    {
        "categoryId": "labor_outstaffing",
        "level1": "劳动关系认定",
        "level2": "劳务外包",
        "displayName": "劳务外包纠纷",
        "keywords": ["劳务外包", "业务外包", "外包员工", "外包工", "外包转正", "外包被辞退", "外包公司", "外包待遇"],
        "relatedQuestions": [
            "劳务外包和劳务派遣有什么区别",
            "外包员工被辞退有补偿吗",
            "劳务外包能转正式工吗",
            "外包员工受伤算谁的工伤"
        ],
        "requiredFields": ["employerName", "workCompany", "workDuration", "contractType", "hasSalaryPayment"],
        "relevantLaws": [
            {"law": "劳动合同法", "articles": ["第58条", "第59条", "第60条"]},
            {"law": "劳务派遣暂行规定", "articles": ["第27条"]}
        ],
        "excludeFrom": ["dispatch", "de_facto_relation"]
    },
    {
        "categoryId": "probation_dispute",
        "level1": "劳动合同",
        "level2": "试用期",
        "displayName": "试用期纠纷",
        "keywords": ["试用期", "试用期辞退", "试用期工资", "试用期不交社保", "试用期多久", "试用期延长", "试用期开除", "试用期被辞"],
        "relatedQuestions": [
            "试用期最长多久",
            "试用期被辞退有补偿吗",
            "试用期不交社保合法吗",
            "试用期可以随意延长吗",
            "试用期工资可以低于正式工吗"
        ],
        "requiredFields": ["probationPeriod", "probationSalary", "hasSocialInsurance", "hasBeenTerminated", "terminationReason"],
        "relevantLaws": [
            {"law": "劳动合同法", "articles": ["第19条", "第20条", "第21条", "第37条", "第39条"]}
        ],
        "excludeFrom": ["salary_arrears", "illegal_termination", "contract_conclusion"]
    }
]

existing_ids = {c['categoryId'] for c in kg['categories']}
for nc in new_categories:
    if nc['categoryId'] not in existing_ids:
        kg['categories'].append(nc)

# ── 4. UPDATE VERSION ──
kg['version'] = '1.1.0'
kg['lastUpdated'] = '2026-07-28'

# ── 5. SAVE ──
with open('data/knowledge/knowledge_graph.json', 'w', encoding='utf-8') as f:
    json.dump(kg, f, ensure_ascii=False, indent=2)

# ── REPORT ──
total_kw = sum(len(c.get('keywords', [])) for c in kg['categories'])
avg_kw = total_kw / len(kg['categories'])
has_exclude = sum(1 for c in kg['categories'] if c.get('excludeFrom'))
print(f"Knowledge graph expanded successfully!")
print(f"  Categories: {len(kg['categories'])} total ({len(kg['categories'])-40} new)")
print(f"  Total keywords: {total_kw} (avg {avg_kw:.1f}/category)")
print(f"  Categories with excludeFrom: {has_exclude}/{len(kg['categories'])}")
print()
for c in sorted(kg['categories'], key=lambda x: len(x.get('keywords', [])), reverse=True):
    kw_count = len(c.get('keywords', []))
    excl = "Y" if c.get('excludeFrom') else "N"
    print(f"  {c['categoryId']:35s} keywords={kw_count:2d} excludeFrom={excl}")
