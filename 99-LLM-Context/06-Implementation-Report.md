# 06 — 前端实现状态报告（Implementation Report）

> 项目 S1–S5 前端全量实现说明。
> 供后续 AI 模型快速了解当前代码状态、数据架构、已完成/未完成工作。

---

## 1. 总体进度

| 切片 | 范围 | 页面数 | 核心目标 | 状态 |
|:----:|:----:|:------:|----------|:----:|
| **S1** | U01–U06 | 6 | 可点击原型，信息架构验证 | ✅ 完成 |
| **S2** | U03–U08 | 6（4改+2新） | 欠薪事实闭环，接入数据流 | ✅ 完成 |
| **S3** | U09–U12 | 4 | 证据、来源和风险 | ✅ 完成 |
| **S4** | U13–U15 | 3 | 交付和数据控制 | ✅ 完成 |
| **S5** | U16 + L01–L04 | 5 | 律师承接 | ✅ 完成 |
| **合计** | | **20** | | ✅ **全量构建通过** |

---

## 2. 完整路由表

```
○ /                         (U01 首页)
○ /u02                      (U02 服务边界与隐私同意)
○ /u03                      (U03 领域、地区与目标确认)    ← 写入 store
○ /u04                      (U04 引导式事实采集)           ← 写入 store
○ /u05                      (U05 事实摘要确认)             ← 读写 store
○ /u06                      (U06 案件工作台总览)           ← 读取 store
○ /u07                      (U07 欠薪金额明细)             ← 读取 store CRUD
○ /u08                      (U08 时间线)                   ← 读取 store CRUD
○ /u09                      (U09 证据中心)                 ← 读取 store CRUD
○ /u10                      (U10 法律依据与来源)            ← 读取 store
○ /u11                      (U11 风险与案件准备度)          ← 读取 store
○ /u12                      (U12 行动方案与任务)            ← 读取 store CRUD
○ /u13                      (U13 报告、导出和分享)
○ /u14                      (U14 历史案件)
○ /u15                      (U15 数据、授权和删除)
○ /u16                      (U16 律师帮助与转交)
○ /lawyer                   (L01 律师案件队列)
ƒ /lawyer/cases/[id]        (L02 律师案件审阅)
ƒ /lawyer/cases/[id]/evidence  (L03 证据和来源对照)
ƒ /lawyer/cases/[id]/opinion   (L04 补充请求和律师意见)
```

> ○ = 静态页面 ｜ ƒ = 动态路由（服务端渲染）

---

## 3. 数据架构

### 3.1 核心文件

| 文件 | 作用 |
|------|------|
| `frontend/src/lib/types.ts` | 所有 TypeScript 类型定义（15+ 数据模型 + 标签映射 + 工具函数） |
| `frontend/src/lib/store.ts` | Zustand 全局 store + localStorage 持久化 + 演示数据 |
| `frontend/src/lib/lawyers.ts` | 模拟律师数据库（8 人，7 城，含筛选函数） |

### 3.2 数据模型（types.ts）

```
Case          案件基本信息
Party         主体（员工/公司/合同方/实际管理方）
FactItem      事实项（含状态机）
FactVersion   事实版本（锁定分析依据）
MoneyItem     工资明细（逐月）
TimelineEvent 时间线事件
EvidenceItem  证据项
Source        法律来源
RiskFactor    风险维度
ActionPlan    行动方案
TodoItem      待办任务
IntakeData    采集表单数据
CaseState     Store 根状态（聚合所有模型）
```

### 3.3 事实状态机

每个 `FactItem.status` 有 4 种状态：

| 状态 | 含义 | 前端视觉 |
|:----:|------|----------|
| `confirmed` | 用户明确确认 | 绿色实色标签 |
| `pending` | 已记录但未确认 | 琥珀色提示标签 |
| `inferred` | AI 推断 | 蓝色虚线标签 |
| `contradiction` | 信息冲突 | 红色警告标签 |

### 3.4 数据流路径

```
U01(输入描述)
  → U03(选择领域/地区/目标)  → store.setCaseInfo()
    → U04(8步引导采集)       → store.setIntakeData() + store.setFacts()
      → U05(事实确认)        → store.setFacts() + store.confirmAllFacts()
        → U06(案件工作台)    → store 读取所有数据
          ├→ U07(金额明细)   → store.moneyItems CRUD
          ├→ U08(时间线)     → store.timelineEvents CRUD
          ├→ U09(证据中心)   → store.evidenceItems CRUD
          ├→ U10(法律来源)   → store.sources 读取
          ├→ U11(风险评估)   → store.risks 读取
          ├→ U12(行动方案)   → store.actionPlans + store.todos CRUD
          ├→ U13(报告导出)   → store 读取全量数据生成报告
          ├→ U15(数据控制)   → 删除/导出操作
          └→ U16(律师转交)   → lawyers.ts 匹配 + 转交流程
```

所有数据经过 `zustand/middleware` 的 `persist` 自动同步到 `localStorage`，刷新不丢失。

---

## 4. 各页面功能清单

### S1 — 基础原型

| 页面 | 核心功能 | 技术实现 |
|:----:|---------|----------|
| **U01** 首页 | 自由描述输入、6 常见场景、紧急提示、继续已有案件检测 | `useState` + `useCaseStore` 检测 |
| **U02** 隐私同意 | 6 项分项确认、详情展开、拒绝可退出 | 本地 `useState` |
| **U03** 领域/地区 | 领域选择、省市区三级 + 其他输入、目标分类、紧急标记 | `setCaseInfo()` → store |
| **U04** 引导采集 | 8 步流程（用工→状态→合同→工资→欠薪→证据→行动→汇总） | `setIntakeData()` + `setFacts()` → store |
| **U05** 事实确认 | 已确认/待确认/AI推断/矛盾 4 分区、逐条编辑 | 读/写 `store.facts` |
| **U06** 工作台 | 案件信息、风险维度、待办、7 Tab 导航串联全部页面 | 读 `store.caseInfo/facts/todos` |

### S2 — 欠薪事实闭环

| 页面 | 核心功能 | 技术实现 |
|:----:|---------|----------|
| **U07** 金额明细 | 逐月应付/实付/差额、工资构成拆分、新增/编辑/删除、自动重算 | `store.moneyItems` CRUD |
| **U08** 时间线 | 列表/时间轴双视图、6 组事件过滤、新增/编辑/删除、年份分组 | `store.timelineEvents` CRUD |

### S3 — 证据、来源和风险

| 页面 | 核心功能 | 技术实现 |
|:----:|---------|----------|
| **U09** 证据中心 | 按状态分组（已有/缺失/解析中/失败）、新增/删除证据 | `store.evidenceItems` CRUD |
| **U10** 法律来源 | 来源卡（机关/条款/效力/日期）、可展开详情、效力色标 | `store.sources` 读取 |
| **U11** 风险评估 | 7 维度网格 + 进度条、总体准备度百分比 | `store.risks` 读取 |
| **U12** 行动方案 | 4 方案卡片、待办列表勾选/新增/优先级排序 | `store.actionPlans` + `store.todos` CRUD |

### S4 — 交付和数据控制

| 页面 | 核心功能 | 技术实现 |
|:----:|---------|----------|
| **U13** 报告导出 | 11 节可折叠报告、PDF/MD/HTML 导出占位、分享链接 | store 读取 + 模拟 |
| **U14** 历史案件 | 8 条模拟数据、搜索/状态筛选、继续/归档 | 本地 MOCK 数组 |
| **U15** 数据控制 | 同意记录 6 条、三级删除（文件/案件/账户）、确认弹窗 | 模拟 + 确认交互 |

### S5 — 律师承接

| 页面 | 核心功能 | 技术实现 |
|:----:|---------|----------|
| **U16** 律师转交 | 4 步流程（选择服务→匹配律师→转交预览→完成）、8 律师匹配 | `lawyers.ts` + `filterLawyers()` |
| **L01** 案件队列 | 律师案件列表、状态筛选、完整度进度条、紧急标记 | MOCK 数组 |
| **L02** 案件审阅 | 三栏布局（目录/内容/批注）、事实/金额/时间线展示 | store 读取 |
| **L03** 证据对照 | 事实↔证据↔来源三列交叉对照、充分度标记 | store 读取 + 关联展示 |
| **L04** 律师意见 | 补充提问/律师意见双 Tab、版本管理、发布/草稿 | 模拟 + 本地状态 |

---

## 5. Store 接口速查（useCaseStore）

```typescript
// 案件基本信息
setCaseInfo(info: Case) → void
updateCaseInfo(partial: Partial<Case>) → void

// 事实
setFacts(facts: FactItem[]) → void
updateFact(id: string, partial: Partial<FactItem>) → void
confirmAllFacts() → void

// 金额明细
setMoneyItems(items: MoneyItem[]) → void
addMoneyItem(item: MoneyItem) → void
updateMoneyItem(id: string, partial: Partial<MoneyItem>) → void
removeMoneyItem(id: string) → void

// 时间线
setTimelineEvents(events: TimelineEvent[]) → void
addTimelineEvent(event: TimelineEvent) → void
updateTimelineEvent(id: string, partial: Partial<TimelineEvent>) → void
removeTimelineEvent(id: string) → void

// 证据
setEvidenceItems(items: EvidenceItem[]) → void
addEvidenceItem(item: EvidenceItem) → void
updateEvidenceItem(id: string, partial: Partial<EvidenceItem>) → void
removeEvidenceItem(id: string) → void

// 法律来源 / 风险 / 行动方案（批量设置）
setSources(sources: Source[]) → void
setRisks(risks: RiskFactor[]) → void
setActionPlans(plans: ActionPlan[]) → void

// 待办
setTodos(todos: TodoItem[]) → void
addTodo(todo: TodoItem) → void
toggleTodo(id: string) → void

// 采集数据
setIntakeData(data: IntakeData) → void

// 重置
resetCase() → void

// 初始化演示数据（外部函数）
initDemoCase() → void
```

---

## 6. 设计 Token

```css
--primary:        #534AB7   /* 主色 — 按钮、链接、活动状态 */
--primary-light:  #EEEDFE   /* 主色浅色 — 选中背景 */
--primary-mid:    #AFA9EC   /* 主色中色 — 装饰 */
--accent:         #1D9E75   /* 强调色 — 成功、确认 */
--accent-light:   #E1F5EE   /* 强调色浅色 */
--danger:         #E24B4A   /* 危险色 — 删除、错误 */
--danger-light:   #FCEBEB
--warning:        #EF9F27   /* 警告色 — 待确认、估算 */
--warning-light:  #FAEEDA
```

---

## 7. 模拟律师库

**文件**: `src/lib/lawyers.ts`

```typescript
interface Lawyer {
  id: string;              // L001-L008
  name: string;            // 姓名
  firm: string;            // 律所
  city: string;            // 所在城市
  specialties: string[];   // 专长领域
  yearsOfExperience: number;
  rating: number;          // 1-5
  caseCount: number;
  feeRange: { min: number; max: number };  // 咨询费范围
  availability: "available" | "busy" | "unavailable";
  bio: string;
  successRate: number;
  responseTime: string;
}

// 工具函数
getLawyerById(id: string): Lawyer | undefined
filterLawyers(params: { city?, specialties?, maxFee?, availability? }): Lawyer[]
```

---

## 8. 未完成/待开发项

| 项目 | 优先级 | 说明 |
|:----:|:------:|------|
| 后端 API 对接 | P0 | 当前全部是前端模拟数据，需接入 FastAPI |
| 文件上传 | P1 | U09 上传/拍照功能未实现（仅有登记） |
| 真实法律检索 | P1 | U10 法律来源目前为静态演示数据 |
| 事实版本管理 | P2 | `factVersions` 在 store 中已定义但页面未使用 |
| 异步任务状态 | P2 | U11 风险分析应为异步任务（预留 `AsyncJob` 组件） |
| 移动端测试 | P2 | 360px 宽度适配未做全面验证 |
| 动画过渡 | P3 | 页面间过渡动画、加载骨架屏 |
| E2E 测试 | P3 | 无 Cypress/Playwright 测试 |
| 无障碍 (a11y) | P3 | WCAG AA 未做系统检查 |
| 管理后台 | P4 | A01-A02 管理端页面未实现 |

---

## 9. 关键技术栈

| 层次 | 技术 | 用途 |
|:----:|------|------|
| 框架 | Next.js 16 + TypeScript | 前端 SSR/SSG |
| 样式 | Tailwind v4 + CSS 自定义属性 | 设计 Token 系统 |
| 状态管理 | Zustand 5 + persist | 全局状态 + localStorage |
| 字体 | Noto Sans SC + Geist | 中英文排版 |
| 构建 | Turbopack | 快速编译 |
| 后端 | FastAPI (Python 3.13) | API 层（骨架） |
| 数据库 | PostgreSQL + pgvector | 数据 + 向量检索（未接入） |

---

## 10. 目录结构（前端相关）

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                 U01 首页
│   │   ├── layout.tsx               根布局
│   │   ├── globals.css              全局样式 + 设计 Token
│   │   ├── u02/  ~  u16/            用户端 15 个页面
│   │   └── lawyer/                  律师端 4 个页面
│   │       ├── page.tsx             L01
│   │       └── cases/[id]/
│   │           ├── page.tsx         L02
│   │           ├── evidence/        L03
│   │           └── opinion/         L04
│   └── lib/
│       ├── types.ts                 核心数据模型
│       ├── store.ts                 Zustand store + 演示数据
│       └── lawyers.ts              模拟律师数据库
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

*本文件由 AI 开发助手维护*
*最后更新：2026-07-28*
