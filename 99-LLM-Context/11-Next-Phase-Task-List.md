# 🚀 Legal AI Lab — 下一阶段超级任务清单

> **生成时间**: 2026-07-29
> **面向**: 下一个接手的 AI 助手
> **工作量**: 设计为 AI 持续运行 8-12 小时的工作量

---

## 一、项目当前状态

```
✅ 已完成
├── S1-S5 前端全部 20 页面（U01-U16, L01-L04）
├── 状态治理组件（LoadingSkeleton / EmptyState / ErrorState）
├── 测试套件：94 vitest + 45 E2E API tests
├── Phase 1：知识图谱（42分类/558关键词/179字段）+ DeepSeek API + 意图识别
├── Phase 2：对话式 UI 组件 + U01/U03/U04 改造
├── Bug 修复：contextId KeyError
├── 项目文档体系：PRD / 架构设计 / 测试报告 / 交接文档 / PROJECT_MAP
├── Git 已全部推送至 GitHub
```

```
❌ 待完成（按优先级排列）
├── 🔴 P0 — 核心体验缺口（修复后产品才可用）
├── 🟠 P1 — 重要增强（大幅提升产品质量）
├── 🟡 P2 — 锦上添花（加分项）
└── 📚 知识库 — 持续扩充内容
```

---

## 二、🔴 P0 — 核心体验缺口

这些是产品能否真正跑通的关键。不做这些，对话式交互只是一个空壳。

### P0-01: 对话流程端到端验证与修复

**目标**: 跑通完整链路：U01 输入 → 意图识别 → U04 对话 → 确认 → 追问 → 跳转到 U05

**具体任务**:

| # | 任务 | 涉及文件 | 预估 |
|:--:|------|---------|:----:|
| 1 | 启动后端 (`uvicorn app.main:app --reload --port 8000`) 和前端 (`cd frontend && npm run dev`)，验证 DeepSeek API 是否可达 | — | 10min |
| 2 | 在 U01 输入"公司合同到期不续签"，验证返回 `categoryId: contract_renewal`，confidence > 0.7 | `frontend/src/app/page.tsx` | 5min |
| 3 | 点击"继续对话"，验证跳转到 `/u04?q=...&categoryId=contract_renewal` | 同上 | 5min |
| 4 | U04 页面加载后，验证是否自动显示意图确认气泡 | `frontend/src/app/u04/page.tsx` | 10min |
| 5 | 点击"确认"，验证调用 `/api/v1/chat/ask` 并返回追问字段 | 同上 | 10min |
| 6 | 验证追问字段的渲染——目前代码中 U04 页面没看到 IntentTag 和字段组件的渲染逻辑，需要补全 | `frontend/src/app/u04/page.tsx` | 30min |
| 7 | 验证 TypingIndicator 动画在等待 API 时的显示效果 | `frontend/src/components/chat/TypingIndicator.tsx` | 10min |
| 8 | 验证 SkipButton（"不补充，直接看结果"）点击后调用 skip API 并展示结果 | `frontend/src/components/chat/SkipButton.tsx` + U04 页面 | 15min |
| 9 | **关键缺口**: skip 后的结果目前只是文本，需要对接 U05（事实确认页）— 把 chat 中收集的字段映射为 Case FactItem | `frontend/src/app/u04/page.tsx` → `frontend/src/app/u05/page.tsx` | **1h** |
| 10 | 验证意图识别置信度低时（`confidence < 0.3`）是否跳转到 U03 | `frontend/src/app/u03/page.tsx` | 10min |
| 11 | 测试"纠正意图"流程：用户说"不对，其实是..." → 重新识别 | `frontend/src/lib/chatStore.ts` | 15min |

**验收标准**:
- [ ] 完整链路 U01 → U04 → U05 跑通，无白屏/报错
- [ ] "合同不续签" 识别为 `contract_renewal`，不归类为欠薪
- [ ] "拖欠工资 3 个月" 识别为 `salary_arrears`
- [ ] "公司违法开除我" 识别为 `illegal_termination`
- [ ] "不补充，直接看结果" 按钮可用，能生成初步结果
- [ ] 追问字段正常渲染（输入框/选项按钮）
- [ ] 低置信度场景降级到 U03

---

### P0-02: 新增前端对话组件单元测试

**目标**: 为 5 个新增聊天组件编写 vitest 测试，确保它们渲染正确。

**待测组件**:

| 文件 | 测试内容 |
|------|---------|
| `frontend/src/components/chat/ChatMessage.tsx` | 用户/系统消息样式区分、loading 状态、时间戳、intent 标签渲染、fields 列表渲染 |
| `frontend/src/components/chat/IntentTag.tsx` | 分类展示、置信度进度条、确认按钮回调、纠错下拉 |
| `frontend/src/components/chat/ContextSummary.tsx` | 空状态、有数据状态、字段列表 |
| `frontend/src/components/chat/SkipButton.tsx` | 可点击状态、loading 状态、禁用状态、点击回调 |
| `frontend/src/components/chat/TypingIndicator.tsx` | 三个圆点动画渲染 |

**测试文件**: `frontend/src/__tests__/chat-components.test.tsx`

**验收��准**:
- [ ] 5 个组件全部覆盖
- [ ] 每个组件至少 3 个测试用例
- [ ] `npm test -- --run` 全部通过
- [ ] 测试覆盖率 > 80%（针对 chat 组件）

---

### P0-03: 新增 chatStore 单元测试

**目标**: 测试对话状态管理的核心逻辑。

**测试内容**:
- `addMessage` 正确追加消息
- `sendMessage` 首次发送走意图识别流程
- `confirmIntent` 确认后调用 ask API
- `correctIntent` 重新调用识别
- `skipFollowUp` 调用 skip API
- `resetChat` 恢复初始状态
- 边缘情况：空消息、API 失败、重复发送、并发

**测试文件**: `frontend/src/__tests__/chatStore.test.ts`

**验收标准**:
- [ ] chatStore 所有 7 个核心 action 覆盖测试
- [ ] API mock 使用 vitest.mock
- [ ] `npm test -- --run` 全部通过

---

### P0-04: 新增后端测试

**目标**: 为后端新增的 chat 路由和 service 编写测试。

**测试内容**:

| # | 测试 | 验证点 |
|:--:|------|--------|
| 1 | `POST /api/v1/chat/identify` — 正常请求 | 返回 200, code=0, 有 categoryId |
| 2 | `POST /api/v1/chat/identify` — 空消息 | 返回合理错误 |
| 3 | `POST /api/v1/chat/identify` — DeepSeek 超时 | 降级到关键词匹配 |
| 4 | `POST /api/v1/chat/ask` — 首次对话（无 contextId） | 后端自动创建 context |
| 5 | `POST /api/v1/chat/ask` — 已有 contextId 继续对话 | 返回追问字段 |
| 6 | `POST /api/v1/chat/ask` — 不存在的 contextId | 不抛 KeyError，自动创建新上下文 |
| 7 | `POST /api/v1/chat/skip` — 正常跳过 | 返回初步分析 + factsExtracted |
| 8 | `POST /api/v1/chat/skip` — 无效 categoryId | 返回友好错误 |
| 9 | `GET /api/v1/knowledge/categories` | 返回 42 个分类 |
| 10 | `GET /api/v1/knowledge/categories/{id}` — 有效 ID | 返回分类详情 |
| 11 | `GET /api/v1/knowledge/categories/{id}` — 无效 ID | 返回 404 |
| 12 | `GET /api/v1/knowledge/categories/{id}/fields` | 返回正确字段定义 |
| 13 | `POST /api/v1/knowledge/search` | 关键词搜索返回匹配分类 |

**测试文件**: `tests/test_chat_api.py`（新建）

**验收标准**:
- [ ] 13+ 测试用例全部通过
- [ ] 测试中使用 mock httpx（不要实际调用 DeepSeek API）
- [ ] contextId 不存在的场景不再抛 KeyError

---

### P0-05: U04 页面功能补全

**目标**: 当前 U04 页面是对话式界面的大框架，但部分交互细节缺失。

**需要补全的功能**:

| # | 功能 | 当前状态 | 需要做的 |
|:--:|------|---------|---------|
| 1 | 对话气泡中的 **IntentTag 渲染** | 页面只 import 了 ChatMessage、SkipButton、ContextSummary，但没看到 IntentTag 的集成 | 在意图确认气泡中嵌入 IntentTag 组件 |
| 2 | **字段追问渲染** | chatStore 中 fields 已传递，但页面未渲染字段追问的 UI | 渲染 FollowUpField 列表（输入框/选择按钮） |
| 3 | **消息自动滚动** | 新消息不会自动滚到底部 | 添加 useRef + scrollIntoView |
| 4 | **键盘事件** | 只能点按钮发送 | 添加 Enter 键发送、Shift+Enter 换行 |
| 5 | **U04 → U05 跳转** | "看结果"目前只是显示文本，不跳转 | skip 成功后跳转到 U05 并填充 Case data |
| 6 | **U04 旧表单入口** | 右上角需要"快速填表"链接 | 添加 `?mode=form` 链接 |
| 7 | **对话历史持久化** | 刷新页面聊天记录全丢 | 用 zustand persist 中间件存 localStorage |

**涉及文件**: `frontend/src/app/u04/page.tsx`, `frontend/src/components/chat/`

**验收标准**:
- [ ] 意图确认气泡包含置信度展示 + 确认/纠错按钮
- [ ] 追问字段以表单形式渲染
- [ ] 消息自动滚动到底部
- [ ] Enter 发送消息
- [ ] "快速填表"链接在右上角可见
- [ ] "直接看结果"后跳转到 U05

---

## 三、🟠 P1 — 重要增强

### P1-01: RAG 检索增强生成 pipeline（Phase 4 核心）

**目标**: 将 `data/raw/labor/` 下的 10 部法律原文 + `data/knowledge/labor/rules/` 20 条规则卡接入检索流程，实现"用户问题 → 检索相关法条 → LLM 生成回答"。

**需要做**:

| # | 任务 | 涉及 | 预估 |
|:--:|------|------|:----:|
| 1 | 安装向量库依赖（`chromadb` 或 `faiss-cpu`） | `requirements.txt` | 15min |
| 2 | 编写文本分块脚本：将 10 部法律原文按章节/条款切块 | `scripts/chunk_legal_texts.py` | 45min |
| 3 | 编写嵌入生成脚本：用 DeepSeek Embeddings 或 sentence-transformers 生成向量 | `scripts/generate_embeddings.py` | 1h |
| 4 | 构建向量索引：存储在本地文件（chroma 持久化目录） | `data/embeddings/` | 30min |
| 5 | 编写检索服务：`POST /api/v1/knowledge/search` 增强为语义检索 | `app/services/search_service.py` | 1h |
| 6 | 设计 RAG Prompt 模板：system prompt + 检索结果 context | `app/services/rag_prompts.py` | 30min |
| 7 | 修改 chat_service.py 的 `ask` 方法：在生成回复前先检索相关法条 | `app/services/chat_service.py` | 45min |
| 8 | 编写 RAG 效果测试脚本 | `tests/test_rag.py` | 30min |

**验收标准**:
- [ ] "公司拖欠工资 3 个月" 搜索能返回《劳动法》第五十条相关条款
- [ ] 回复中引用具体法条（带条文编号）
- [ ] 检索响应时间 < 2s
- [ ] 45 E2E 测试不降级

---

### P1-02: 深化知识图谱

**目标**: 当前知识图谱数据量还不够，需要大幅扩充。

**具体任务**:

| # | 内容 | 当前 | 目标 |
|:--:|------|:----:|:----:|
| 1 | 关键词从 558 → 3000+（每个分类平均 70+ 个） | 558 | 3000+ |
| 2 | 相关问法从 159 → 500+（每个分类至少 10 个问法） | 159 | 500+ |
| 3 | 字段定义精确映射：补充 enum 选项、验证规则、placeholder | 179 | 全覆盖+丰富 |
| 4 | excludeFrom 互斥关系完善：确保无歧义分类 | 21/42 | 全部覆盖 |
| 5 | relevantLaws 具体化：补充条款编号和具体条文内容 | 每条 1-2 条 | 每条 3-5 条+具体条文 |
| 6 | 新增分类：考虑增加"劳务报酬纠纷"、"实习期纠纷"、"退休返聘"等 | 42 | 50+ |

**涉及文件**: `data/knowledge/knowledge_graph.json`

**验收标准**:
- [ ] 关键词总数 >= 3000
- [ ] 相关问法总数 >= 500
- [ ] 每个分类至少 3 条 relevantLaws（含具体条款编号）
- [ ] 互斥关系配置无遗漏

---

### P1-03: 知识数据接入（规则卡 → 知识图谱联动）

**目标**: 现有 20 条规则卡（`data/knowledge/labor/rules/`）是建在，但知识图谱的意图识别结果没有触发规则卡的检索。

**任务**:
1. 创建 `app/services/rule_service.py`：加载 20 条规则卡的 YAML，建立 topic → rules 索引
2. 修改 `app/services/chat_service.py` 的 `skip_and_generate()`：在生成分析结果时检索并引用相关规则
3. 规则卡数据增强：从 20 条扩充到至少 50 条（覆盖所有 11 个一���分类）
4. 证据卡（12 种证据类型）接入：在追问中根据分类推荐需要收集的证据

**涉及文件**:
- `app/services/rule_service.py`（新建）
- `app/services/chat_service.py`（修改）
- `data/knowledge/labor/rules/`（扩充）

---

### P1-04: CI/CD 流水线

**目标**: 让 `.github/workflows/ci.yml` 真正跑起来。

**任务**:
1. 读取现有 `ci.yml`，检查语法错误和缺失的 step
2. 补充 workflow：`npm ci` → `npm test -- --run` → `npm run build`（前端）
3. 补充 workflow：`pip install` → `python -m pytest tests/`（后端）
4. 配置 GitHub Actions Secrets（如果有 API Key）
5. 推送测试，验证 Actions 正常触发

**涉及文件**: `.github/workflows/ci.yml`

---

### P1-05: 部署基础设施

**目标**: 让项目能在 CloudStudio / 服务器上真正跑起来。

**任务**:
1. 检查 `docker-compose.yml` 配置，补充 chat 服务
2. 创建 `.env.example`（说明需要配置的环境变量）
3. 创建 `Dockerfile`（前端 multi-stage build + 后端）
4. 创建生产启动脚本 `scripts/start_prod.sh`
5. 验证 `npm run build` 构建产物能 serve

**涉及文件**:
- `Dockerfile`（新建）
- `docker-compose.yml`（修改）
- `.env.example`（新建）
- `scripts/start_prod.sh`（新建）

---

## 四、🟡 P2 — 锦上添花

### P2-01: 多轮对话上下文管理（Phase 5）

**任务**:
1. 后端对话上下文持久化（使用 SQLite 或 JSON 文件，不必须上 PostgreSQL）
2. 上下文过期策略（TTL = 24h 后自动清理）
3. 支持对话历史回顾（`GET /api/v1/chat/history/{contextId}`）

**涉及文件**:
- `app/services/chat_service.py`（大改）
- `app/routers/chat.py`（新增历史接口）
- `data/chat_history/`（新建持久化目录）

---

### P2-02: 前端体验增强

**任务列表**:

| # | 任务 | 描述 |
|:--:|------|------|
| 1 | U04 输入框高度自适应 | auto-grow textarea |
| 2 | 消息时间分组 | 按日期分隔聊天记录 |
| 3 | 对话历史侧边栏 | 左侧显示历史对话列表 |
| 4 | 导出对话记录 | 聊天内容导出为 Markdown/PDF |
| 5 | 暗色模式支持 | 添加 dark mode toggle |
| 6 | 移动端适配 | U04 对话页面在手机上展示优化 |
| 7 | 键盘快捷键 | Ctrl+Enter 发送、Esc 关闭等 |
| 8 | 消息内 Markdown 渲染 | 链接、列表、加粗等格式支持 |
| 9 | 意图纠错 UI | 下拉选择其他分类 + 自由输入 |
| 10 | 律师端接入对话 | 律师能查看用户对话记录 |

---

### P2-03: 用户认证与权限

**任务**:
1. 用户注册/登录 API（`POST /api/v1/auth/register`, `/login`）
2. JWT Token 验证中间件
3. 前端登录页面
4. 用户信息 store（`userStore.ts`）
5. 区分匿名用户和登录用户

**涉及文件**: 大量新增文件

---

### P2-04: 案件 CRUD 持久化

**目标**: 当前所有案件数据存在 zustand + localStorage，刷新后不丢数据但无法跨设备同步。

**任务**:
1. 后端 `POST /api/v1/cases` 创建案件
2. 后端 `GET /api/v1/cases/:id` 获取案件
3. 后端 `PUT /api/v1/cases/:id` 更新案件
4. 后端 `DELETE /api/v1/cases/:id` 删除案件
5. 后端 `GET /api/v1/cases` 列表
6. 前端 store 适配：接口调用 + 本地缓存双写

---

## 五、📚 知识库持续扩充

### KB-01: 法律文本深度处理

将 `data/raw/labor/` 下的 10 部法律原文结构化：

| 文件 | 法律名称 | 处理方式 |
|------|---------|---------|
| `labor_contract_law_2012_full.txt` | 劳动合同法 | 按章/条/款分节 → JSON |
| `labor_contract_regulation_2008_full.txt` | 劳动合同法实施条例 | 同上 |
| `labor_law_2018_full.txt` | 劳动法 | 同上 + 标记重点条款 |
| `social_insurance_law_2018_full.txt` | 社会保险法 | 同上 |
| `minimum_wage_regulation_2004_full.txt` | 最低工资规定 | 同上 |
| `wage_arrears_criminal_interpretation_2013_full.txt` | 拒不支付劳动报酬司法解释 | 同上 |
| `labor_dispute_mediation_law_2007_full.txt` | 劳动争议调解仲裁法 | 同上 |
| `labor_supervision_regulation_2004_full.txt` | 劳动保障监察条例 | 同上 |
| `migrant_worker_wage_regulation_2019_full.txt` | 保障农民工工资支付条例 | 同上 |
| `labor_dispute_interpretation_1_2020_full.txt` | 劳动争议司法解释一 | 同上 |

**输出**: `data/knowledge/labor/laws/` 目录下每个法律一个 JSON 文件，包含 `{lawId, title, chapters: [{chapterNo, title, articles: [{articleNo, content, keywords[], relatedTopics[]}]}]}`

---

### KB-02: 规则卡扩充

从 20 条扩展到至少 80 条规则卡：

| 分类 | 当前 | 目标 |
|------|:----:|:----:|
| 工资报酬 | 5 | 15 |
| 劳动合同 | 4 | 15 |
| 辞退裁员 | 3 | 12 |
| 社保福利 | 2 | 10 |
| 工伤赔偿 | 2 | 8 |
| 休息休假 | 1 | 5 |
| 其他 | 3 | 15 |
| **合计** | **20** | **80** |

每条规则卡需包含：法律原文引用、适用条件、法律效果、例外情形、所需事实、关联证据、关联程序。

---

### KB-03: 案例卡建设

创建案例卡来支撑"类似案例"推荐：

| 维度 | 内容 |
|------|------|
| 数量 | 首批 30 个典型案例 |
| 来源 | 最高法指导案例 + 各地劳动仲裁典型案例 |
| 结构 | `{caseId, title, summary, category, keyPoints, judgment, laws, date, court}` |
| 存储 | `data/knowledge/labor/cases/` |

---

### KB-04: 证据链推理

为目标分类构建"证据链推理规则"——如果用户说"A"，需要检查是否有"B"证据：

例如：欠薪场景
- 如果用户说"公司没发工资" → 需要收集：劳动合同（证明关系）+ 工资条（证明金额）+ 银行流水（证明未收到）+ 考勤记录（证明出勤）
- 如果缺少某项 → 追问建议收集方式

**输出**: `data/knowledge/labor/evidence-chain.json`

---

## 六、执行顺序建议

```
晚上开始执行顺序（依赖关系驱动）：

┌────────────────────────────────────────────────────┐
│  第一步：修核心链路（P0-01 → P0-05）              │
│  这是地基，不修好后面所有测试都测不了             │
│  预期: 2-3 小时                                    │
├────────────────────────────────────────────────────┤
│  第二步：补测试（P0-02 → P0-03 → P0-04）          │
│  修好链路后立刻写测试锁定质量                     │
│  预期: 2-3 小时                                    │
├────────────────────────────────────────────────────┤
│  第三步：知识库扩充（KB-01 → KB-02 → KB-03）      │
│  可选在测试运行时并行进行，不阻塞其他任务          │
│  预期: 2-3 小时                                    │
├────────────────────────────────────────────────────┤
│  第四步：RAG Pipeline（P1-01 → P1-03）            │
│  核心功能增强，需前面都就绪                        │
│  预期: 2-3 小时                                    │
├────────────────────────────────────────────────────┤
│  第五步：CI/CD + 部署（P1-04 → P1-05）            │
│  收尾工作，确保交付                               │
│  预期: 1-2 小时                                    │
└────────────────────────────────────────────────────┘
```

---

## 七、常见问题速查

### 启动命令
```powershell
# 后端
cd D:\4.开发工具\legal_ai_lab
uvicorn app.main:app --reload --port 8000

# 前端（另一个终端）
cd D:\4.开发工具\legal_ai_lab\frontend
npm run dev

# 测试
cd D:\4.开发工具\legal_ai_lab\frontend
npm test -- --run

# 后端 E2E 测试（需先启动后端）
cd D:\4.开发工具\legal_ai_lab
python tests/test_api_e2e.py
```

### API Key
- 路径: `D:\4.开发工具\legal_ai_lab\api key.txt`
- 内容: `sk-0afad2bc0acb439cbaccfe58fe1f9c13`
- Model: `deepseek-chat` (Pro)
- Endpoint: `https://api.deepseek.com/v1/chat/completions`

### 关键文件总览

| 文件 | 说明 |
|------|------|
| `app/services/chat_service.py` | Chat 核心服务（意图识别、对话管理、跳过） |
| `app/services/knowledge_service.py` | 知识图谱加载与查询 |
| `app/services/chat_prompts.py` | LLM Prompt 模板 + few-shot |
| `app/routers/chat.py` | 3 个 API 端点 |
| `app/routers/knowledge.py` | 4 个 API 端点 |
| `data/knowledge/knowledge_graph.json` | 42 分类知识图谱（52KB） |
| `frontend/src/lib/chatStore.ts` | 对话状态管理 |
| `frontend/src/lib/api.ts` | API 客户端 |
| `frontend/src/app/u04/page.tsx` | 对话式咨询页面（核心页面） |
| `frontend/src/app/page.tsx` | 首页入口 |
| `frontend/src/components/chat/` | 6 个对话组件 |

### 已知的限制
1. DeepSeek API 超时时间 30s，网络不好时会降级到关键词匹配
2. 后端对话上下文存储在内存中，重启后丢失
3. 知识图谱 JSON 手动编辑，修改后需重启后端
4. 目前没有用户认证，所有数据在 localStorage
5. 前端没有持久化聊天记录（刷新丢失）
6. U04 页面还有部分交互未完成（见 P0-05）
