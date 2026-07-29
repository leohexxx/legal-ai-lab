# Legal AI Lab — 项目文件关系全图

> **生成时间**: 2026-07-28 | **仓库**: `leohexxx/legal-ai-lab`
>
> 本文档完整梳理项目的目录结构、文件职责、前后依赖关系，帮助你快速理解"这份代码/文档是干嘛的、连着什么、对接谁"。

---

## 一、总体架构

```
┌────────────────────────────────────────────────────────────────────────┐
│                         LEGAL AI LAB                                   │
│               AI 驱动的欠薪纠纷法律助手                                   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
   │   01-产品规划     │   │   02-知识工程    │   │   03-AI 技术    │
   │   (Vision/Product)│   │   (Legal/Data)  │   │   (AI Stack)   │
   └─────────────────┘   └─────────────────┘   └─────────────────┘
            │                       │                       │
            └───────────┬───────────┘                       │
                        ▼                                   │
               ┌─────────────────┐                          │
               │   FASTAPI 后端  │◄─────────────────────────┘
               │   (app/)        │
               └────────┬────────┘
                        │ (REST API)
                        ▼
               ┌─────────────────┐
               │  NEXT.JS 前端   │
               │   (frontend/)  │
               └─────────────────┘
```

---

## 二、根目录文件

| 文件 | 职责 | 依赖 / 关联 |
|------|------|-------------|
| `README.md` | 项目简介，启动说明 | 入口文档 |
| `PROJECT_MAP.md` | **本文档** — 项目文件关系全图 | 所有目录 |
| `overview.md` | AI 自动生成的会话概览 | 工作日志 |
| `docker-compose.yml` | Docker 编排（PostgreSQL 等基础设施） | `docker/init-db.sql` |
| `.env.example` | 环境变量模板 | `app/config.py` 读取 |
| `.gitignore` | Git 忽略规则 | — |
| `.github/workflows/ci.yml` | GitHub CI 流水线 | `frontend/`, `app/` |
| `.pre-commit-config.yaml` | 本地 pre-commit 钩子 | — |

---

## 三、产品 & 战略层 (`00-Vision/` + `01-Product/`)

### 3.1 愿景层 (`00-Vision/`)

```
00-Vision/
├── Mission.md                              # 项目使命宣言
├── Roadmap.md                              # 产品路线图（阶段规划）
├── Global_Product_Strategy_and_Execution_Plan.md  # 全局产品执行计划
├── Strategy_and_Knowledge_Engineering.md   # 知识工程战略设计
├── Software_Development_Team_SOP.md        # 开发团队 SOP（角色定义）
└── UI设计师提示词.md                        # UI 设计师 prompt
```

**依赖关系**: 顶层规划 → 所有下游文档及代码

### 3.2 产品层 (`01-Product/`)

```
01-Product/
├── PRD.md                                  # 主 PRD（产品需求文档）
├── Product_Positioning.md                  # 产品定位
├── User_Personas.md                        # 用户画像
├── User_Flow.md                            # 用户流程图
├── Frontend_Requirements_Specification.md  # 前端需求规格说明书
├── Frontend_Delivery_Slices_S1_to_S5.md    # 前端分片交付计划（S1-S5）
├── Implementation_and_Acceptance_Checklists.md  # 实施与验收清单
├── Wage_Arrears_Intake_Schema.md           # 欠薪信息采集数据字典
└── 产品管理专家提示词.md                    # 产品经理 prompt
```

**依赖关系**: `PRD.md` ← `User_Personas.md` / `Product_Positioning.md`; `Frontend_Delivery_*` ← `PRD.md`; `Wage_Arrears_Intake_Schema.md` → `frontend/src/lib/types.ts`（IntakeData 接口）

---

## 四、知识 & 数据层 (`02-` ~ `08-`)

### 4.1 法律知识 (`02-Legal-Knowledge/`)

```
02-Legal-Knowledge/
├── Labor_Law.md                            # 劳动法核心知识
├── Civil_Law.md                            # 民法关联知识
├── Contract_Law.md                         # 合同法关联知识
├── Legal_Cases/README.md                   # 案例库说明
├── README.md                               # 知识库总览
├── 法律技能治理专家_技信衡.md               # 法律治理专家 prompt
└── 法律检索专家_法检Pro.md                  # 法律检索专家 prompt
```

### 4.2 AI 技术 (`03-AI-Technology/`)

```
03-AI-Technology/
├── AI_Stack.md                             # AI 技术栈选型
├── Agent.md                                # Agent 架构设计
├── RAG.md                                  # RAG（检索增强生成）设计
├── Hybrid_Retrieval_Design.md              # 混合检索方案
├── Prompt_Engineering.md                   # Prompt 工程指南
├── Vector_Database.md                      # 向量数据库设计
└── README.md                               # 总览
```

**依赖关系**: `RAG.md` + `Vector_Database.md` → `Hybrid_Retrieval_Design.md` → `app/knowledge/registry.py`（知识检索实现）

### 4.3 数据集 (`04-Data-Assets/`)

```
04-Data-Assets/
├── README.md                               # 总览
├── Case_Dataset/README.md                  # 案例数据集说明
├── FAQ_Dataset/README.md                   # FAQ 数据集说明
└── Law_Dataset/README.md                   # 法律法规数据集说明
```

### 4.4 原型 & 验证 (`05-MVP/`)

```
05-MVP/
├── Prototype.md                            # 原型设计
├── Prototype_0_Script.md                   # Prototype-0 运行脚本
├── Demo_Record.md                          # 演示记录
├── Simulation_Report_TC01.md               # 仿真测试报告
└── Test_Cases.md                           # 测试用例
```

### 4.5 商业 & 合作 (`06-Business/` + `07-Partners/`)

```
06-Business/
├── Business_Model.md                       # 商业模式
├── Competitor_Analysis.md                  # 竞品分析
├── Funding_Plan.md                         # 融资计划
└── Global_Legal_AI_Competitive_Analysis.md # 全球法律 AI 竞争格局

07-Partners/
├── Lawyer_Network.md                       # 律师网络
├── University_Resources.md                 # 高校资源
└── README.md                               # 总览
```

### 4.6 研究 (`08-Research/`)

```
08-Research/
├── README.md                               # 总览
└── Papers/README.md                        # 论文库说明
```

---

## 五、数据存储 (`data/`)

```
data/
├── README.md                               # 总览
│
├── raw/                                    # 原始法律文本（10 部法律法规）
│   ├── README.md
│   └── labor/
│       ├── labor_law_2018_full.txt         # 劳动法
│       ├── labor_contract_law_2012_full.txt # 劳动合同法
│       ├── labor_contract_regulation_2008_full.txt
│       ├── labor_dispute_mediation_law_2007_full.txt
│       ├── labor_dispute_interpretation_1_2020_full.txt
│       ├── labor_supervision_regulation_2004_full.txt
│       ├── migrant_worker_wage_regulation_2019_full.txt
│       ├── minimum_wage_regulation_2004_full.txt
│       ├── social_insurance_law_2018_full.txt
│       └── wage_arrears_criminal_interpretation_2013_full.txt
│
├── normalized/                             # 标准化数据目录
│   └── README.md
│
└── knowledge/                              # 结构化知识库
    ├── README.md
    ├── legal_ontology.yaml                 # 法律本体（顶层概念关系）
    ├── source_whitelist.yaml               # 可信来源白名单
    │
    └── labor/                              # 劳动法领域知识
        ├── INDEX.md                        # 索引
        ├── evidence/                       # 证据类型知识（12 种）
        │   ├── ev_labor_contract.yaml
        │   ├── ev_pay_slip.yaml
        │   ├── ev_bank_statement.yaml
        │   ├── ev_chat_record.yaml
        │   ├── ev_attendance_record.yaml
        │   ├── ev_clock_in_record.yaml
        │   ├── ev_work_badge.yaml
        │   ├── ev_work_email.yaml
        │   ├── ev_audio_video.yaml
        │   ├── ev_witness.yaml
        │   ├── ev_social_insurance_record.yaml
        │   └── ev_payroll_account.yaml
        ├── procedures/                     # 维权程序（7 种）
        │   ├── proc_negotiation.yaml       #   协商
        │   ├── proc_mediation.yaml         #   调解
        │   ├── proc_labor_supervision.yaml #   劳动监察
        │   ├── proc_payment_order.yaml     #   支付令
        │   ├── proc_labor_arbitration.yaml #   劳动仲裁
        │   ├── proc_final_arbitration.yaml #   终局裁决
        │   └── proc_court_litigation.yaml  #   法院诉讼
        └── rules/                          # 法律规则（20 条）
            ├── rule_001.yaml ~ rule_020.yaml
```

**依赖关系**:
- `raw/labor/*.txt` → 知识工程原始素材
- `knowledge/labor/rules/` 和 `evidence/` 和 `procedures/` → `app/knowledge/registry.py`（加载到知识库）
- `knowledge/legal_ontology.yaml` → 所有知识卡片的上层本体

---

## 六、后端 (`app/` — FastAPI)

```
app/
├── __init__.py                             # 包初始化
├── main.py                                 # 应用入口（create_app）
├── config.py                               # 配置管理（pydantic-settings）
│
├── knowledge/                              # 知识库模块
│   ├── __init__.py
│   └── registry.py                         # 知识注册表（加载 data/knowledge/）
│
├── models/__init__.py                      # 数据模型（ORM，预留）
│
├── schemas/                                # Pydantic Schema / JSON Schema
│   ├── __init__.py
│   ├── case.py                             # 案件 schema
│   ├── evidence.py                         # 证据 schema
│   ├── procedure.py                        # 程序 schema
│   ├── rule.py                             # 规则 schema
│   ├── scenario.py                         # 场景 schema
│   ├── source.py                           # 来源 schema
│   └── json_schemas/                       # JSON Schema 定义（知识卡片）
│       ├── case_card.json
│       ├── evidence_card.json
│       ├── legal_rule_card.json
│       ├── procedure_card.json
│       ├── scenario_card.json
│       └── source_registry.json
│
├── routers/                                # API 路由
│   ├── __init__.py
│   └── health.py                           # 健康检查端点
│
└── services/__init__.py                    # 业务服务层（预留）
```

**架构说明**:
```
main.py
  └── create_app()
        ├── config.py          ← 读取 .env / 环境变量
        ├── routers/health.py  ← GET /api/v1/health
        ├── knowledge/registry.py  ← 加载 data/knowledge/
        └── schemas/           ← 数据校验层
```

---

## 七、前端 (`frontend/` — Next.js 16)

### 7.1 项目配置

```
frontend/
├── package.json                   # 依赖管理 & 启动脚本
├── package-lock.json              # 依赖锁定
├── next.config.ts                 # Next.js 配置
├── tsconfig.json                  # TypeScript 配置
├── vitest.config.ts               # Vitest 测试配置
├── eslint.config.mjs              # ESLint 配置
├── postcss.config.mjs             # PostCSS 配置（Tailwind）
└── next-env.d.ts                  # Next.js 类型声明
```

**依赖包** (package.json):
- `next`, `react`, `react-dom` — 框架核心
- `zustand` — 全局状态管理
- `tailwindcss`, `postcss`, `autoprefixer` — CSS 框架
- `geist` — Google 字体
- **devDeps**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@types/react`, `eslint`

### 7.2 共享层

```
src/
├── lib/
│   ├── types.ts                  ★ 核心数据模型（10 个接口 + CaseState 根对象）
│   ├── store.ts                  ★ Zustand 全局状态（persist + 10 个数据域）
│   └── lawyers.ts                ★ 律师数据生成（mock 数据工厂）
│
├── components/
│   ├── LoadingSkeleton.tsx        ★ 加载骨架屏（8 种变体）
│   ├── EmptyState.tsx             ★ 空状态组件（3 种变体）
│   └── ErrorState.tsx             ★ 错误状态组件（3 种严重级别）
```

**依赖关系**:
```
types.ts ← 前端所有页面 import
    │
    ├── store.ts ← 所有页面读取/写入数据
    │     └── 持久化到 localStorage
    │
    ├── LoadingSkeleton.tsx ← U05~U13 页面使用
    ├── EmptyState.tsx      ← U05~U13 页面使用
    └── ErrorState.tsx      ← U05~U13 页面使用
```

### 7.3 页面路由 (Next.js App Router)

| 路由 | 文件 | 功能 | 数据域 |
|------|------|------|--------|
| `/` | `page.tsx` | 首页/落地页 | — |
| `/u02` | `u02/page.tsx` | 案件概览 Dashboard | caseInfo, facts, money |
| `/u03` | `u03/page.tsx` | 案件信息填写 | caseInfo |
| `/u04` | `u04/page.tsx` | 欠薪信息采集表单 | intakeData |
| `/u05` | `u05/page.tsx` | 案件事实清单 | facts, factVersions |
| `/u06` | `u06/page.tsx` | 案件详情分析 | 全数据域 |
| `/u07` | `u07/page.tsx` | 金额明细 | moneyItems |
| `/u08` | `u08/page.tsx` | 时间线 | timelineEvents |
| `/u09` | `u09/page.tsx` | 证据清单 | evidenceItems |
| `/u10` | `u10/page.tsx` | 法律来源 | sources |
| `/u11` | `u11/page.tsx` | 风险评估 | risks |
| `/u12` | `u12/page.tsx` | 行动方案 | actionPlans |
| `/u13` | `u13/page.tsx` | 案件报告导出 | 全数据域汇总 |
| `/u14` | `u14/page.tsx` | 待办任务 | todos |
| `/u15` | `u15/page.tsx` | (预留) | — |
| `/u16` | `u16/page.tsx` | (预留) | — |
| `/lawyer` | `lawyer/page.tsx` | 律师工作台首页 | — |
| `/lawyer/cases/[id]/page.tsx` | 律师-案件详情 | — |
| `/lawyer/cases/[id]/evidence/page.tsx` | 律师-证据审查 | — |
| `/lawyer/cases/[id]/opinion/page.tsx` | 律师-法律意见 | — |

**页面前后关系**:
```
/ (首页) → /u02 (Dashboard) → /u03 (案件信息) → /u04 (信息采集)
                                                       │
                                                       ▼
                                              /u05 (事实清单)
                                                       │
                                                       ▼
                                              /u06 (案件分析)
                                            ┌──────┼──────┐
                                            ▼      ▼      ▼
                                       /u07  /u08  /u09
                                       (金额) (时间线) (证据)
                                            │      │      │
                                            ▼      ▼      ▼
                                       /u10  /u11  /u12
                                       (法源)  (风险) (方案)
                                            │      │      │
                                            └──────┼──────┘
                                                   ▼
                                              /u13 (报告)
                                              /u14 (待办)

/lawyer (律师台) → /lawyer/cases/[id] → /evidence → /opinion
```

### 7.4 测试文件

```
src/__tests__/
├── setup.ts                         ★ 测试环境（jest-dom 扩展）
├── store.test.ts                    ★ Store 单元测试（34 条）
├── LoadingSkeleton.test.tsx         ★ 骨架屏组件测试（10 条）
├── EmptyState.test.tsx              ★ 空状态组件测试（9 条）
├── ErrorState.test.tsx              ★ 错误状态组件测试（11 条）
├── lawyers.test.ts                  ★ 律师数据函数测试（10 条）
└── pages.smoke.test.tsx             ★ 全页面冒烟测试（20 条）
```

**测试覆盖关系**:
```
store.test.ts       → store.ts + types.ts
LoadingSkeleton     → LoadingSkeleton.tsx
EmptyState.test.tsx → EmptyState.tsx
ErrorState.test.tsx → ErrorState.tsx
lawyers.test.ts     → lawyers.ts
pages.smoke.test.tsx→ 所有 pages/*.tsx（4 条律师页 + 16 条主流程页）
```

---

## 八、LLM 上下文层 (`99-LLM-Context/`)

专为 AI 模型（包括 LLM Cursor/Claude 等）设计的上下文包，让新接入的 AI 快速理解项目。

```
99-LLM-Context/
├── README.md                         # 总览（Context 包入口）
├── 01-Prompt-Directory.md            # Prompt 文件索引
├── 02-Shared-Foundation.md           # 共享基础（项目共识 + 协作规则）
├── 03-Operation-Guide.md             # 操作指南（开发/测试/部署命令）
├── 04-Cross-Reference.md             # 跨文件交叉引用
├── 05-Onboarding-Prompt.md           # 给新 AI 的引导 Prompt
├── 06-Implementation-Report.md       # S2 实现报告（store + 页面实现）
├── 07-State-Governance-Report.md     # 状态治理报告（加载/空/错误态实现）
└── 08-Test-Report.md                 # 测试报告（94 条全通过）
```

**依赖关系**: 所有 `99-LLM-Context/*` 文件 ← 其他所有目录（它们是其他目录的摘要和导航）

---

## 九、基础设施 (`docker/` + 根配置)

```
docker/
└── init-db.sql                       # PostgreSQL 初始化 DDL

docker-compose.yml                    # 容器编排
.github/workflows/ci.yml              # CI 流水线
.pre-commit-config.yaml               # pre-commit 钩子
```

---

## 十、文件依赖图（核心数据流）

```
┌─────────────────────────────────────────────────────────────────────┐
│                        数据流与文件依赖                                 │
│                                                                     │
│  data/raw/labor/*.txt ───────────┐                                  │
│                                  ▼                                  │
│  data/knowledge/ ──────────→ app/knowledge/registry.py              │
│  ├── legal_ontology.yaml          │                                 │
│  ├── labor/evidence/*             │ (知识加载)                       │
│  ├── labor/procedures/*           ▼                                 │
│  └── labor/rules/*          app/schemas/* (数据校验)                │
│                                  │                                   │
│                           FastAPI 应用                                │
│                           ───────────                                │
│                           app/main.py                                │
│                              │                                       │
│                              │ (REST API)                            │
│                              ▼                                       │
│  frontend/src/lib/types.ts ←──┘ (共享数据模型)                       │
│                    │                                                 │
│                    ▼                                                 │
│  frontend/src/lib/store.ts (Zustand + persist)                      │
│           ┌───────┼───────────┬───────────┐                         │
│           ▼       ▼           ▼           ▼                         │
│     Loading      Empty     Error     Pages/*.tsx                    │
│   Skeleton.tsx  State.tsx  State.tsx  (U02~U14)                    │
│   (骨架屏)      (空态)      (错误态)    + lawyer/*                  │
│                                             │                       │
│                                             ▼                       │
│                                   frontend/src/__tests__/*          │
│                                   (Vitest 94 条全通过)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 十一、Git 分支与提交历史

| 提交 | 说明 |
|------|------|
| `cbe2923` | Initial commit |
| `fc29f79` | 初始化 Legal AI Lab 产品与研究资料库 |
| `d98ae05` | 补充法律知识工程战略设计 |
| `ded13d7` | Phase 0 — 后端骨架 + 数据基础设施 + 评估框架 |
| `28789c2` | 10 部劳动法原始文本 + 39 张知识卡片 |
| `873950f` | 混合检索设计 + prototype-0 脚本 + 仿真报告 |
| `09c1b51` | 全球法律 AI 竞争分析 + 前端计划文档 |
| `47fb1fd` | **S1 交付** — 前端 6 页面 (U01~U06) |
| `a7cb206` | **S2-S5 交付** — 全部前端页面 + LLM Context 体系 |
| `f82ae24` | **当前** — Vitest 测试套件 + 状态组件 + 测试报告 |

---

## 十二、快速定位指南

| 想找什么 | 去哪个文件 |
|----------|-----------|
| 项目整体是做什么的 | `README.md` + `00-Vision/Mission.md` |
| 产品功能需求 | `01-Product/PRD.md` |
| 前端什么页面什么功能 | `frontend/src/app/*/page.tsx`（见上方路由表）|
| 数据模型定义 | `frontend/src/lib/types.ts` |
| 状态管理逻辑 | `frontend/src/lib/store.ts` |
| 后端 API | `app/routers/` + `app/main.py` |
| 知识数据结构 | `data/knowledge/` 下各 YAML 文件 |
| 法律原始文本 | `data/raw/labor/*.txt` |
| 测试用例 | `frontend/src/__tests__/*` |
| 新 AI 快速上手 | `99-LLM-Context/README.md` 开始 |
| 项目交付进度 | `01-Product/Frontend_Delivery_Slices_S1_to_S5.md` |

---

> **维护提示**: 新增文件时请同步更新此文档的目录树和相关依赖描述。
