# Legal AI Lab 前端交付切片完整规划 (S1–S5)

> - 版本：v2.0
> - 创建日期：2026-07-28
> - 范围：普通用户端 + 律师端 P0 全部页面
> - 当前状态：S1 ✅ 完成 ｜ S2 ✅ 完成 ｜ S3 ✅ 完成 ｜ S4 ✅ 完成 ｜ S5 ✅ 完成

---

## 总体路线图

| 切片 | 范围 | 页面数 | 核心目标 | 状态 |
|------|------|-------:|----------|:----:|
| **S1** | U01–U06 | 6 | 可点击原型，验证信息架构 | ✅ |
| **S2** | U03–U08 | 6（4改+2新） | 欠薪事实闭环，接入数据流 | ✅ |
| **S3** | U09–U12 | 4 | 证据、来源和风险 | ✅ |
| **S4** | U13–U15 | 3 | 交付和数据控制 | ✅ |
| **S5** | U16, L01–L04 | 5 | 律师承接 | ✅ |
| **总计** | | 24 | | ✅ S1-S5 全部完成 |

---

## S1：可点击原型 ✅（已完成）

### 目标

> 验证信息架构和用户理解，不接真实文件和模型，使用合成案件数据。

### 包含页面

| ID | 页面 | 路由 | 核心功能 |
|----|------|------|----------|
| U01 | 首页与任务入口 | `/` | 自由描述、6常见场景、紧急提示、隐私入口、继续已有案件 |
| U02 | 服务边界与隐私同意 | `/u02` | 6项分项确认、详情展开、拒绝可退出、版本记录 |
| U03 | 领域、地区与目标确认 | `/u03` | 建议领域可修改、省市区三级+搜索、目标分类、紧急标记 |
| U04 | 引导式事实采集 | `/u04` | 8步流程（用工主体→状态→合同→工资→欠薪→证据→行动→汇总） |
| U05 | 事实摘要确认 | `/u05` | 已确认/待确认/AI推断/矛盾分区、每项可编辑 |
| U06 | 案件工作台总览 | `/u06` | 状态、主体、金额、风险维度、待办、Tab导航（7个标签页占位） |

### 技术实现

- **框架**：Next.js 16 + TypeScript + Tailwind v4
- **字体**：Noto Sans SC
- **主题色**：Primary `#534AB7`，Accent `#1D9E75`，Danger `#E24B4A`
- **状态管理**：组件内 useState（S1 不需要全局状态）
- **数据**：Mock 数据硬编码在页面内
- **数据流**：U01→U03→U04→U05→U06（U02 可跳过，为独立页）

### 验收清单

- [x] 用户 10 秒内能知道产品用途
- [x] 有自由描述入口
- [x] 有常见场景入口
- [x] 有继续案件入口
- [x] 明确当前支持领域
- [x] 不在首屏要求手机号
- [x] 有紧急情况提示
- [x] 360px 宽度可用
- [x] 6 个页面全部 200 OK 已验证

### 已交付文件

```
frontend/src/app/page.tsx          (6,635 bytes)  U01 首页
frontend/src/app/u02/page.tsx      (6,367 bytes)  U02 隐私同意
frontend/src/app/u03/page.tsx     (10,178 bytes)  U03 领域/地区/目标
frontend/src/app/u04/page.tsx     (24,206 bytes)  U04 引导采集
frontend/src/app/u05/page.tsx      (8,427 bytes)  U05 事实确认
frontend/src/app/u06/page.tsx     (10,597 bytes)  U06 案件工作台
frontend/src/app/layout.tsx         (991 bytes)  根布局
frontend/src/app/globals.css      (35 lines)    全局样式 + 主题变量
```

---

## S2：欠薪事实闭环 🔄（进行中）

### 目标

> 接入案件和事实接口，支持保存、继续和确认，使用固定规则生成演示结果。U01–U06 从 Mock 数据升级为真实数据流。

### 包含页面

| ID | 页面 | 操作 | 详细需求 |
|----|------|------|----------|
| U03 | 领域、地区与目标确认 | 📝 改造 | 传递数据到 store，不再只依赖 URL 参数 |
| U04 | 引导式事实采集 | 📝 改造 | 保存采集数据到全局 store，支持草稿持久化 |
| U05 | 事实摘要确认 | 📝 改造 | 从 store 读取真实数据，生成事实版本，确认后写回 store |
| U06 | 案件工作台总览 | 📝 改造 | 从 store 读取真实案件数据，Tab 链接到 U07/U08 |
| **U07** | **欠薪金额明细** | 🆕 新建 | 逐月工资明细表，应付/实付/差额，新增期间，自动重算 |
| **U08** | **时间线** | 🆕 新建 | 事件列表，事件类型过滤，添加事件，关联主体/事实/证据 |

### 新增 UI 组件

依据前端需求规格第12节，本次需实现以下可复用组件：

| 组件 | 用途 | 状态 |
|------|------|------|
| MoneyBreakdown | 金额明细 | 🆕 |
| TimelineItem | 事件列表 | 🆕 |
| FactCard（完善） | 事实卡 | 📝 |
| AsyncJob（预留） | 后台任务状态 | 📦 |

### 技术实现

- **状态管理**：zustand 全局 store + localStorage 持久化
- **数据层**：`src/lib/types.ts`（TypeScript 类型）+ `src/lib/store.ts`（zustand store）
- **数据流**：U01 → U02 → U03 → U04(存) → U05(读+写) → U06(读) → U07/U08(读)
- **草稿恢复**：localStorage key `case-draft`，刷新后自动加载

### TypeScript 数据模型

```typescript
// 核心数据对象（将在 src/lib/types.ts 中定义）

interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  domain: string;
  province: string;
  city: string;
  goal: string;
  urgent: string[];
  description: string;
  // 引用
  factVersionId?: string;
}

interface Party {
  id: string;
  type: "employee" | "employer" | "contract_party" | "actual_manager";
  name: string;
  isConfirmed: boolean;
}

interface FactItem {
  id: string;
  label: string;
  value: string;
  status: "confirmed" | "pending" | "inferred" | "contradiction";
  source?: string;
  category: string;
}

interface MoneyItem {
  id: string;
  period: string;          // 工资期间，如 "2026-01"
  dueDate: string;         // 应付日期
  baseSalary: number;      // 固定工资
  commission: number;      // 提成
  overtime: number;        // 加班
  bonus: number;           // 奖金
  deduction: number;       // 扣款
  paidAmount: number;      // 实付金额
  status: "confirmed" | "estimated" | "disputed" | "pending";
  attachment?: string;     // 关联文件
  notes?: string;
}

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;            // "YYYY-MM" 或 "YYYY-MM-DD"
  isEstimated: boolean;
  relatedParty?: string;
  relatedFacts?: string[];
  relatedEvidence?: string[];
  description?: string;
}

interface EvidenceItem {
  id: string;
  name: string;
  type: EvidenceType;
  purpose: string;
  status: "existing" | "missing" | "parsing" | "failed";
  isOriginal: boolean;
  privacyRisk?: string;
  notes?: string;
}

type CaseStatus =
  | "draft" | "pending_facts" | "analyzing"
  | "generated" | "pending_materials"
  | "ready" | "transferred" | "completed" | "archived";

type EventType =
  | "hire" | "contract" | "salary_agreed" | "salary_due"
  | "payment" | "demand" | "company_reply" | "resignation"
  | "complaint" | "arbitration" | "litigation" | "evidence"
  | "lawyer_opinion";
```

### U07 金额明细页面需求

**核心功能**：
- 逐月显示应付/实付/差额
- 工资构成拆分（固定/提成/加班/奖金/扣款）
- 金额状态标签（已确认/估算/争议）
- 新增工资期间
- 复制上期结构
- 修改后自动重算差额和总额
- 公式显示

**验收清单**：
- [ ] 每期应付明确
- [ ] 每期实付明确
- [ ] 每期差额明确
- [ ] 工资构成分开
- [ ] 公式可见
- [ ] 估算和争议有状态
- [ ] 文件可以关联
- [ ] 总额可以核对
- [ ] 修改后自动重算
- [ ] 可导出

### U08 时间线页面需求

**核心功能**：
- 列表和时间轴切换
- 事件类型过滤
- 每个事件关联主体、事实和证据
- 未知日期支持范围
- 用户可新增和编辑

**验收清单**：
- [ ] 事件按时间展示
- [ ] 事件关联主体
- [ ] 事件关联证据
- [ ] 未知日期支持范围
- [ ] 估算日期有标记
- [ ] 同日顺序不确定时不强行排序
- [ ] 可以新增和编辑
- [ ] 可以过滤
- [ ] 导出顺序一致

### 文件清单（S2 新增/修改）

```
frontend/src/lib/types.ts          🆕  数据模型定义
frontend/src/lib/store.ts          🆕  zustand 全局 store
frontend/src/app/u03/page.tsx      📝  改造接入 store
frontend/src/app/u04/page.tsx      📝  改造写入 store
frontend/src/app/u05/page.tsx      📝  改造从 store 读写
frontend/src/app/u06/page.tsx      📝  改造读取 store、链接 U07/U08
frontend/src/app/u07/page.tsx      🆕  金额明细页
frontend/src/app/u08/page.tsx      🆕  时间线页
```

---

## S3：证据、来源和风险 ⏳

### 目标

> 接入知识库和异步分析，支持文件登记和来源原文，建立回归测试。

### 包含页面

| ID | 页面 | 路由 | 核心功能 |
|----|------|------|----------|
| U09 | 证据中心 | `/u09` | 已有/缺失/矛盾/建议补充证据，上传/拍照/登记，原件与提取对照 |
| U10 | 法律依据与来源 | `/u10` | 白话结论+原文切换，来源卡（机关/条款/效力/地区），可追溯 |
| U11 | 风险与案件准备度 | `/u11` | 9维度分析（事实/证据/主体/金额/期限等），等级+原因+改进动作 |
| U12 | 行动方案与任务 | `/u12` | 可选方案列表（催讨/监察/仲裁/诉讼），前提/材料/风险/费用 |

### 依赖

- S2 完成的 store 数据层
- 后端知识库接口（至少 Mock）
- 异步分析任务状态管理
- 文件上传组件（拍照/上传/预览）

### 新增组件需求

| 组件 | 用途 | 必须支持的状态 |
|------|------|----------------|
| SourceCard | 法律来源 | 有效、失效、修订、地区不符、不可访问 |
| EvidenceCard | 证据 | 已有、缺失、解析中、失败、矛盾、已审核 |
| RiskCard | 风险 | 等级、原因、影响、改进动作、来源 |
| CompletenessMeter | 准备度 | 分维度、可解释、可更新 |
| CitationViewer | 引用 | 摘要、原文、条款定位、反馈 |
| AsyncJob | 后台任务 | 排队、运行、可取消、失败、完成 |

### 验收清单（摘录）

**证据中心**：
- [ ] 已有证据和缺失证据分开
- [ ] 证据的证明目的可见
- [ ] 上传前显示隐私提示
- [ ] 允许只登记不上传
- [ ] 支持预览
- [ ] 支持原文与提取结果对照
- [ ] 解析失败保留原文件
- [ ] "存在"和"充分"分开

**法律依据**：
- [ ] 每条法律结论至少一个来源
- [ ] 原文引用和模型解释视觉区分
- [ ] 不适用地区和失效来源不能作为当前依据
- [ ] 用户可看到查询日期
- [ ] 来源打不开时保留元数据并提示

**风险与准备度**：
- [ ] 至少分事实、证据、主体、金额、期限和程序维度
- [ ] 每个等级有原因
- [ ] 每个风险有改进动作
- [ ] 能关联事实或证据
- [ ] 不展示无数据依据的胜率

**行动方案**：
- [ ] 行动有适用前提
- [ ] 行动有目标
- [ ] 程序路径和条件匹配用户地区
- [ ] 已经完成的行动不会重复建议
- [ ] 高风险行动提示律师核验

---

## S4：交付和数据控制 ⏳

### 目标

> 报告、历史、导出、删除和审计，完成移动端和无障碍验收。

### 包含页面

| ID | 页面 | 路由 | 核心功能 |
|----|------|------|----------|
| U13 | 报告、导出和分享 | `/u13` | 11节结构化报告（边界→事实→证据→法条→风险→行动→来源），PDF/MD/HTML，分享链接 |
| U14 | 历史案件 | `/u14` | 列表/搜索/筛选/继续/复制/归档/删除 |
| U15 | 数据、授权和删除 | `/u15` | 同意记录查看、数据下载、授权撤回、文件/案件/账户删除 |

### 关键约束

- 报告必须基于已确认事实版本，不能包含未确认信息
- 分享链接默认关闭，可过期可撤回
- 删除操作分级别：文件 < 案件 < 账户
- 法定保留数据需说明原因和期限
- 不要将自然语言回答解析为高风险业务数据

### 验收清单（摘录）

**报告**：
- [ ] 报告仅使用对应事实版本
- [ ] 报告含待核实和争议项
- [ ] 报告含来源和生成时间
- [ ] PDF 之外有 HTML
- [ ] 分享默认关闭
- [ ] 分享范围可预览
- [ ] 文件名不暴露敏感信息

**历史案件**：
- [ ] 默认只显示用户自己的案件
- [ ] 已删除案件不出现在搜索
- [ ] 归档和删除含义清楚

**数据控制**：
- [ ] 撤回后新访问立即失效
- [ ] 删除任务有请求时间和完成状态
- [ ] 用户可以只删除文件而不删除案件
- [ ] 高风险动作要求再次确认

---

## S5：律师承接 ⏳

### 目标

> 模拟或真实受控合作，验证上下文连续性和权限控制。此阶段涉及律师端页面。

### 包含页面

| ID | 页面 | 路由 | 核心功能 |
|----|------|------|----------|
| U16 | 律师帮助和转交 | `/u16` | 律师建议理由、服务类型选择、律师匹配、转交预览、接收状态 |
| L01 | 律师案件队列 | `/lawyer` | 案件列表（编号/领域/地区/紧急/完整度）、接受/拒绝/冲突检查 |
| L02 | 律师案件审阅 | `/lawyer/cases/[id]` | 三栏布局（目录/事实/AI分析+批注）、逐条确认/修改/拒绝 |
| L03 | 证据和来源对照 | `/lawyer/cases/[id]/evidence` | 事实↔证据↔来源交叉对照、充分度标记、句子级跳转原文件 |
| L04 | 补充请求和律师意见 | `/lawyer/cases/[id]/opinion` | 结构化补充提问、律师意见草稿→发布、用户端区分AI/律师 |

### 技术要点

- **权限模型**：律师不能因为属于合作机构就自动读取全部用户案件
- **最小匿名摘要**：律师接收前只展示匿名信息
- **利益冲突检查**：接受前必须完成
- **版本独立**：律师意见独立版本，修改有人员/时间/原因
- **操作审计**：所有访问和操作记录

### 验收清单（摘录）

**律师接收**：
- [ ] 未接收前只展示最小匿名摘要
- [ ] 完成利益冲突检查
- [ ] 律师可以接受或拒绝
- [ ] 拒绝原因结构化
- [ ] 用户能看到接收状态

**案件审阅**：
- [ ] 5分钟内可找到主体、请求、金额、期限和关键证据
- [ ] 用户事实与 AI 分析分开
- [ ] AI 分析与律师意见分开
- [ ] 可以逐条确认、修改或拒绝 AI 结果
- [ ] 关键期限必须人工确认

---

## 附录 A：全量页面优先级矩阵

| ID | 页面 | 优先级 | 所在 S | 完成状态 |
|----|------|-------:|:------:|:--------:|
| U01 | 首页与任务入口 | P0 | S1 | ✅ |
| U02 | 服务边界与隐私同意 | P0 | S1 | ✅ |
| U03 | 领域、地区和目标确认 | P0 | S1→S2 | ✅ |
| U04 | 引导式事实采集 | P0 | S1→S2 | ✅ |
| U05 | 事实摘要确认 | P0 | S1→S2 | ✅ |
| U06 | 案件工作台总览 | P0 | S1→S2 | ✅ |
| U07 | 欠薪金额明细 | P0 | S2 | ✅ |
| U08 | 时间线 | P0 | S2 | ✅ |
| U09 | 证据中心 | P0 | S3 | ✅ |
| U10 | 法律依据与来源 | P0 | S3 | ✅ |
| U11 | 风险与案件准备度 | P0 | S3 | ✅ |
| U12 | 行动方案与任务 | P0 | S3 | ✅ |
| U13 | 报告、导出和分享 | P0 | S4 | ✅ |
| U14 | 历史案件 | P0 | S4 | ✅ |
| U15 | 数据、授权和删除 | P0 | S4 | ✅ |
| U16 | 律师帮助和转交 | P1 | S5 | ✅ |
| L01 | 律师案件队列 | P1 | S5 | ✅ |
| L02 | 律师案件审阅 | P1 | S5 | ✅ |
| L03 | 证据/来源对照 | P1 | S5 | ✅ |
| L04 | 补充请求和律师意见 | P1 | S5 | ✅ |
| K01–K03 | 知识运营端 | P1 | — | 📅 |
| A01–A02 | 管理端 | P2 | — | 📅 |
| R01–R02 | 结果分析 | P2–P3 | — | 📅 |

## 附录 B：共享数据对象（所有页面共用）

前端至少使用以下稳定对象，而不是直接依赖聊天文本：

```
Matter          案件
Party           主体（员工/公司/合同方/实际管理方）
Fact            事实
FactVersion     事实版本（锁定分析依据）
Event           事件（时间线条目）
Claim           请求
MoneyItem       工资项
Evidence        证据项
Source          法律来源
LegalRule       法律规则
Procedure       程序路径
RiskFactor      风险因素
ActionPlan      行动方案
Task            待办任务
Consent         同意记录
ShareGrant      分享授权
Handoff         律师转交
LawyerReview    律师审阅
AuditEvent      审计事件
```

每个对象至少有：稳定 ID、创建/更新时间、创建者类型、状态、来源、版本、可见范围、删除状态。

## 附录 C：API 边界（P0 前端所需）

```
POST   /matters                         创建案件
GET    /matters                         查询案件列表
GET    /matters/{id}                    获取案件详情
PATCH  /matters/{id}                    更新案件
DELETE /matters/{id}                    删除案件

POST   /matters/{id}/intake/answers     提交采集答案
GET    /matters/{id}/intake/next        获取下一采集问题

POST   /matters/{id}/facts/confirm      确认事实版本
GET    /matters/{id}/facts/versions     查询事实版本历史

GET    /matters/{id}/timeline           获取时间线
POST   /matters/{id}/events             新增事件

GET    /matters/{id}/money-items        获取工资明细
POST   /matters/{id}/money-items        新增/修改工资项

GET    /matters/{id}/evidence           获取证据列表
POST   /matters/{id}/evidence           登记/上传证据
DELETE /matters/{id}/evidence/{id}      删除证据

POST   /matters/{id}/analysis           启动分析
GET    /matters/{id}/analysis/{job_id}  查询分析状态/结果

GET    /matters/{id}/sources            获取适用法律来源
GET    /sources/{source_id}             获取来源详情

GET    /matters/{id}/risks              获取风险评估
GET    /matters/{id}/actions            获取行动方案

POST   /matters/{id}/reports            生成报告
GET    /matters/{id}/reports/{id}       获取报告

GET    /matters/{id}/consents           获取同意记录
POST   /matters/{id}/consents           提交同意
POST   /matters/{id}/deletion-requests  请求删除
```

接口最终以 OpenAPI 为准。前端不得从自然语言回答中自行解析高风险业务状态。

## 附录 D：当前进度（2026-07-28）

```
全部 20 页面 S1-S5 已完成并验证构建通过
数据流全线接入 zustand store（U03→U04→U05→U06）
详情见 99-LLM-Context/06-Implementation-Report.md
```

---

*文档维护者：AI 开发助手*
*最后更新：2026-07-28 07:55*
