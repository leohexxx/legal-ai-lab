# 劳动法知识卡片索引

> 生成日期：2026-07-27
> 法律领域：labor（劳动法）
> 核心主题：wage_arrears（欠薪）
> 审核状态：全部为 draft

---

## 一、规则卡（20 张）

| # | 文件 | 标题 | 来源法规 | 条款 |
|---|------|------|----------|------|
| 1 | `rules/rule_001.yaml` | 工资应当按时足额支付 | 劳动法 | 第五十条 |
| 2 | `rules/rule_002.yaml` | 加班工资支付规则 | 劳动法 | 第四十四条 |
| 3 | `rules/rule_003.yaml` | 最低工资保障规则 | 劳动法 | 第四十八条 |
| 4 | `rules/rule_004.yaml` | 未签劳动合同二倍工资规则 | 劳动合同法 | 第八十二条 |
| 5 | `rules/rule_005.yaml` | 经济补偿支付规则 | 劳动合同法 | 第四十六/四十七条 |
| 6 | `rules/rule_006.yaml` | 违法解除劳动合同赔偿规则 | 劳动合同法 | 第八十七条 |
| 7 | `rules/rule_007.yaml` | 欠薪加付赔偿金规则 | 劳动合同法 | 第八十五条 |
| 8 | `rules/rule_008.yaml` | 拒不支付劳动报酬罪的认定规则 | 拒不支付劳动报酬司法解释 | 第一至九条 |
| 9 | `rules/rule_009.yaml` | 欠薪仲裁时效特殊规则 | 劳动争议调解仲裁法 | 第二十七条 |
| 10 | `rules/rule_010.yaml` | 劳动监察工资支付监督规则 | 劳动保障监察条例 | 第十一/二十六条 |
| 11 | `rules/rule_011.yaml` | 欠薪支付令规则 | 劳动合同法 | 第三十条 |
| 12 | `rules/rule_012.yaml` | 试用期工资最低标准规则 | 劳动合同法 | 第二十条 |
| 13 | `rules/rule_013.yaml` | 工资争议用人单位举证责任规则 | 劳动争议司法解释（一） | 第四十四条 |
| 14 | `rules/rule_014.yaml` | 加班费举证责任规则 | 劳动争议司法解释���一） | 第四十二条 |
| 15 | `rules/rule_015.yaml` | 劳动监察投诉权利规则 | 劳动保障监察条例 | 第九/十条 |
| 16 | `rules/rule_016.yaml` | 工资欠条直接起诉规则 | 劳动争议司法解释（一） | 第十五条 |
| 17 | `rules/rule_017.yaml` | 最低工资扣除项目规则 | 最低工资规定 | 第十二条 |
| 18 | `rules/rule_018.yaml` | 劳动合同解除后经济补偿与工作交接规则 | 劳动合同法 | 第五十条 |
| 19 | `rules/rule_019.yaml` | 劳动者因欠薪解除劳动合同规则 | 劳动合同法 | 第三十八条 |
| 20 | `rules/rule_020.yaml` | 最低工资标准调整规则 | 最低工资规定 | 第十条 |

## 二、证据卡（12 张）

| # | 文件 | 名称 | 证据类型 |
|---|------|------|----------|
| 1 | `evidence/ev_labor_contract.yaml` | 劳动合同 | document |
| 2 | `evidence/ev_pay_slip.yaml` | 工资条/工资单 | document |
| 3 | `evidence/ev_bank_statement.yaml` | 银行流水 | electronic |
| 4 | `evidence/ev_attendance_record.yaml` | 考勤记录 | electronic |
| 5 | `evidence/ev_chat_record.yaml` | 聊天记录（微信/短信等） | electronic |
| 6 | `evidence/ev_audio_video.yaml` | 录音/录像 | electronic |
| 7 | `evidence/ev_witness.yaml` | 证人证言 | witness |
| 8 | `evidence/ev_work_badge.yaml` | 工作证/工牌 | physical |
| 9 | `evidence/ev_social_insurance_record.yaml` | 社保缴费记录 | electronic |
| 10 | `evidence/ev_work_email.yaml` | 工作邮件 | electronic |
| 11 | `evidence/ev_payroll_account.yaml` | 工资支付台账（用人单位掌握） | electronic |
| 12 | `evidence/ev_clock_in_record.yaml` | 考勤打卡记录 | electronic |

## 三、程序卡（7 张）

| # | 文件 | 名称 | 主管机关 |
|---|------|------|----------|
| 1 | `procedures/proc_labor_supervision.yaml` | 劳动监察投诉 | 劳动监察大队 |
| 2 | `procedures/proc_labor_arbitration.yaml` | 劳动仲裁 | 劳动争议仲裁委员会 |
| 3 | `procedures/proc_court_litigation.yaml` | 法院诉讼（劳动争议） | 基层人民法院 |
| 4 | `procedures/proc_negotiation.yaml` | 协商和解 | 双方自行/工会 |
| 5 | `procedures/proc_mediation.yaml` | 调解（企业调解/人民调解） | 调解组织 |
| 6 | `procedures/proc_payment_order.yaml` | 申请支付令 | 基层人民法院 |
| 7 | `procedures/proc_final_arbitration.yaml` | 劳动仲裁终局裁决（小额争议） | 劳动争议仲裁委员会 |

## 四、数据来源

| source_id | 法规名称 |
|-----------|----------|
| `labor_law_2018` | 中华人民共和国劳动法（2018年修正） |
| `labor_contract_law_2012` | 中华人民共和国劳动合同法（2012年修正） |
| `labor_dispute_mediation_law_2007` | 中华人民共和国劳动争议调解仲裁法 |
| `labor_contract_regulation_2008` | 劳动合同法实施条例 |
| `labor_supervision_regulation_2004` | 劳动保障监察条例 |
| `minimum_wage_regulation_2004` | 最低工资规定 |
| `labor_dispute_interpretation_1_2006` | 劳动争议司法解释（一） |
| `wage_arrears_criminal_interpretation_2013` | 拒不支付劳动报酬司法解释 |

---

## 统计

- **规则卡：** 20 张（目标 ≥ 15 ✓）
- **证据卡：** 12 张（目标 ≥ 10 ✓）
- **程序卡：** 7 张（目标 ≥ 5 ✓）
- **合计：** 39 张知识卡片
