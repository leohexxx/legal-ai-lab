# 04 — 文件交叉引用地图（Cross-Reference Map）

> 本项目 60+ 个文件之间的依赖关系和内容关联。
> 帮助 AI 模型快速定位：修改一个文件时，还有哪些文件需要同步更新。

---

## 1. 顶层依赖链（自上而下）

```
Global_Product_Strategy_and_Execution_Plan.md  ← 一切的战略源头
  ├── Frontend_Requirements_Specification.md   ← 前端需求源于战略
  │   ├── Frontend_Delivery_Slices_S1_to_S5.md  ← 交付切片规划
  │   │   ├── frontend/src/app/u*/page.tsx      ← 各页面实现
  │   │   └── frontend/src/lib/*.ts             ← 前端数据层
  │   └── Implementation_and_Acceptance_Checklists.md  ← 验收标准
  ├── Strategy_and_Knowledge_Engineering.md  ← 知识工程源于战略
  │   ├── Hybrid_Retrieval_Design.md           ← 检索方案设计
  │   │   └── scripts/hybrid_retrieval_demo.py  ← 检索原型实现
  │   └── data/knowledge/labor/*.yaml           ← 知识卡片实现
  ├── Software_Development_Team_SOP.md         ← 开发团队组织
  │   ├── 产品管理专家提示词.md                   ← PM 角色
  │   ├── UI设计师提示词.md                      ← 设计角色
  │   └── (产品通/架构师/工程师/QA)              ← 子角色
  └── Global_Legal_AI_Competitive_Analysis.md  ← 竞品研究
```

---

## 2. 文件间引用关系

### 2.1 法律知识与检索

| 文件 | 引用了/被引用 | 用途 |
|------|-------------|------|
| `00-Vision/Strategy_and_Knowledge_Engineering.md` | ← 战略顶层，定义知识工程方法论 | 所有知识工作的总纲 |
| | → `data/knowledge/source_whitelist.yaml` | ​​来源白名单具体实现 |
| | → `data/knowledge/labor/INDEX.md` | 知识卡索引 |
| | → `03-AI-Technology/Hybrid_Retrieval_Design.md` | 检索方案依据 |
| `02-Legal-Knowledge/法律检索专家_法检Pro.md` | → 混合检索设计的技术实现 | 检索场景驱动技术选型 |
| `02-Legal-Knowledge/法律技能治理专家_技信衡.md` | → 知识卡质量审核标准 | 技能治理确保知识质量 |
| `data/knowledge/legal_ontology.yaml` | ← 知识工程定义的本体 | 13 实体 + 9 关系 |
| `scripts/hybrid_retrieval_demo.py` | ← Hybrid_Retrieval_Design.md 的设计 | 检索原型脚本实现 |

### 2.2 前端实现

| 文件 | 引用了/被引用 | 用途 |
|------|-------------|------|
| `01-Product/Frontend_Requirements_Specification.md` | ← Global_Product_Strategy（北极星分解） | 所有前端需求的源头 |
| `01-Product/Frontend_Delivery_Slices_S1_to_S5.md` | ← 需求规格的切片执行计划 | 每个 S 的执行清单 |
| `01-Product/Implementation_and_Acceptance_Checklists.md` | ← 需求规格的验收标准 | 每个页面完成时必须满足的条件 |
| `01-Product/Wage_Arrears_Intake_Schema.md` | ← 欠薪模块采集字段定义 | U04 引导式采集的数据模型 |
| `frontend/src/app/globals.css` | ← UI设计师提示词的 Token 实现 | 设计 Token 落地 |
| `frontend/src/app/layout.tsx` | → 所有页面的根布局 | 全局样式/字体 |
| `frontend/src/app/page.tsx` (U01) | → U02/U03/U06 | 首页入口 |
| `frontend/src/app/u03/page.tsx` (U03) | → U04（传递领域/地区/目标参数） | 数据流上游 |
| `frontend/src/app/u04/page.tsx` (U04) | ← U03 输入参数 | 8 步采集 |
| `frontend/src/app/u05/page.tsx` (U05) | ← U04 采集数据 | 事实确认 |
| `frontend/src/app/u06/page.tsx` (U06) | ← U05 确认数据 | 案件工作台 |
| `frontend/src/app/u07/page.tsx` (U07) | ← U06 金额明细 Tab | 逐月工资明细（S2 新增） |
| `frontend/src/app/u08/page.tsx` (U08) | ← U06 时间线 Tab | 事件时间线（S2 新增） |

### 2.3 后端实现

| 文件 | 引用了/被引用 | 用途 |
|------|-------------|------|
| `app/main.py` | → `app/routers/` + `app/models/` | FastAPI 入口 |
| `app/routers/health.py` | ← 被 `tests/test_health.py` 测试 | 健康检查端点 |
| `app/schemas/` | ← `scripts/generate_schemas.py` 生成的 JSON Schema | 知识卡 Schema |
| `tests/test_evaluation.py` | ← `05-MVP/Test_Cases.md` 的测试场景 | 评测框架实现 |
| `docker/init-db.sql` | → PostgreSQL + pgvector 表结构 | 存储层实现 |
| `pyproject.toml` | → 所有 Python 依赖 | 依赖管理 |

### 2.4 基础设施

| 文件 | 引用了/被引用 | 用途 |
|------|-------------|------|
| `.github/workflows/ci.yml` | → `app/` + `tests/` | CI/CD 管道 |
| `.pre-commit-config.yaml` | → `pyproject.toml`（lint 配置） | 提交前检查 |
| `docker-compose.yml` | → `docker/init-db.sql` | 开发环境编排 |

---

## 3. 按角色推荐阅读路径

### 首次进入项目（任何角色）

```
99-LLM-Context/README.md
  → 99-LLM-Context/02-Shared-Foundation.md
    → 99-LLM-Context/01-Prompt-Directory.md
      → 99-LLM-Context/06-Implementation-Report.md ← 了解当前代码状态
        → 按需读具体角色的提示词
```

### 前端开发者

```
02-Shared-Foundation.md
  → Frontend_Requirements_Specification.md
    → Frontend_Delivery_Slices_S1_to_S5.md
      → Implementation_and_Acceptance_Checklists.md
        → UI设计师提示词.md
          → frontend/src/app/*/page.tsx (现有页面)
```

### 法律知识工程师

```
02-Shared-Foundation.md (§7 法律知识工程)
  → Strategy_and_Knowledge_Engineering.md
    → 法律检索专家_法检Pro.md
      → 法律技能治理专家_技信衡.md
        → data/knowledge/labor/INDEX.md
          → data/knowledge/labor/rules|evidence|procedures/*.yaml
```

### AI/后端工程师

```
02-Shared-Foundation.md (§3 技术栈 + §5 核心原则)
  → Hybrid_Retrieval_Design.md
    → Strategy_and_Knowledge_Engineering.md (§知识图谱)
      → app/* (FastAPI 代码)
        → scripts/hybrid_retrieval_demo.py
```

### 产品经理

```
02-Shared-Foundation.md (§1 北极星 + §2 架构)
  → Global_Product_Strategy_and_Execution_Plan.md
    → 产品管理专家提示词.md
      → Frontend_Requirements_Specification.md
        → Global_Legal_AI_Competitive_Analysis.md
```

---

## 4. 修改影响范围矩阵

| 如果你要改... | 还需要检查... | 风险等级 |
|---------------|-------------|:--------:|
| U03 采集字段 | U04 同名字段、U05 事实列表、Wage_Arrears_Intake_Schema.md、验收清单 | 🔴 高 |
| 法律知识卡 YAML | source_whitelist.yaml、Hybrid_Retrieval_Design.md、INDEX.md、测试数据 | 🔴 高 |
| 前端业务流程 | 上下游页面参数传递、store 类型定义、验收清单 | 🟡 中 |
| UI 设计 Token | globals.css、layout.tsx、所有页面中的颜色/间距引用 | 🟡 中 |
| 专家提示词 | 本目录（99-LLM-Context）的索引和交叉引用 | 🟡 中 |
| README / MD 文档 | 相关文件的引用路径、overview.md | 🟢 低 |
| 后端路由 | OpenAPI 文档、前端接口调用、测试用例 | 🔴 高 |
| 数据模型（types.ts） | 所有使用该模型的页面和 store | 🔴 高 |

---

## 5. 常见问题定位地图

| 现象 | 可能原因 | 检查位置 |
|------|----------|----------|
| 页面 404 | 路由未定义、page.tsx 命名错误 | `frontend/src/app/` 路径结构 |
| 数据丢失 | URL 参数传递中断、store 未持久化 | 上下游页面参数、localStorage |
| 构建失败 | NODE_OPTIONS 干扰、.next 缓存锁、next.config.ts 错误 | 环境变量 + `npm run build` |
| 检索不准 | 中文分词、术语扩展字典、知识卡数据 | `scripts/hybrid_retrieval_demo.py` |
| 测试失败 | 测试场景过期、Schema 变更 | `tests/` + `data/knowledge/` |
| 容器起不来 | Docker 端口冲突、环境变量 | `docker-compose.yml` + `.env.example` |

---

*本文件由 AI 开发助手维护*
*最后更新：2026-07-28*
