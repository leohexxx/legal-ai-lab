# 测试交接文档：Legal AI Lab 对话式交互重构

> **交接时间**: 2026-07-28
> **交接给**: 下一轮测试 AI / 工程师
> **项目根目录**: `D:\4.开发工具\legal_ai_lab`

---

## 一、项目概述

Legal AI Lab 是一个 AI 驱动的劳动法纠纷法律助手。本轮重构将交互范式从"8 步强制表单"改为"对话式咨询"，并接入了 DeepSeek Pro 做意图识别和劳动法知识图谱。

---

## 二、环境准备

### 2.1 启动后端
```powershell
cd D:\4.开发工具\legal_ai_lab
# 先激活 Python 虚拟环境（如已创建）
# python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt  # 如有

# 启动后端（后台运行）
uvicorn app.main:app --reload --port 8000
```

### 2.2 启动前端
```powershell
cd D:\4.开发工具\legal_ai_lab\frontend
npm run dev
```
默认前端地址：`http://localhost:3000`

### 2.3 API Key
DeepSeek API Key 已保存在 `D:\4.开发工具\legal_ai_lab\api key.txt`
默认 Model：`deepseek-chat` | Endpoint：`https://api.deepseek.com/v1/chat/completions`

---

## 三、后端 API 一览

| 方法 | 路径 | 说明 | 已测试 |
|:----:|------|------|:------:|
| POST | `/api/v1/chat/identify` | 意图识别（用户输入 → 分类ID + 置信度） | ✅ |
| POST | `/api/v1/chat/ask` | 对话/追问（支持上下文） | ✅ (有1个已知Bug) |
| POST | `/api/v1/chat/skip` | 跳过追问，直接生成初步结果 | ✅ |
| GET | `/api/v1/knowledge/categories` | 获取知识图谱全部分类（40个节点） | ✅ |
| GET | `/api/v1/knowledge/categories/{id}` | 获取分类详情 | ✅ |
| GET | `/api/v1/knowledge/categories/{id}/fields` | 获取分类的采集字段定义 | ⛔ 未测 |
| POST | `/api/v1/knowledge/search` | 知识检索 | ✅ |
| GET | `/api/v1/health` | 健康检查 | — |

### 3.1 核心接口详情

#### POST `/api/v1/chat/identify`
**请求**:
```json
{"message": "公司说合同到期不续签了，我这有补偿吗"}
```
**响应**:
```json
{
  "code": 0,
  "data": {
    "categoryId": "contract_renewal",
    "level1": "劳动合同",
    "level2": "续签",
    "confidence": 0.95,
    "extractedKeywords": ["合同到期", "不续签", "补偿"],
    "summary": "合同到期不续签是否有补偿",
    "alternativeCategories": []
  },
  "message": "success"
}
```

#### POST `/api/v1/chat/ask`
**请求**（首次，无 contextId）:
```json
{"message": "公司说合同到期不续签了"}
```
**请求**（确认分类后）:
```json
{
  "message": "3年2个月",
  "contextId": "ctx-xxx-yyy",
  "categoryId": "contract_renewal",
  "collectedFields": {"yearsOfService": "3年2个月"}
}
```
**响应**（包含追问字段）:
```json
{
  "code": 0,
  "data": {
    "message": "好的，请问公司提前多久通知您不续签？",
    "intent": null,
    "fields": [
      {"fieldId": "hasNotice", "label": "提前多久通知", "type": "select",
       "options": [{"label": "提前30天以上", "value": "more_than_30d"},
                   {"label": "提前不到30天", "value": "less_than_30d"},
                   {"label": "没有提前通知", "value": "no_notice"}],
       "required": true}
    ],
    "isComplete": false
  }
}
```

#### GET `/api/v1/knowledge/categories`
**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "categoryId": "contract_renewal",
      "level1": "劳动合同",
      "level2": "续签",
      "displayName": "合同到期不续签",
      "keywords": ["不续签", "合同到期不续签", ...],
      "requiredFields": ["contractPeriod", "hasNotice", "reasonForNonRenewal", "yearsOfService", "contractSignCount"],
      "excludeFrom": ["salary_arrears", "illegal_termination"]
    },
    ... // 共 40 个节点
  ],
  "message": "success"
}
```

---

## 四、未完成事项 & 已知问题

### 4.1 已知 Bug（未修复）

| # | 严重程度 | 描述 | 文件 | 行号 |
|:-:|:--------:|------|------|:----:|
| B1 | 中 | `POST /api/v1/chat/ask` 传入不存在的 contextId 时，抛出 KeyError 返回 51000 | `app/services/chat_service.py` | 110 |

**修复建议**: 将第 107-110 行改为：
```python
if not context_id or context_id not in self._contexts:
    context_id = self._create_context()
context = self._contexts[context_id]
```

### 4.2 未测试的内容

| # | 测试项 | 优先级 | 说明 |
|:-:|--------|:------:|------|
| T1 | 前端对话 UI 手动验证 | P0 | 在浏览器中打开 U04 页面，输入消息，确认整个对话流程是否正常 |
| T2 | 意图纠错流程 | P0 | 当 LLM 识别错误时，用户点击"不太对，纠正"后能否正确重新识别 |
| T3 | "不��充，直接看结果"按钮 | P0 | 点击后是否跳过追问并生成初步分析 |
| T4 | U01 首页意图识别入口 | P0 | 在首页输入问题后是否显示识别结果并可以跳转到 U04 |
| T5 | U03 兜底降级页面 | P1 | 手动进入 U03 页面，确认分类卡片 Grid 和地区选择是否正常 |
| T6 | U04 旧表单备选入口 | P1 | 访问 `/u04?mode=form` 是否正常显示旧版 8 步表单 |
| T7 | 多轮对话上下文保持 | P2 | 连续提问 3-5 轮，确认上下文连贯 |
| T8 | 知识图谱 API 所有端点 | P1 | 测试 `GET /knowledge/categories/{id}/fields` 端点 |
| T9 | 前端构建 + 测试回归 | P0 | `npm run build` 和 `npx vitest run` 应全部通过 |
| T10 | 前端/后端错误处理 | P1 | 网络断开时、API Key 错误时、后端挂掉时前端 UI 表现 |

### 4.3 **关键测试场景（意图识别互斥性验证）**

这些是最核心的验收用例，确保"合同不续签"不会被归到"欠薪"：

| 输入 | 期望 categoryId | 不能是 |
|------|:---------------:|:------:|
| "公司说合同到期不续签了，我这有补偿吗" | `contract_renewal` | `salary_arrears` |
| "公司拖欠我三个月工资了，一直不发" | `salary_arrears` | `contract_renewal` |
| "公司突然把我开除了，没有任何补偿" | `illegal_termination` | `salary_arrears` / `contract_renewal` |
| "公司经常让我周末加班但不给加班费" | `overtime` | `salary_arrears` |
| "入职半年了公司一直不跟我签合同" | `contract_conclusion` | — |
| "公司没给我交社保怎么办" | `social_insurance_payment` | — |

---

## 五、自动化测试

QA 工程师已编写 E2E API 测试脚本：**`tests/test_api_e2e.py`**

运行方式（需要先启动后端）：
```powershell
cd D:\4.开发工具\legal_ai_lab
python tests/test_api_e2e.py
```

该脚本目前覆盖：知识图谱查询、3 种意图识别（合同不续签/欠薪/违法辞退）、对话 API。
上次运行结果：除 contextId 缺陷外全部通过。

---

## 六、项目文件结构（本轮新增/修改）

```
## 新增文件（13 个）
app/schemas/chat.py                    # Pydantic Schema（Identify/Ask/Skip 请求响应）
app/services/chat_prompts.py           # DeepSeek Prompt 模板（System Prompt + few-shot）
app/services/knowledge_service.py      # 知识图谱加载与查询服务
app/services/chat_service.py           # Chat 服务（DeepSeek API 调用 + 降级关键词匹配）
app/routers/chat.py                    # Chat 路由（identify / ask / skip）
app/routers/knowledge.py               # Knowledge 路由（categories / search）
data/knowledge/knowledge_graph.json    # 劳动法知识图谱（11 个一级分类，40 个二级节点）
frontend/src/lib/api.ts                # 前端 API 客户端封装
frontend/src/lib/chatStore.ts          # 对话 Zustand Store
frontend/src/components/chat/ChatMessage.tsx     # 聊天气泡组件
frontend/src/components/chat/IntentTag.tsx       # 意图标签组件
frontend/src/components/chat/ContextSummary.tsx  # 上下文摘要卡片
frontend/src/components/chat/SkipButton.tsx      # "跳过追问"按钮
frontend/src/components/chat/TypingIndicator.tsx # 打字动画组件
frontend/src/components/chat/index.ts            # 组件统一导出
tests/test_api_e2e.py                  # API E2E 测试脚本
99-LLM-Context/09-QA-Test-Report.md    # QA 测试报告

## 修改文件（7 个）
app/config.py                          # 新增 DeepSeek 配置项
app/main.py                            # 注册 chat + knowledge 路由
frontend/src/lib/types.ts              # 追加 ChatMessage / IntentResult 等类型
frontend/src/app/page.tsx              # U01 首页对接意图识别 API
frontend/src/app/u04/page.tsx          # U04 核心重构：对话式交互（默认）+ 旧表单备选
frontend/src/app/u03/page.tsx          # U03 改造为兜底降级通道
frontend/src/__tests__/pages.smoke.test.tsx  # 修复 2 个类型错误
```

---

## 七、知识图谱分类体系

共 11 个一级分类，40 个二级分类：

| 一级分类 | 二级分类数 | 二级分类 |
|----------|:----------:|----------|
| 劳动合同 | 5 | 订立、续签、解除、终止、变更 |
| 工资报酬 | 4 | 欠薪、加班费、最低工资、奖金提成 |
| 劳动关系认定 | 4 | 事实劳动关系、双重劳动关系、劳务派遣、非全日制用工 |
| 社保福利 | 4 | 社保缴纳、公积金、医疗保险、养老保险 |
| 辞退裁员 | 4 | 违法辞退、经济补偿、裁员程序、离职证明 |
| 工伤赔偿 | 4 | 工伤认定、伤残等级、一次性赔偿、工亡赔偿 |
| 休息休假 | 4 | 年休假、病假事假、婚丧假、产假陪产假 |
| 竞业限制 | 2 | 竞业协议、竞业补偿 |
| 女职工保护 | 3 | 孕期保护、产期待遇、哺乳期 |
| 集体争议 | 3 | 集体协商、群体性欠薪、停工怠工 |
| 程序时效 | 3 | 仲裁时效、诉讼时效、证据保存 |

---

> **给下一轮 AI 的提示**: 先读 `01-Product/Incremental_PRD_Interaction_Redesign.md` 了解产品需求，再读 `01-Product/Architecture_Design_Interaction_Redesign.md` 了解架构设计，然后按本测试文档的"未完成事项"和"关键测试场景"逐项验证。
