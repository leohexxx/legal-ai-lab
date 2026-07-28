"use client";

import { useState, useMemo, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import {
  FACT_STATUS_LABELS,
  MONEY_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  calcMoneyItemTotal,
  calcMoneyItemDiff,
} from "@/lib/types";

// ---- Toast 组件 ----

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.3s_ease-out]">
      <div className="bg-gray-900 text-white text-sm rounded-xl px-6 py-3 shadow-lg">
        {message}
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ---- 模拟案件详情 ----

const MOCK_CASE_DETAIL = {
  id: "M-20260727-001",
  title: "北京某某科技欠薪纠纷",
  status: "审阅中" as const,
  domain: "劳动争议",
  province: "北京市",
  city: "朝阳区",
  createdAt: "2026-07-27",
  updatedAt: "2026-07-28 10:30",
  description:
    "用户称公司从2026年1月起开始欠薪，1-3月仅发放部分工资（每月5,000元），4-6月未发放任何工资。用户为在职状态，尚未申请劳动仲裁。",
};

// ---- 目录树配置 ----

const SECTIONS = [
  { id: "caseinfo", label: "案件信息" },
  { id: "facts", label: "事实" },
  { id: "money", label: "金额" },
  { id: "timeline", label: "时间线" },
  { id: "evidence", label: "证据" },
  { id: "risk", label: "风险" },
  { id: "action", label: "行动" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// ---- 主页面 ----

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 使用 use() 解包异步 params（Next.js 16 模式）
  const { id } = use(params);

  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionId>("caseinfo");
  const [toast, setToast] = useState<string | null>(null);

  // Store 数据
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const facts = useCaseStore((s) => s.facts);
  const moneyItems = useCaseStore((s) => s.moneyItems);
  const timelineEvents = useCaseStore((s) => s.timelineEvents);
  const evidenceItems = useCaseStore((s) => s.evidenceItems);
  const risks = useCaseStore((s) => s.risks);
  const actionPlans = useCaseStore((s) => s.actionPlans);

  // 初始化演示数据
  useState(() => {
    if (!useCaseStore.getState().caseInfo) {
      initDemoCase();
    }
  });

  // AI 分析（模拟）
  const aiAnalysis = useMemo(
    () => ({
      strengths: [
        "用户为在职状态，仲裁时效不受一年限制，期限风险较低",
        "有明确的工资约定记录（15,000元/月），金额计算基础清晰",
        "有部分工资发放记录，可证明存在劳动关系",
      ],
      weaknesses: [
        "合同主体(A公司)与实际管理主体(B公司)不一致，需确认被申请人",
        "欠薪期间部分为估算，缺乏逐月确认的明细",
        "缺少银行流水等客观证据，主要依赖用户口述",
      ],
      suggestions: [
        "建议用户补充近6个月银行流水",
        "确认合同主体与实际用工主体关系，必要时追加B公司为共同被申请人",
        "建议收集聊天记录、邮件等沟通证据",
      ],
    }),
    []
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/lawyer")}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← 案件队列
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900 truncate">
              {MOCK_CASE_DETAIL.title}
            </h1>
            <p className="text-xs text-gray-400">
              {MOCK_CASE_DETAIL.id} · {MOCK_CASE_DETAIL.status}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/lawyer/cases/${id}/evidence`)}
              className="text-xs text-primary hover:text-[#3C3489] font-medium transition-colors"
            >
              证据对照
            </button>
            <button
              onClick={() => router.push(`/lawyer/cases/${id}/opinion`)}
              className="text-xs text-primary hover:text-[#3C3489] font-medium transition-colors"
            >
              律师意见
            </button>
          </div>
        </div>
      </div>

      {/* 三栏布局 */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* 左栏 - 目录 */}
        <aside className="md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
          <nav className="px-2 py-3 space-y-0.5">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === sec.id
                    ? "bg-primary-light text-primary font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 中栏 - 内容 */}
        <main className="flex-1 px-4 py-4 overflow-y-auto max-w-3xl">
          {/* 案件信息 */}
          {activeSection === "caseinfo" && (
            <SectionCaseInfo />
          )}

          {/* 事实 */}
          {activeSection === "facts" && (
            <SectionFacts facts={facts} aiAnalysis={aiAnalysis} />
          )}

          {/* 金额 */}
          {activeSection === "money" && (
            <SectionMoney moneyItems={moneyItems} />
          )}

          {/* 时间线 */}
          {activeSection === "timeline" && (
            <SectionTimeline events={timelineEvents} />
          )}

          {/* 证据 */}
          {activeSection === "evidence" && (
            <SectionEvidence evidenceItems={evidenceItems} />
          )}

          {/* 风险 */}
          {activeSection === "risk" && (
            <SectionRisk risks={risks} />
          )}

          {/* 行动 */}
          {activeSection === "action" && (
            <SectionAction actionPlans={actionPlans} />
          )}
        </main>

        {/* 右栏 - 批注区（预留） */}
        <aside className="hidden md:block md:w-64 shrink-0 border-l border-gray-100 bg-gray-50/30">
          <div className="px-4 py-4">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              批注
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-300 mb-1">批注功能</p>
              <p className="text-xs text-gray-200">即将上线</p>
            </div>
          </div>
        </aside>
      </div>

      {/* 底部操作栏 */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={() => showToast("操作已记入案件日志")}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#3C3489] transition-colors"
          >
            确认
          </button>
          <button
            onClick={() => showToast("修改请求已提交")}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            修改
          </button>
          <button
            onClick={() => showToast("已拒绝，案件将退回待分配")}
            className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            拒绝
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* 内联动画 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ---- 子组件 ----

function SectionCaseInfo() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">案件信息</h2>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
        <InfoRow label="案件标题" value={MOCK_CASE_DETAIL.title} />
        <InfoRow label="案件编号" value={MOCK_CASE_DETAIL.id} />
        <InfoRow
          label="案件状态"
          value={
            <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 font-medium">
              {MOCK_CASE_DETAIL.status}
            </span>
          }
        />
        <InfoRow label="领域" value={MOCK_CASE_DETAIL.domain} />
        <InfoRow
          label="地区"
          value={`${MOCK_CASE_DETAIL.province} ${MOCK_CASE_DETAIL.city}`}
        />
        <InfoRow label="创建时间" value={MOCK_CASE_DETAIL.createdAt} />
        <InfoRow label="更新时间" value={MOCK_CASE_DETAIL.updatedAt} />
        <InfoRow label="案件描述" value={MOCK_CASE_DETAIL.description} />
      </div>
    </div>
  );
}

function SectionFacts({
  facts,
  aiAnalysis,
}: {
  facts: import("@/lib/types").FactItem[];
  aiAnalysis: { strengths: string[]; weaknesses: string[]; suggestions: string[] };
}) {
  const statusColorMap: Record<string, { bg: string; dot: string; text: string }> = {
    confirmed: { bg: "bg-green-50", dot: "bg-green-500", text: "text-green-800" },
    pending: { bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-800" },
    inferred: { bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-800" },
    contradiction: { bg: "bg-red-50", dot: "bg-red-500", text: "text-red-800" },
  };

  const groups = useMemo(() => {
    const map = new Map<string, typeof facts>();
    facts.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    });
    return Array.from(map.entries());
  }, [facts]);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">事实</h2>

      {groups.map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs font-medium text-gray-400 mb-2">{category}</h3>
          <div className="space-y-1.5">
            {items.map((fact) => {
              const c = statusColorMap[fact.status] ?? statusColorMap.pending;
              return (
                <div
                  key={fact.id}
                  className={`rounded-xl ${c.bg} px-4 py-2.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500">{fact.label}</div>
                      <div className="text-sm text-gray-900 mt-0.5">
                        {fact.value}
                      </div>
                      {fact.source && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          来源：{fact.source}
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${c.text}`}
                    >
                      {FACT_STATUS_LABELS[fact.status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* AI 分析 */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-blue-900">AI 分析</h3>

        <div>
          <h4 className="text-xs font-medium text-blue-800 mb-1">有利因素</h4>
          <ul className="space-y-1">
            {aiAnalysis.strengths.map((s, i) => (
              <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                <span className="text-green-600 mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-medium text-blue-800 mb-1">风险因素</h4>
          <ul className="space-y-1">
            {aiAnalysis.weaknesses.map((w, i) => (
              <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5 shrink-0">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-medium text-blue-800 mb-1">建议</h4>
          <ul className="space-y-1">
            {aiAnalysis.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionMoney({
  moneyItems,
}: {
  moneyItems: import("@/lib/types").MoneyItem[];
}) {
  const totals = useMemo(() => {
    const t = { totalPayable: 0, totalPaid: 0, totalDiff: 0 };
    moneyItems.forEach((m) => {
      t.totalPayable += calcMoneyItemTotal(m);
      t.totalPaid += m.paidAmount;
      t.totalDiff += calcMoneyItemDiff(m);
    });
    return t;
  }, [moneyItems]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">金额明细</h2>

      {/* 汇总 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="text-xs text-gray-400">应付总额</div>
          <div className="text-base font-bold text-gray-900">
            {totals.totalPayable.toLocaleString()} 元
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="text-xs text-gray-400">实付总额</div>
          <div className="text-base font-bold text-gray-900">
            {totals.totalPaid.toLocaleString()} 元
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="text-xs text-red-400">欠薪总额</div>
          <div className="text-base font-bold text-red-600">
            {totals.totalDiff.toLocaleString()} 元
          </div>
        </div>
      </div>

      {/* 明细表格 */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">期间</th>
              <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">应付</th>
              <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">实付</th>
              <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">差额</th>
              <th className="text-center px-4 py-2.5 text-xs text-gray-500 font-medium">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {moneyItems.map((m) => {
              const total = calcMoneyItemTotal(m);
              const diff = calcMoneyItemDiff(m);
              return (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-sm text-gray-900">{m.period}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-900 text-right">
                    {total.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-900 text-right">
                    {m.paidAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium">
                    <span className={diff > 0 ? "text-red-600" : "text-gray-900"}>
                      {diff.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        m.status === "confirmed"
                          ? "bg-green-50 text-green-700"
                          : m.status === "estimated"
                            ? "bg-amber-50 text-amber-700"
                            : m.status === "disputed"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {MONEY_STATUS_LABELS[m.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionTimeline({
  events,
}: {
  events: import("@/lib/types").TimelineEvent[];
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">时间线</h2>
      <div className="space-y-0">
        {sorted.map((event, idx) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center w-6 shrink-0">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 ${
                  event.isEstimated
                    ? "border-gray-300 bg-white"
                    : "border-primary bg-primary"
                }`}
              />
              {idx < sorted.length - 1 && (
                <div className="w-px flex-1 bg-gray-200" />
              )}
            </div>
            <div className="pb-5 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {event.title}
                    </span>
                    {event.isEstimated && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-1.5 py-0.5">
                        估算
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {formatDate(event.date)}
                    </span>
                    <span className="text-[10px] rounded-full bg-gray-50 text-gray-500 px-1.5 py-0.5">
                      {EVENT_TYPE_LABELS[event.type]}
                    </span>
                  </div>
                </div>
              </div>
              {event.description && (
                <p className="text-xs text-gray-500 mt-1">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionEvidence({
  evidenceItems,
}: {
  evidenceItems: import("@/lib/types").EvidenceItem[];
 }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">证据</h2>
      {evidenceItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">暂无敌据记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evidenceItems.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {ev.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {ev.purpose}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${
                    ev.status === "existing"
                      ? "bg-green-50 text-green-700"
                      : ev.status === "missing"
                        ? "bg-red-50 text-red-700"
                        : ev.status === "parsing"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {ev.status === "existing"
                    ? "已有"
                    : ev.status === "missing"
                      ? "缺失"
                      : ev.status === "parsing"
                        ? "解析中"
                        : "失败"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => {}}
        className="text-sm text-primary font-medium hover:text-[#3C3489] transition-colors"
      >
        + 添加证据评估
      </button>
    </div>
  );
}

function SectionRisk({
  risks,
}: {
  risks: import("@/lib/types").RiskFactor[];
}) {
  const levelColorMap: Record<string, { bar: string; text: string; bg: string }> = {
    low: { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
    medium: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    high: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
    critical: { bar: "bg-red-700", text: "text-red-800", bg: "bg-red-100" },
  };

  const levelLabels: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    critical: "严重",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">风险评估</h2>
      {risks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">暂未生成风险评估</p>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.map((risk) => {
            const c = levelColorMap[risk.level] ?? levelColorMap.medium;
            return (
              <div key={risk.id} className={`rounded-xl ${c.bg} px-4 py-3`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {risk.dimension}
                  </span>
                  <span className={`text-xs font-medium ${c.text}`}>
                    {levelLabels[risk.level] ?? risk.level}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{risk.reason}</p>
                {risk.improvement && (
                  <p className="text-xs text-gray-400 mt-1">
                    建议：{risk.improvement}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionAction({
  actionPlans,
}: {
  actionPlans: import("@/lib/types").ActionPlan[];
}) {
  const typeLabels: Record<string, string> = {
    negotiate: "协商",
    complaint: "投诉",
    mediation: "调解",
    arbitration: "仲裁",
    litigation: "诉讼",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">行动方案</h2>
      {actionPlans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">暂未生成行动方案</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actionPlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {plan.title}
                  </span>
                  <span className="text-[10px] rounded-full bg-primary-light text-primary px-1.5 py-0.5 font-medium">
                    {typeLabels[plan.type] ?? plan.type}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  优先级 {plan.priority}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                目标：{plan.target}
              </p>
              <p className="text-xs text-gray-400 mb-1">
                预估耗时：{plan.estimatedDuration}
              </p>
              {plan.risks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {plan.risks.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-red-500 bg-red-50 rounded-full px-1.5 py-0.5"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 通用子组件 ----

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start px-4 py-2.5">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

function formatDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-");
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [y, m] = date.split("-");
    return `${y}年${parseInt(m)}月`;
  }
  return date;
}
