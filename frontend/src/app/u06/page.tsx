"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CASE_STATUS = [
  { id: "draft", label: "草稿" },
  { id: "pending_facts", label: "待确认事实" },
  { id: "analyzing", label: "分析中" },
  { id: "generated", label: "已生成" },
  { id: "pending_materials", label: "待补材料" },
  { id: "ready", label: "准备行动" },
  { id: "transferred", label: "已转律师" },
];

const MOCK_CASE = {
  id: "M-20260727-001",
  title: "北京某某科技欠薪纠纷",
  status: "generated",
  created: "2026-07-27",
  updated: "2026-07-27 23:00",
  parties: {
    employee: "用户",
    employer: "北京某某科技有限公司",
  },
  mainClaim: "要求支付拖欠的工资 75,000 元",
  coreAmount: "约 75,000 元",
  amountStatus: "估算" as const,
  keyDates: {
    hireDate: "2024年10月",
    arrearsStart: "2026年1月",
    lastPay: "2026年3月",
  },
};

const RISK_DIMENSIONS = [
  {
    label: "事实完整度",
    level: "中等",
    levelColor: "amber",
    detail: "欠薪期间和金额为估算，缺少逐月明细",
  },
  {
    label: "证据充分度",
    level: "待补",
    levelColor: "red",
    detail: "缺少银行流水和考勤记录",
  },
  {
    label: "主体明确度",
    level: "有矛盾",
    levelColor: "red",
    detail: "合同主体(A公司)与实际管理主体(B公司)不同",
  },
  {
    label: "期限风险",
    level: "低",
    levelColor: "green",
    detail: "在职状态，仲裁时效不受一年限制",
  },
  {
    label: "金额明确度",
    level: "估算",
    levelColor: "amber",
    detail: "总金额为用户估算，需逐月核对",
  },
];

const TODO_ITEMS = [
  { id: "t01", text: "补充银行流水（近6个月）", priority: "high", done: false },
  { id: "t02", text: "确认合同主体与实际用工主体关系", priority: "high", done: false },
  { id: "t03", text: "逐月核对欠薪期间和金额", priority: "medium", done: false },
  { id: "t04", text: "保存和整理聊天记录等沟通证据", priority: "medium", done: false },
  { id: "t05", text: "确认是否需要申请劳动仲裁", priority: "low", done: false },
];

export default function U06Page() {
  const router = useRouter();
  const [todo, setTodo] = useState(TODO_ITEMS);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleTodo = (id: string) => {
    setTodo((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const statusLabel = CASE_STATUS.find((s) => s.id === MOCK_CASE.status)?.label || MOCK_CASE.status;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">
            ← 首页
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900 truncate">{MOCK_CASE.title}</h1>
            <p className="text-xs text-gray-400">{MOCK_CASE.id}</p>
          </div>
          <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${
            MOCK_CASE.status === "generated" ? "bg-green-50 text-green-700" :
            MOCK_CASE.status === "pending_facts" ? "bg-amber-50 text-amber-700" :
            "bg-gray-50 text-gray-600"
          }`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-gray-100 px-4">
        <div className="max-w-4xl mx-auto flex overflow-x-auto gap-0">
          {[
            { id: "overview", label: "总览" },
            { id: "facts", label: "事实" },
            { id: "timeline", label: "时间线" },
            { id: "amount", label: "金额" },
            { id: "evidence", label: "证据" },
            { id: "laws", label: "法律依据" },
            { id: "actions", label: "行动方案" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 总览内容 */}
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 关键信息卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard label="对方主体" value={MOCK_CASE.parties.employer} />
              <InfoCard label="主请求" value={MOCK_CASE.mainClaim} />
              <InfoCard label="核心金额" value={MOCK_CASE.coreAmount} tag={MOCK_CASE.amountStatus} tagColor="amber" />
              <InfoCard label="最近更新" value={MOCK_CASE.updated} />
            </div>

            {/* 风险维度 */}
            <div>
              <h2 className="text-sm font-medium text-gray-900 mb-3">案件准备度</h2>
              <div className="space-y-2">
                {RISK_DIMENSIONS.map((risk) => (
                  <RiskBar key={risk.label} {...risk} />
                ))}
              </div>
            </div>

            {/* 待办 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-900">待办事项</h2>
                <span className="text-xs text-gray-400">{todo.filter((t) => !t.done).length} 项待完成</span>
              </div>
              <div className="space-y-1">
                {todo.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleTodo(item.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light"
                    />
                    <span className={`text-sm flex-1 ${item.done ? "line-through text-gray-300" : "text-gray-700"}`}>
                      {item.text}
                    </span>
                    {item.priority === "high" && !item.done && (
                      <span className="text-xs text-red-500">重要</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* 操作入口 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/u05")}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                查看和修改事实
              </button>
              <button
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                导出报告
              </button>
              <button
                className="rounded-xl bg-primary text-white px-4 py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors text-center"
              >
                咨询律师
              </button>
              <button
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                数据与授权
              </button>
            </div>
          </div>
        )}

        {/* 其他 Tab 占位 */}
        {activeTab !== "overview" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-400 mb-2">此功能即将上线</p>
            <p className="text-xs text-gray-300">
              {activeTab === "facts" && "详细事实列表，每条标注确认状态"}
              {activeTab === "timeline" && "按时间查看事件发展"}
              {activeTab === "amount" && "逐月应付、实付与差额明细"}
              {activeTab === "evidence" && "管理已有和缺失的证据"}
              {activeTab === "laws" && "可回溯的法律依据与原文"}
              {activeTab === "actions" && "分优先级的行动方案"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ label, value, tag, tagColor }: {
  label: string;
  value: string;
  tag?: string;
  tagColor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
      {tag && (
        <span className={`inline-block mt-1 text-xs rounded-full px-2 py-0.5 ${
          tagColor === "amber" ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"
        }`}>
          {tag}
        </span>
      )}
    </div>
  );
}

function RiskBar({ label, level, levelColor, detail }: {
  label: string;
  level: string;
  levelColor: "green" | "amber" | "red";
  detail: string;
}) {
  const colorMap = {
    green: { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
    amber: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    red: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  };
  const c = colorMap[levelColor];

  return (
    <div className={`rounded-xl ${c.bg} px-4 py-2.5`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-xs font-medium ${c.text}`}>{level}</span>
      </div>
      <div className="text-xs text-gray-500">{detail}</div>
    </div>
  );
}
