# 🚀 Legal AI Lab — 第三轮夜间任务清单

> **生成时间**: 2026-07-29 凌晨
> **执行策略**: A（主线）+ B（并行）= 覆盖一整晚
> **面向**: 下一个接手的 AI 助手

---

## 当前项目快照

```
✅ 已就绪
├── S1-S5 全部 20 页面
├── Phase 1: 知识图谱 42分类 / 558关键词 / 179字段定义
├── Phase 2: 对话式 UI 组件（6个）+ U01/U03/U04 改造
├── 139 个测试全部通过（94 vitest + 45 E2E）
├── Git 已推送 GitHub
└── 知识库: 20 规则卡 + 12 证据卡 + 7 程序卡
```

---

## 🅰️ 主线任务 — P0 链路打通（预计 5-7 小时）

**目标**: 让用户真正走通"描述问题 → 对话确认 → 追问补充 → 看到结果"的完整链路。

### A1: 后端启动 + 环境验证 [15min]

```powershell
# 1. 启动后端
cd D:\4.开发工具\legal_ai_lab
uvicorn app.main:app --reload --port 8000

# 2. 验证 DeepSeek API 可达
python -c "
import httpx
r = httpx.post('https://api.deepseek.com/v1/chat/completions',
  json={'model':'deepseek-chat','messages':[{'role':'user','content':'hi'}]},
  headers={'Authorization':'Bearer sk-0afad2bc0acb439cbaccfe58fe1f9c13'},
  timeout=10)
print(f'API OK: {r.status_code}')
"

# 3. 启动前端
cd D:\4.开发工具\legal_ai_lab\frontend && npm run dev
```

验收: 后端 8000 / 前端 3000 正常启动，DeepSeek API 返回 200

---

### A2: U01➔U04 意图识别链路验证 [30min]

**验证场景**:

| 输入 | 期望 categoryId | 不得误判为 |
|------|:---------------:|:----------:|
| "公司说合同到期不续签了，我有补偿吗？" | `contract_renewal` | `salary_arrears` |
| "公司拖欠我三个月工资了" | `salary_arrears` | `contract_renewal` |
| "公司突然把我开除了，没有任何补偿" | `illegal_termination` | `salary_arrears` |

**测试方式**：
```python
# 1. 用 curl 或 Python 调 identify 接口
# 2. 手动在浏览器 U01 输入并观察
# 3. 按"继续对话"看是否带 categoryId 跳到 U04
```

**问题处理**:
- 如果返回错误 categoryId → 检查 `chat_prompts.py` 的 few-shot 示例
- 如果 API 超时降级 → 确认网络和 API Key
- 如果 U01 页面报错 → 修复 TS 错误

验收: 3 个场景全部识别正确，U01➔U04 跳转正常

---

### A3: U04 对话流程修通 [2-3h] ⭐ 最关键

当前 `frontend/src/app/u04/page.tsx` 的 ChatMode 存在 **4 个缺陷**：

#### A3-1: handleFieldResponse 没有实际发送到 API (Bug) [30min]

**问题**: `handleFieldResponse` (line 495-505) 只更新了本地 `collectedFields`，没有调用 `askFollowUp` API 把回答传给后端。用户回答了追问字段后，后端并不知道——所以不会进入下一步追问逻辑。

**修复方法**:
```typescript
// 在 handleFieldResponse 中，收集到字段后应该自动调 sendMessage 或 askFollowUp
// 方案: 直接把用户回答作为消息发送
const handleFieldResponse = (fieldId: string, value: string) => {
  useChatStore.getState().updateCollectedFields({ [fieldId]: value });
  
  // 如果已有上下文，自动发送一条消息触发下一轮
  const state = useChatStore.getState();
  if (state.contextId) {
    // 直接调用 sendMessage 让 AI 处理下一轮
    state.sendMessage(`关于${fieldId}：${value}`);
  }
};
```

**涉及文件**:
- `frontend/src/app/u04/page.tsx` (line 495-505)
- 或者改 `frontend/src/lib/chatStore.ts` 的 sendMessage 逻辑

#### A3-2: 意图确认后没有正确获取 contextId [30min]

**问题**: `chatStore.ts` 的 `confirmIntent` (line 216-234) 在首次确认后前端自己生成了一个 contextId，但后端在 `/api/v1/chat/ask` 里也会生成一个。两边不一致会导致对话上下文丢失。

**修复方案**: 修改 `AskResponse` schema 返回后端生成的 `contextId`，或者让后端接收前端生成的 ID 并复用。

**更简单的方案**: 在 `chatStore.confirmIntent` 里，让首次调 ask 时不传 contextId（传 undefined），后端创建后……但目前后端 AskResponse 不返回 contextId。

**实际方案**: 改后端 `/api/v1/chat/ask` 的响应增加 `contextId` 字段。

**涉及文件**:
- `app/schemas/chat.py` — AskResponse 加 contextId 字段
- `app/routers/chat.py` — ask 返回带上 contextId
- `frontend/src/lib/chatStore.ts` — confirmIntent 从响应提取 contextId

#### A3-3: "直接看结果"跳转 U05 的数据对接 [45min]

**问题**: skip 后系统生成了初步分析文本和 factsExtracted，但没有填入 `useCaseStore`，跳转 U05 后页面是空的。

**修复方法**: 修改 `chatStore.skipFollowUp()` 或 U04 的 `handleViewResult()`，把 skip 返回的 factsExtracted 映射为 Case FactItem，填入 `useCaseStore`，再跳转。

**涉及文件**:
- `frontend/src/lib/chatStore.ts` — skipFollowUp 后存储 facts
- `frontend/src/app/u04/page.tsx` — handleViewResult 映射数据

#### A3-4: 整体交互体验打磨 [30min]

- 确认输入框自动获取焦点
- Shift+Enter 换行（已有 Enter 发送）
- 发送后输入框根据内容自适应高度
- 空消息时的 UI 引导
- 错误消息的友好展示

**涉及文件**: `frontend/src/app/u04/page.tsx`

验收: 完整链路 U01➔U04(输入→确认→追问→补充→跳过)➔U05 跑通

---

### A4: 前端聊天组件单元测试 [1.5-2h]

为 5 个对话组件编写 vitest 测试（需 mock API / store）：

| # | 组件 | 文件 | 最少用例 | 核心测什么 |
|:-:|------|------|:--------:|-----------|
| 1 | ChatMessage | `chat/ChatMessage.tsx` | 6 | 用户/系统角色样式、loading 动画、intent 标签渲染、fields 追问渲染、markdown 渲染、时间戳 |
| 2 | IntentTag | `chat/IntentTag.tsx` | 4 | 分类展示、置信度进度条、确认按钮回调、纠错回调 |
| 3 | SkipButton | `chat/SkipButton.tsx` | 3 | 可点击/禁用状态、loading 状态、点击事件 |
| 4 | TypingIndicator | `chat/TypingIndicator.tsx` | 2 | 3个圆点渲染、动画 class |
| 5 | ContextSummary | `chat/ContextSummary.tsx` | 3 | 空状态显示、带数据渲染、"查看结果"按钮 |

**测试文件**: `frontend/src/__tests__/chat-components.test.tsx`

**Mock 策略**:
- ChatMessage 是纯展示组件，props 驱动，无需 mock
- IntentTag / SkipButton 测试回调即可
- 不需要真实 API 调用

**运行**: `cd frontend && npx vitest run`

验收: 新增 18+ 测试用例全部通过，`npm test -- --run` 无回归

---

### A5: chatStore 单元测试 [1h]

**测试文件**: `frontend/src/__tests__/chatStore.test.ts`

| # | 测试场景 | 方法 | mock 内容 |
|:-:|---------|------|----------|
| 1 | 初始状态 | 创建 store | 无 |
| 2 | addMessage 追加 | `addMessage()` | 无 |
| 3 | setProcessing 切换 | `setProcessing()` | 无 |
| 4 | setIntent | `setIntent()` | 无 |
| 5 | updateCollectedFields 合并 | `updateCollectedFields()` | 无 |
| 6 | resetChat 重置 | `resetChat()` | 无 |
| 7 | sendMessage 首次→意图识别 | `sendMessage()` | mock api.identifyIntent |
| 8 | sendMessage 已有上下文→ask | `sendMessage()` | mock api.askFollowUp |
| 9 | confirmIntent 确认 | `confirmIntent()` | mock api.askFollowUp |
| 10 | correctIntent 纠正 | `correctIntent()` | 复用 sendMessage |
| 11 | skipFollowUp 跳过 | `skipFollowUp()` | mock api.skipFollowUp |
| 12 | 并发保护(正在处理时忽略) | `sendMessage()` | 不 mock |

**Mock 策略**: 
```typescript
import { identifyIntent, askFollowUp, skipFollowUp } from "@/lib/api";
vi.mock("@/lib/api", () => ({
  identifyIntent: vi.fn(),
  askFollowUp: vi.fn(),
  skipFollowUp: vi.fn(),
}));
```

验收: 12+ 测试用例全部通过

---

### A6: 后端 API 增强测试 [1h]

**测试文件**: `tests/test_chat_api.py`（新建）

| # | 场景 | 验证点 |
|:-:|------|--------|
| 1 | POST identify 正常 | 200, code=0, categoryId 非空 |
| 2 | POST identify 空消息 | 422 合理错误 |
| 3 | POST identify 网络超时降级 | mock httpx 超时 → 关键词匹配返回 |
| 4 | POST ask 首次创建上下文 | 无 contextId 时后端自动创建 |
| 5 | POST ask 已有 contextId | 返回追问字段 |
| 6 | POST ask 不存在 contextId | 不抛 KeyError，自愈 |
| 7 | POST ask 确认意图后 | returned fields 与 categoryId 匹配 |
| 8 | POST skip 正常 | 返回 message+factsExtracted |
| 9 | POST skip 无效 categoryId | 友好错误信息 |
| 10 | GET categories | 返回 42 个节点 |
| 11 | GET categories/{id} | 返回详情 |
| 12 | GET categories/{id}/fields | 返回字段定义 |
| 13 | POST search 关键词 | 返回匹配分类 |

验收: 13 测试全过，`python -m pytest tests/test_chat_api.py -v`

---

## 🅱️ 并行任务 — 知识库大扩充（预计 4-6 小时）

**目标**: 大幅充实知识库内容，让 AI 回答有据可依。

> ⚡ 此任务可与 A 任务并行执行（在不同的终端/编辑器窗口）

### B1: 规则卡 20→80 条 [2-3h]

**位置**: `data/knowledge/labor/rules/`（YAML 格式）

**当前覆盖**: 主要集中在欠薪（10+ 条），其他分类覆盖不足

**扩充计划**:

| 一级分类 | 现有 | 目标 | 需新增的关键规则 |
|---------|:----:|:----:|----------------|
| 劳动合同 | 3 | 15 | 试用期规定、合同续签、合同变更、合同终止、无固定期限合同 |
| 辞退裁员 | 3 | 12 | 经济补偿 N+1、裁员程序、违法辞退 2N、离职证明 |
| 社保福利 | 2 | 10 | 社保缴纳义务、医疗保险、养老保险、失业保险、公积金 |
| 工伤赔偿 | 2 | 8 | 工伤认定标准、伤残等级对应赔偿、工亡赔偿、停工留薪期 |
| 休息休假 | 1 | 8 | 年休假天数、未休年假补偿、病假工资、产假天数、陪产假 |
| 工资报酬 | 6 | 12 | 提成/奖金规定、年终奖、工资条交付义务 |
| 其他 | 3 | 15 | 女职工保护、竞业限制补偿、集体合同、劳务派遣 |
| **合计** | **20** | **80** | |

**格式模板**（每条约 30-50 行 YAML）:
```yaml
# 规则卡 - XXX
rule_id: "labor_rule_xxx"
title: "规则标题"
domain: "labor"
topic: "对应分类的 topic 标记"
related_categories: ["关联的 categoryId"]
jurisdiction: "全国"
effective_from: "YYYY-MM-DD"
effective_to: null
status: "active"
conditions:
  - "条件1"
  - "条件2"
legal_effect: "法律后果描述..."
exceptions:
  - "例外1"
facts_required:
  - "所需事实1"
evidence_related:
  - "关联证据1"
procedure_related:
  - "关联程序1"
law_reference:
  law: "法律名称"
  articles: ["条号1", "条号2"]
```

验收: 60 条新规则卡，每条格式正确、有法律依据、有适用条件

---

### B2: 案例卡建设 [1.5-2h]

**位置**: `data/knowledge/labor/cases/`（新建目录）

内容: 首批 30 个典型案例，覆盖全部 11 个一级分类

**来源建议**: 最高人民法院指导案例 + 各地劳动仲裁典型案例

**格式**:
```yaml
# 案例卡 - XXX
case_id: "labor_case_001"
title: "案例标题"
domain: "labor"
related_categories: ["关联的 categoryId"]
source: "来源（最高法指导案例XX号/典型案例）"
publish_date: "YYYY-MM-DD"
summary: "案件摘要（100-200字）"
facts:
  - "事实1"
  - "事实2"
dispute_focus: "争议焦点"
judgment: "裁判结果"
key_rules_applied:
  - rule_id: "labor_rule_xxx"
    explanation: "规则适用说明"
legal_principles:
  - "裁判要旨1"
  - "裁判要旨2"
relevance_score: 0.95  # 与同类问题的关联度
```

**分配计划**:

| 分类 | 案例数 | 重点主题 |
|------|:------:|---------|
| 劳动合同 | 5 | 未签合同双倍工资、合同续签、违法解除 |
| 工资报酬 | 5 | 欠薪、加班费、年终奖 |
| 辞退裁员 | 4 | 违法辞退 2N、经济补偿、裁员程序 |
| 社保福利 | 3 | 社保补缴、工伤待遇 |
| 工伤赔偿 | 3 | 工伤认定、伤残赔偿 |
| 休息休假 | 3 | 年休假补偿、病假工资 |
| 劳动关系认定 | 3 | 劳动关系 vs 劳务关系 |
| 其他 | 4 | 竞业限制、女职工保护、劳务派遣 |

验收: 30 个案例卡，覆盖所有主要分类，格式一致

---

### B3: 证据链推理规则 [1h]

**位置**: `data/knowledge/labor/evidence-chain.json`（新建）

为目标 11 个一级分类构建"证据链推理规则"——如果用户说"A"，需要检查哪些证据。

**格式**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-07-29",
  "chains": [
    {
      "categoryId": "salary_arrears",
      "categoryName": "欠薪",
      "description": "用户主张公司拖欠工资时，建议收集的证据链",
      "requiredEvidence": [
        { "evidenceId": "ev_labor_contract", "label": "劳动合同", "reason": "证明劳动关系存在", "priority": "P0" },
        { "evidenceId": "ev_pay_slip", "label": "工资条", "reason": "证明工资标准", "priority": "P0" },
        { "evidenceId": "ev_bank_statement", "label": "银行流水", "reason": "证明实际支付记录", "priority": "P0" },
        { "evidenceId": "ev_clock_in_record", "label": "考勤记录", "reason": "证明出勤", "priority": "P1" },
        { "evidenceId": "ev_chat_record", "label": "聊天记录", "reason": "证明催讨过程", "priority": "P1" }
      ],
      "logicRules": [
        "有劳动合同 + 工资条 + 银行流水无记录 → 欠薪证据充分",
        "无合同但有工资条/银行流水 → 可证明事实上存在劳动关系",
        "考勤记录 + 聊天记录 → 辅助证明实际工作量"
      ],
      "suggestedQuestions": [
        "您和公司签了劳动合同吗？",
        "公司每个月几号发工资？",
        "您有之前发工资的银行记录吗？"
      ]
    }
  ]
}
```

**覆盖范围**: 全部 11 个一级分类，每个分类 3-5 条 requiredEvidence + 2-3 条 logicRules

验收: 11 个证据链，格式正确，逻辑合理

---

### B4: 法律原文结构化 [1h]

**位置**: `data/knowledge/labor/laws/`（新建目录）

将 `data/raw/labor/` 下的 10 部法律原文按章节/条款结构化：

```json
{
  "lawId": "labor_contract_law",
  "title": "中华人民共和国劳动合同法",
  "fullTitle": "中华人民共和国劳动合同法（2012年修正）",
  "effectiveDate": "2013-07-01",
  "chapters": [
    {
      "chapterNo": 1,
      "title": "总则",
      "articles": [
        { "articleNo": 1, "content": "为了完善劳动合同制度……", "keywords": ["立法目的"], "summary": "立法目的和依据" },
        { "articleNo": 2, "content": "中华人民共和国境内的企业……", "keywords": ["适用范围"], "summary": "适用范围" }
      ]
    }
  ]
}
```

**优先级**: 先做 3 部核心法律
1. `labor_contract_law_2012_full.txt` → 劳动合同法 (最重要)
2. `labor_law_2018_full.txt` → 劳动法
3. `labor_dispute_mediation_law_2007_full.txt` → 劳动争议调解仲裁法

验收: 3 部核心法律完成结构化，JSON 格式正确

---

## 📋 执行顺序建议

```
时间轴（0:00 开始）:

┌─────────────────────────────────────────────────────────┐
│ 0:00-0:15  │  A1: 环境启动                              │
│             │  B任务同步准备（创建目录、模板文件）        │
├─────────────┼───────────────────────────────────────────┤
│ 0:15-0:45   │  A2: 意图识别链路验证                     │
├─────────────┼───────────────────────────────────────────┤
│ 0:45-3:45   │  A3: U04 对话流程修通（最核心 3h）       │
│             │  ═══════════════════════════════════════  │
│   并行跑     │  B1: 规则卡扩充 (独立终端)                │
│             │  B2: 案例卡建设 (独立终端)                │
│             │  B4: 法律原文结构化 (独立终端)            │
├─────────────┼───────────────────────────────────────────┤
│ 3:45-5:45   │  A4+A5: 前端测试 (2h)                    │
│             │  ═══════════════════════════════════════  │
│   并行跑     │  B3: 证据链推理规则 (1h)                 │
├─────────────┼───────────────────────────────────────────┤
│ 5:45-6:45   │  A6: 后端测试 + 整体回归                 │
├─────────────┼───────────────────────────────────────────┤
│ 6:45-7:00   │  生成交接文档 + Git 推送                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 关键文件速查

### 需要修改的文件（A 任务）

| 文件 | 修改什么 |
|------|---------|
| `frontend/src/app/u04/page.tsx` | A3-1: handleFieldResponse 修复、A3-3: U05跳转数据填充 |
| `frontend/src/lib/chatStore.ts` | A3-2: contextId 管理修复、A3-3: skip 后数据存储 |
| `app/schemas/chat.py` | AskResponse 增加 contextId |
| `app/routers/chat.py` | ask 返回带上 contextId |

### 需要新增的文件

| 文件 | 任务 |
|------|------|
| `frontend/src/__tests__/chat-components.test.tsx` | A4 |
| `frontend/src/__tests__/chatStore.test.ts` | A5 |
| `tests/test_chat_api.py` | A6 |
| `data/knowledge/labor/cases/` (30个yml) | B2 |
| `data/knowledge/labor/evidence-chain.json` | B3 |
| `data/knowledge/labor/laws/` (3个json) | B4 |

### 不需要改动的文件

| 文件 | 原因 |
|------|------|
| `app/services/chat_service.py` | 工作正常，无需修改 |
| `app/services/chat_prompts.py` | Prompt 设计合理 |
| `app/services/knowledge_service.py` | 功能完整 |
| `app/routers/knowledge.py` | 功能完整 |
| `data/knowledge/knowledge_graph.json` | 42分类/558关键词已就绪 |
| `frontend/src/components/chat/ChatMessage.tsx` | 组件逻辑完整 |
| `frontend/src/lib/api.ts` | API 封装完整 |
| `frontend/src/app/page.tsx` | 首页功能完整 |
| `frontend/src/app/u03/page.tsx` | 降级通道功能完整 |

---

## 🎯 最终验收标准

全部完成后，必须通过以下验收：

```
□ 后端 8000 端口正常启动
□ 前端 3000 端口正常启动
□ U01 输入 "合同不续签" → 识别为 contract_renewal → 跳 U04
□ U01 输入 "拖欠工资" → 识别为 salary_arrears
□ U01 输入 "违法开除" → 识别为 illegal_termination
□ U04 意图确认后能收到追问字段
□ U04 字段补充后提交能触发下一轮追问
□ U04 "直接看结果" → 跳转 U05 且有数据
□ 前端 npm test -- --run 全部通过（含新增 30+ 测试）
□ 后端 python tests/test_api_e2e.py 45/45
□ 后端 python -m pytest tests/test_chat_api.py -v 13/13
□ 新加规则卡 60 条（格式正确）
□ 新加案例卡 30 个
□ 证据链 11 条
□ 3 部核心法律结构化
□ Git 全部提交推送
□ 生成 AI-Handoff-Round3 交接文档
```

---

## 📐 附录: 启动命令速查

```powershell
# 后端
cd D:\4.开发工具\legal_ai_lab
uvicorn app.main:app --reload --port 8000

# 前端
cd D:\4.开发工具\legal_ai_lab\frontend
npm run dev

# 前端测试
cd D:\4.开发工具\legal_ai_lab\frontend
npx vitest run

# 后端 E2E（需启动后端）
cd D:\4.开发工具\legal_ai_lab
python tests/test_api_e2e.py

# 后端单元测试
cd D:\4.开发工具\legal_ai_lab
python -m pytest tests/test_chat_api.py -v

# 构建
cd D:\4.开发工具\legal_ai_lab\frontend
npm run build

# 知识图谱统计
cd D:\4.开发工具\legal_ai_lab
python -c "
import json
with open('data/knowledge/knowledge_graph.json') as f:
    kg = json.load(f)
cats = kg['categories']
print(f'分类: {len(cats)}')
print(f'总关键词: {sum(len(c[\"keywords\"]) for c in cats)}')
print(f'含互斥: {sum(1 for c in cats if c.get(\"excludeFrom\"))}')
print(f'总字段引用: {sum(len(c[\"requiredFields\"]) for c in cats)}')
"
```

---

> **交接说明**: 完成上面全部任务后，请将工作总结写入 `99-LLM-Context/13-AI-Handoff-Round3.md`，提交 GitHub commit `"feat: Round3 — 对话流程修通 + 知识库全面扩充"`，然后通知用户验收。
