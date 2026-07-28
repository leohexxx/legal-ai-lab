"""Fix duplicate field definitions in knowledge_service.py"""
import re

with open('app/services/knowledge_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the field_definitions dict - match from the first "# 基础字段定义映射" to the "required_ids" line
start_marker = '        # 基础字段定义映射（可扩展）'
end_marker = '\n        required_ids = category.get("requiredFields", [])'

start_idx = content.index(start_marker)
end_idx = content.index(end_marker, start_idx)

# The field_definitions dict is between start_marker and end_marker
old_block = content[start_idx:end_idx]

# Build a clean field_definitions dict programmatically
field_defs = {
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
        {"label": "1次", "value": "1"}, {"label": "2次", "value": "2"}, {"label": "3次及以上", "value": "3+"}, {"label": "不确定", "value": "unknown"},
    ], "required": False},
    "baseSalary": {"fieldId": "baseSalary", "label": "您的月工资是多少？", "type": "text", "required": True},
    "salaryPeriod": {"fieldId": "salaryPeriod", "label": "发薪周期", "type": "select", "options": [
        {"label": "每月", "value": "monthly"}, {"label": "每半月", "value": "biweekly"}, {"label": "每周", "value": "weekly"}, {"label": "其他", "value": "other"},
    ], "required": True},
    "arrearsStart": {"fieldId": "arrearsStart", "label": "从哪个月开始欠薪？", "type": "text", "required": True},
    "arrearsEnd": {"fieldId": "arrearsEnd", "label": "到哪个月为止欠薪？", "type": "text", "required": True},
    "totalOwed": {"fieldId": "totalOwed", "label": "大概欠了多少钱？", "type": "text", "required": True},
    "hasNegotiated": {"fieldId": "hasNegotiated", "label": "是否已经和公司协商过？", "type": "select", "options": [
        {"label": "协商过", "value": "yes"}, {"label": "没有协商过", "value": "no"},
    ], "required": False},
    "terminationDate": {"fieldId": "terminationDate", "label": "什么时候被辞退的？", "type": "date", "required": True},
    "terminationReason": {"fieldId": "terminationReason", "label": "公司给出的辞退理由是什么？", "type": "text", "required": True},
    "noticePeriod": {"fieldId": "noticePeriod", "label": "公司提前多久通知的？", "type": "select", "options": [
        {"label": "提前30天通知", "value": "30_days"}, {"label": "提前不到30天", "value": "less_than_30"}, {"label": "没有提前通知，立即辞退", "value": "no_notice"},
    ], "required": True},
    "severancePaid": {"fieldId": "severancePaid", "label": "公司是否支付了经济补偿？", "type": "select", "options": [
        {"label": "支付了", "value": "yes"}, {"label": "没有支付", "value": "no"}, {"label": "还在协商中", "value": "negotiating"},
    ], "required": True},
    "workSchedule": {"fieldId": "workSchedule", "label": "您的工作制是怎样的？", "type": "select", "options": [
        {"label": "标准工时制（周一到周五）", "value": "standard"}, {"label": "综合计算工时制", "value": "comprehensive"}, {"label": "不定时工作制", "value": "irregular"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "overtimeType": {"fieldId": "overtimeType", "label": "哪种加班？", "type": "select", "options": [
        {"label": "工作日加班（平时晚上）", "value": "weekday"}, {"label": "休息日加班（周六日）", "value": "weekend"}, {"label": "法定节假日加班", "value": "holiday"}, {"label": "以上都有", "value": "all"},
    ], "required": True},
    "overtimeHours": {"fieldId": "overtimeHours", "label": "平均每月加班多少小时？", "type": "text", "required": True},
    "payMethod": {"fieldId": "payMethod", "label": "公司怎么发工资的？", "type": "text", "required": False},
    "contractStatus": {"fieldId": "contractStatus", "label": "是否签订了劳动合同？", "type": "select", "options": [
        {"label": "签了书面合同", "value": "signed"}, {"label": "没签合同", "value": "unsigned"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "injuryDate": {"fieldId": "injuryDate", "label": "受伤日期是哪天？", "type": "date", "required": True},
    "injuryCause": {"fieldId": "injuryCause", "label": "受伤原因是什么？", "type": "text", "required": True},
    "injuryLocation": {"fieldId": "injuryLocation", "label": "受伤地点在哪？", "type": "text", "required": True},
    "insuredStatus": {"fieldId": "insuredStatus", "label": "目前社保缴纳状态？", "type": "select", "options": [
        {"label": "公司一直在交", "value": "paying"}, {"label": "公司从未交过", "value": "never"}, {"label": "断缴了", "value": "interrupted"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "missedMonths": {"fieldId": "missedMonths", "label": "欠缴了几个月？", "type": "text", "required": False},
    "isPregnant": {"fieldId": "isPregnant", "label": "是否怀孕？", "type": "select", "options": [
        {"label": "是", "value": "yes"}, {"label": "否", "value": "no"},
    ], "required": True},
    "leaveDays": {"fieldId": "leaveDays", "label": "已经休了多少天假？", "type": "text", "required": False},
    "evidenceTypes": {"fieldId": "evidenceTypes", "label": "目前有哪些证据？", "type": "text", "required": False},
    # 薪酬/金额类
    "actualAmount": {"fieldId": "actualAmount", "label": "实际已支付金额", "type": "text", "required": True},
    "actualSalary": {"fieldId": "actualSalary", "label": "实际月工资", "type": "text", "required": True},
    "agreedAmount": {"fieldId": "agreedAmount", "label": "约定的经济补偿金金额", "type": "text", "required": True},
    "averageSalary": {"fieldId": "averageSalary", "label": "离职前12个月平均工资", "type": "text", "required": True},
    "bonusAmount": {"fieldId": "bonusAmount", "label": "奖金/提成的具体金额", "type": "text", "required": True},
    "totalAmount": {"fieldId": "totalAmount", "label": "涉及的总金额", "type": "text", "required": True},
    "compensationAmount": {"fieldId": "compensationAmount", "label": "竞业限制补偿金的约定金额", "type": "text", "required": True},
    "bonusPolicy": {"fieldId": "bonusPolicy", "label": "奖金/提成的发放规定", "type": "text", "required": True},
    "bonusType": {"fieldId": "bonusType", "label": "奖金类型", "type": "select", "options": [
        {"label": "年终奖", "value": "year_end"}, {"label": "绩效奖金", "value": "performance"}, {"label": "销售提成", "value": "commission"}, {"label": "项目奖金", "value": "project"}, {"label": "其他", "value": "other"},
    ], "required": True},
    # 合同类
    "contractEndDate": {"fieldId": "contractEndDate", "label": "合同到期日期", "type": "date", "required": True},
    "contractTerms": {"fieldId": "contractTerms", "label": "合同中的争议条款", "type": "text", "required": True},
    "contractType": {"fieldId": "contractType", "label": "合同类型", "type": "select", "options": [
        {"label": "固定期限合同", "value": "fixed"}, {"label": "无固定期限合同", "value": "unlimited"}, {"label": "以完成一定工作任务为期限", "value": "task"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "originalTerms": {"fieldId": "originalTerms", "label": "变更前的合同内容", "type": "text", "required": True},
    "newTerms": {"fieldId": "newTerms", "label": "变更后的合同内容", "type": "text", "required": True},
    "terminationParty": {"fieldId": "terminationParty", "label": "解除/终止的提出方是谁？", "type": "text", "required": True},
    "changeType": {"fieldId": "changeType", "label": "变更类型", "type": "select", "options": [
        {"label": "调岗", "value": "transfer"}, {"label": "降薪", "value": "salary_reduction"}, {"label": "调工作地点", "value": "location_change"}, {"label": "变更工作内容", "value": "duty_change"}, {"label": "其他", "value": "other"},
    ], "required": True},
    "changeReason": {"fieldId": "changeReason", "label": "公司给出的变更理由", "type": "text", "required": True},
    # 日期类
    "arbitrationDate": {"fieldId": "arbitrationDate", "label": "申请仲裁的日期", "type": "date", "required": False},
    "awardReceivedDate": {"fieldId": "awardReceivedDate", "label": "收到仲裁裁决书的日期", "type": "date", "required": True},
    "deathDate": {"fieldId": "deathDate", "label": "死亡日期", "type": "date", "required": True},
    "disputeDate": {"fieldId": "disputeDate", "label": "劳动争议发生的日期", "type": "date", "required": True},
    "expectedDate": {"fieldId": "expectedDate", "label": "预产期", "type": "date", "required": False},
    "lastWorkDate": {"fieldId": "lastWorkDate", "label": "最后一次工作日期", "type": "date", "required": True},
    # 工伤/鉴定类
    "disabilityGrade": {"fieldId": "disabilityGrade", "label": "伤残等级", "type": "text", "required": True},
    "diagnosis": {"fieldId": "diagnosis", "label": "诊断结果", "type": "text", "required": True},
    "identificationAuthority": {"fieldId": "identificationAuthority", "label": "鉴定机构名称", "type": "text", "required": False},
    "employerCooperation": {"fieldId": "employerCooperation", "label": "公司是否配合鉴定？", "type": "select", "options": [
        {"label": "配合", "value": "cooperative"}, {"label": "不配合", "value": "uncooperative"}, {"label": "不确定", "value": "unknown"},
    ], "required": False},
    "insuranceType": {"fieldId": "insuranceType", "label": "医保类型", "type": "select", "options": [
        {"label": "城镇职工基本医疗保险", "value": "urban"}, {"label": "城乡居民医疗保险", "value": "rural"}, {"label": "商业医疗保险", "value": "commercial"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "medicalPeriod": {"fieldId": "medicalPeriod", "label": "医疗期时长", "type": "text", "required": True},
    "salaryDuringSickLeave": {"fieldId": "salaryDuringSickLeave", "label": "病假期间的工资标准", "type": "text", "required": True},
    # 社保/公积金类
    "fundStatus": {"fieldId": "fundStatus", "label": "公积金缴纳状态", "type": "select", "options": [
        {"label": "一直在缴", "value": "paying"}, {"label": "从未缴过", "value": "never"}, {"label": "断缴了", "value": "interrupted"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "extractionReason": {"fieldId": "extractionReason", "label": "提取公积金的原因", "type": "text", "required": False},
    "hasApplied": {"fieldId": "hasApplied", "label": "是否已申请公积金提取？", "type": "select", "options": [
        {"label": "已申请", "value": "yes"}, {"label": "未申请", "value": "no"},
    ], "required": False},
    "insuredYears": {"fieldId": "insuredYears", "label": "已缴纳养老保险的年限", "type": "text", "required": True},
    "salaryBase": {"fieldId": "salaryBase", "label": "社保缴费基数", "type": "text", "required": False},
    "retirementPlan": {"fieldId": "retirementPlan", "label": "退休计划安排", "type": "text", "required": False},
    "hasPaidByEmployer": {"fieldId": "hasPaidByEmployer", "label": "公司是否已补缴？", "type": "select", "options": [
        {"label": "已补缴", "value": "yes"}, {"label": "未补缴", "value": "no"}, {"label": "正在处理", "value": "processing"},
    ], "required": False},
    "complaintResult": {"fieldId": "complaintResult", "label": "投诉后的处理结果", "type": "text", "required": False},
    # 女职工保护
    "hasSocialInsurance": {"fieldId": "hasSocialInsurance", "label": "是否参加了生育保险？", "type": "select", "options": [
        {"label": "参加了", "value": "yes"}, {"label": "没有参加", "value": "no"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "salaryBeforeLeave": {"fieldId": "salaryBeforeLeave", "label": "休假前的月工资", "type": "text", "required": True},
    "maternityLeaveDays": {"fieldId": "maternityLeaveDays", "label": "已休产假天数", "type": "text", "required": False},
    "gestationalWeeks": {"fieldId": "gestationalWeeks", "label": "目前怀孕多少周？", "type": "text", "required": False},
    "hasBeenTerminated": {"fieldId": "hasBeenTerminated", "label": "是否已被辞退？", "type": "select", "options": [
        {"label": "已被辞退", "value": "yes"}, {"label": "未被辞退", "value": "no"},
    ], "required": True},
    "hasBeenTransferred": {"fieldId": "hasBeenTransferred", "label": "是否已被调岗？", "type": "select", "options": [
        {"label": "已被调岗", "value": "yes"}, {"label": "未被调岗", "value": "no"},
    ], "required": True},
    "hasInfant": {"fieldId": "hasInfant", "label": "是否有哺乳期婴儿？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": True},
    "infantAge": {"fieldId": "infantAge", "label": "宝宝现在多大？", "type": "text", "required": False},
    "hasReasonableSchedule": {"fieldId": "hasReasonableSchedule", "label": "公司是否安排了合理的工作时间？", "type": "select", "options": [
        {"label": "合理安排", "value": "yes"}, {"label": "没有合理安排", "value": "no"},
    ], "required": False},
    # 离职/解除类
    "severanceOffered": {"fieldId": "severanceOffered", "label": "公司提出多少经济补偿？", "type": "text", "required": False},
    "refusalReason": {"fieldId": "refusalReason", "label": "公司拒绝开具的理由", "type": "text", "required": False},
    "impactOnNewJob": {"fieldId": "impactOnNewJob", "label": "对新工作的影响", "type": "text", "required": False},
    "hasRequested": {"fieldId": "hasRequested", "label": "是否已向公司索要离职证明？", "type": "select", "options": [
        {"label": "已索要", "value": "yes"}, {"label": "未索要", "value": "no"},
    ], "required": True},
    "isInMedicalPeriod": {"fieldId": "isInMedicalPeriod", "label": "是否处于医疗期？", "type": "select", "options": [
        {"label": "是", "value": "yes"}, {"label": "否", "value": "no"},
    ], "required": True},
    "hasLeftCompany": {"fieldId": "hasLeftCompany", "label": "是否已离职？", "type": "select", "options": [
        {"label": "已离职", "value": "yes"}, {"label": "还在职", "value": "no"},
    ], "required": True},
    "layoffReason": {"fieldId": "layoffReason", "label": "公司给出的裁员理由", "type": "text", "required": True},
    "layoffScale": {"fieldId": "layoffScale", "label": "裁员涉及多少人？", "type": "text", "required": True},
    "hasReported": {"fieldId": "hasReported", "label": "公司是否已向劳动部门报告？", "type": "select", "options": [
        {"label": "已报告", "value": "yes"}, {"label": "未报告", "value": "no"}, {"label": "不确定", "value": "unknown"},
    ], "required": False},
    # 考勤/休假类
    "hasOvertimeRecord": {"fieldId": "hasOvertimeRecord", "label": "是否有加班记录或证据？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": True},
    "leaveDaysEntitled": {"fieldId": "leaveDaysEntitled", "label": "全年应休年假天数", "type": "text", "required": True},
    "leaveDaysUsed": {"fieldId": "leaveDaysUsed", "label": "已休年假天数", "type": "text", "required": True},
    "leaveType": {"fieldId": "leaveType", "label": "休假类型", "type": "select", "options": [
        {"label": "病假", "value": "sick"}, {"label": "事假", "value": "personal"}, {"label": "婚假", "value": "marriage"}, {"label": "产假", "value": "maternity"}, {"label": "年假", "value": "annual"}, {"label": "其他", "value": "other"},
    ], "required": True},
    "hasMedicalCert": {"fieldId": "hasMedicalCert", "label": "是否有医院开具的病假证明？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": True},
    "salaryDeduction": {"fieldId": "salaryDeduction", "label": "请假被扣了多少工资？", "type": "text", "required": False},
    # 协商/事实状态类
    "hasNegotiation": {"fieldId": "hasNegotiation", "label": "是否已经进行过协商？", "type": "select", "options": [
        {"label": "已协商", "value": "yes"}, {"label": "未协商", "value": "no"},
    ], "required": True},
    "hasAgreed": {"fieldId": "hasAgreed", "label": "您是否同意变更？", "type": "select", "options": [
        {"label": "同意", "value": "yes"}, {"label": "不同意", "value": "no"},
    ], "required": True},
    "hasConsent": {"fieldId": "hasConsent", "label": "用人单位是否同意？", "type": "select", "options": [
        {"label": "同意", "value": "yes"}, {"label": "不同意", "value": "no"},
    ], "required": False},
    "hasWorked": {"fieldId": "hasWorked", "label": "是否实际为该公司工作过？", "type": "select", "options": [
        {"label": "工作过", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": True},
    "workDuration": {"fieldId": "workDuration", "label": "实际工作了多长时间？", "type": "text", "required": True},
    "hasSupervision": {"fieldId": "hasSupervision", "label": "是否受公司管理制度的约束？", "type": "select", "options": [
        {"label": "是", "value": "yes"}, {"label": "否", "value": "no"}, {"label": "不确定", "value": "unknown"},
    ], "required": False},
    "hasSalaryPayment": {"fieldId": "hasSalaryPayment", "label": "公司是否给您发过工资？", "type": "select", "options": [
        {"label": "发过", "value": "yes"}, {"label": "没发过", "value": "no"},
    ], "required": True},
    "hasSigned": {"fieldId": "hasSigned", "label": "是否已签署竞业限制协议？", "type": "select", "options": [
        {"label": "已签署", "value": "yes"}, {"label": "未签署", "value": "no"},
    ], "required": True},
    "hasWrittenAgreement": {"fieldId": "hasWrittenAgreement", "label": "是否有书面协议？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": True},
    "hasCollectiveContract": {"fieldId": "hasCollectiveContract", "label": "是否有集体合同？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"}, {"label": "不确定", "value": "unknown"},
    ], "required": False},
    "hasUnion": {"fieldId": "hasUnion", "label": "公司是否有工会？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": False},
    "hasEmployerApproved": {"fieldId": "hasEmployerApproved", "label": "公司是否批准了假期？", "type": "select", "options": [
        {"label": "批准了", "value": "yes"}, {"label": "没有批准", "value": "no"},
    ], "required": True},
    "hasInsurance": {"fieldId": "hasInsurance", "label": "是否有工伤保险？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"}, {"label": "不确定", "value": "unknown"},
    ], "required": True},
    "hasDependents": {"fieldId": "hasDependents", "label": "是否有需要供养的亲属？", "type": "select", "options": [
        {"label": "有", "value": "yes"}, {"label": "没有", "value": "no"},
    ], "required": True},
    "hasPreserved": {"fieldId": "hasPreserved", "label": "证据是否已经保全？", "type": "select", "options": [
        {"label": "已保全", "value": "yes"}, {"label": "未保全", "value": "no"},
    ], "required": False},
    "hasReportedToLabor": {"fieldId": "hasReportedToLabor", "label": "是否已向劳动监察部门投诉？", "type": "select", "options": [
        {"label": "已投诉", "value": "yes"}, {"label": "未投诉", "value": "no"},
    ], "required": False},
    "hasFiledLawsuit": {"fieldId": "hasFiledLawsuit", "label": "是否已向法院提起诉讼？", "type": "select", "options": [
        {"label": "已起诉", "value": "yes"}, {"label": "未起诉", "value": "no"},
    ], "required": True},
    "hasUnionAction": {"fieldId": "hasUnionAction", "label": "工会是否已介入？", "type": "select", "options": [
        {"label": "已介入", "value": "yes"}, {"label": "未介入", "value": "no"},
    ], "required": False},
    # 竞业限制
    "restrictionPeriod": {"fieldId": "restrictionPeriod", "label": "竞业限制期限（月）", "type": "text", "required": True},
    "restrictionScope": {"fieldId": "restrictionScope", "label": "竞业限制的范围", "type": "text", "required": True},
    "paymentStatus": {"fieldId": "paymentStatus", "label": "竞业补偿金支付情况", "type": "select", "options": [
        {"label": "按时支付", "value": "paying"}, {"label": "部分支付", "value": "partial"}, {"label": "从未支付", "value": "never"},
    ], "required": True},
    "paymentFrequency": {"fieldId": "paymentFrequency", "label": "补偿金支付周期", "type": "select", "options": [
        {"label": "每月支付", "value": "monthly"}, {"label": "每季度支付", "value": "quarterly"}, {"label": "一次性支付", "value": "lump_sum"}, {"label": "其他", "value": "other"},
    ], "required": True},
    # 劳动关系类
    "primaryEmployer": {"fieldId": "primaryEmployer", "label": "主要用人单位", "type": "text", "required": True},
    "secondaryEmployer": {"fieldId": "secondaryEmployer", "label": "兼职/第二家单位", "type": "text", "required": False},
    "hasContract": {"fieldId": "hasContract", "label": "是否签订了劳动合同？", "type": "select", "options": [
        {"label": "已签订", "value": "yes"}, {"label": "未签订", "value": "no"},
    ], "required": True},
    "workHoursPerWeek": {"fieldId": "workHoursPerWeek", "label": "每周工作多少小时", "type": "text", "required": True},
    "hourlyRate": {"fieldId": "hourlyRate", "label": "小时工资标准", "type": "text", "required": True},
    "workType": {"fieldId": "workType", "label": "工作性质", "type": "text", "required": False},
    "workCompany": {"fieldId": "workCompany", "label": "实际用工单位", "type": "text", "required": True},
    "dispatchCompany": {"fieldId": "dispatchCompany", "label": "劳务派遣公司名称", "type": "text", "required": True},
    "dispatchPeriod": {"fieldId": "dispatchPeriod", "label": "派遣期限", "type": "text", "required": False},
    "salaryComparison": {"fieldId": "salaryComparison", "label": "同一岗位正式员工的薪资", "type": "text", "required": False},
    "dependentCount": {"fieldId": "dependentCount", "label": "需要供养的亲属人数", "type": "text", "required": False},
    # 集体争议
    "affectedCount": {"fieldId": "affectedCount", "label": "涉及员工人数", "type": "text", "required": True},
    "bargainingTopic": {"fieldId": "bargainingTopic", "label": "协商的主要内容", "type": "text", "required": True},
    "participantCount": {"fieldId": "participantCount", "label": "参与人数", "type": "text", "required": False},
    "stoppageReason": {"fieldId": "stoppageReason", "label": "停工/怠工的原因", "type": "text", "required": True},
    "duration": {"fieldId": "duration", "label": "停工持续了多久", "type": "text", "required": False},
    # 证据/时效
    "burdenOfProof": {"fieldId": "burdenOfProof", "label": "举证责任分配情况", "type": "text", "required": False},
    "interruptionReason": {"fieldId": "interruptionReason", "label": "时效中断的理由", "type": "text", "required": False},
    "age": {"fieldId": "age", "label": "年龄", "type": "text", "required": False},
    "localMinWage": {"fieldId": "localMinWage", "label": "当地最低工资标准", "type": "text", "required": True},
    # 其他
    "employerPolicy": {"fieldId": "employerPolicy", "label": "公司休假政策", "type": "text", "required": False},
    "employerPaid": {"fieldId": "employerPaid", "label": "公司是否已经支付相关费用？", "type": "select", "options": [
        {"label": "已支付", "value": "yes"}, {"label": "未支付", "value": "no"},
    ], "required": True},
    "employerResponse": {"fieldId": "employerResponse", "label": "公司对工伤认定的态度", "type": "select", "options": [
        {"label": "配合认定", "value": "cooperative"}, {"label": "不承认是工伤", "value": "deny"}, {"label": "推诿拖延", "value": "delaying"},
    ], "required": False},
    "hasIdentified": {"fieldId": "hasIdentified", "label": "是否已经做了伤残鉴定？", "type": "select", "options": [
        {"label": "已鉴定", "value": "yes"}, {"label": "未鉴定", "value": "no"},
    ], "required": True},
    "probationPeriod": {"fieldId": "probationPeriod", "label": "试用期多长？", "type": "text", "required": True},
    "probationSalary": {"fieldId": "probationSalary", "label": "试用期工资是多少？", "type": "text", "required": True},
    "deathCause": {"fieldId": "deathCause", "label": "死亡原因", "type": "text", "required": True},
}

# Serialize to Python code
lines = ['        # 基础字段定义映射（可扩展）']
lines.append('        field_definitions = {')
for fid in sorted(field_defs.keys()):
    fd = field_defs[fid]
    if fd['type'] == 'select':
        opts = ', '.join(f'{{"label": "{o["label"]}", "value": "{o["value"]}"}}' for o in fd['options'])
        lines.append(f'            "{fid}": {{"fieldId": "{fid}", "label": "{fd["label"]}", "type": "select", "options": [{opts}], "required": {fd["required"]}}},')
    elif fd['type'] == 'date':
        lines.append(f'            "{fid}": {{"fieldId": "{fid}", "label": "{fd["label"]}", "type": "date", "required": {fd["required"]}}},')
    else:
        lines.append(f'            "{fid}": {{"fieldId": "{fid}", "label": "{fd["label"]}", "type": "text", "required": {fd["required"]}}},')

lines.append('        }')
new_block = '\n'.join(lines)

# Build new content
new_content = content[:start_idx] + new_block + content[end_idx:]

with open('app/services/knowledge_service.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Field definitions updated successfully!")

# Verify
pattern = r'\"(\w+)\":\s*\{\"fieldId\"'
keys = re.findall(pattern, new_content)
from collections import Counter
dupes = {k:v for k,v in Counter(keys).items() if v > 1}
if dupes:
    print(f'WARNING: Duplicates still exist: {dupes}')
else:
    print(f'No duplicates. Total unique definitions: {len(set(keys))}')
