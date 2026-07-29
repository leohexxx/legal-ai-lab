"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import {
  calcMoneyItemTotal,
  calcMoneyItemDiff,
  FACT_STATUS_LABELS,
  MONEY_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ============================================================
// 报告章节可折叠组件
// ============================================================

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden print:break-inside-avoid">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <span className={`text-gray-300 text-xs transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {open && <div className="px-5 pb-4 border-t border-gray-50 pt-3">{children}</div>}
    </div>
  );
}

// ============================================================
// 标签组件
// ============================================================

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "green" | "amber" | "red" | "blue" | "default" }) {
  const map = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    default: "bg-gray-50 text-gray-600",
  };
  return (
    <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-medium ${map[variant]}`}>
      {children}
    </span>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function U13Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const facts = useCaseStore((s) => s.facts);
  const moneyItems = useCaseStore((s) => s.moneyItems);
  const timelineEvents = useCaseStore((s) => s.timelineEvents);
  const evidenceItems = useCaseStore((s) => s.evidenceItems);
  const sources = useCaseStore((s) => s.sources);
  const risks = useCaseStore((s) => s.risks);
  const actionPlans = useCaseStore((s) => s.actionPlans);

  const [toast, setToast] = useState<string | null>(null);

  // 初始化演示数据
  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && facts.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, facts.length]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/u13?share=" + (caseInfo?.id ?? ""));
    showToast("链接已复制");
  };

  // ---- 从已确认事实推导衍生数据（若无 store 数据则就地推算） ----

  const derivedRisks = risks.length > 0
    ? risks
    : facts
        .filter((f) => f.status === "contradiction" || f.status === "pending")
        .map((f) => ({
          id: f.id,
          dimension: f.category,
          level: (f.status === "contradiction" ? "high" : "medium") as "high" | "medium" | "low" | "critical",
          reason: `${f.label}：${f.value}（状态：${FACT_STATUS_LABELS[f.status]}）`,
        }));

  const derivedEvidence = evidenceItems.length > 0
    ? evidenceItems
    : facts
        .filter((f) => f.source)
        .map((f, i) => ({
          id: `e${i}`,
          name: `${f.label}相关材料`,
          type: "other" as const,
          purpose: `佐证「${f.label}」`,
          status: "existing" as const,
          isOriginal: false,
          notes: f.source,
        }));

  const derivedSources = sources.length > 0
    ? sources
    : [
        {
          id: "s01",
          title: "中华人民共和国劳动法",
          authority: "全国人大常委会",
          articleNo: "第五十条",
          status: "effective" as const,
          queryDate: "2026-07-27",
          summary: "工资应当以货币形式按月支付给劳动者本人。不得克扣或者无故拖欠劳动者的工资。",
        },
        {
          id: "s02",
          title: "中华人民共和国劳动合同法",
          authority: "全国人大常委会",
          articleNo: "第八十五条",
          status: "effective" as const,
          queryDate: "2026-07-27",
          summary: "用人单位拖欠劳动报酬的，劳动行政部门责令限期支付；逾期不支付的，责令按应付金额百分之五十以上百分之一百以下的标准加付赔偿金。",
        },
      ];

  const derivedActions = actionPlans.length > 0
    ? actionPlans
    : [
        {
          id: "a01",
          title: "与公司协商",
          type: "negotiate" as const,
          prerequisites: ["整理欠薪明细", "准备证据材料"],
          target: "要求公司限期支付拖欠工资",
          risks: ["公司可能继续拖延"],
          costs: "时间成本低",
          estimatedDuration: "1-2周",
          priority: 1,
        },
        {
          id: "a02",
          title: "申请劳动仲裁",
          type: "arbitration" as const,
          prerequisites: ["收集全部证据", "计算欠薪总额"],
          target: "通过仲裁裁决追讨欠薪",
          risks: ["如合同主体与实际主体不一致可能影响仲裁管辖"],
          costs: "仲裁受理费约10元/件",
          estimatedDuration: "45-60天",
          priority: 2,
        },
      ];

  // ---- 汇总 ----

  const confirmedFacts = facts.filter((f) => f.status === "confirmed");
  const totalPayable = moneyItems.reduce((s, m) => s + calcMoneyItemTotal(m), 0);
  const totalPaid = moneyItems.reduce((s, m) => s + m.paidAmount, 0);
  const totalDiff = moneyItems.reduce((s, m) => s + calcMoneyItemDiff(m), 0);

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="page" message="正在生成报告..." />
        </main>
      </div>
    );
  }

  // 错误状态
  if (hasError) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 首页</button>
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <ErrorState title="报告生成失败" message={errorMessage} severity="error" onRetry={() => { setHasError(false); initDemoCase(); }} />
        </main>
      </div>
    );
  }

  // 空状态
  if (!caseInfo) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 首页</button>
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <EmptyState icon="📄" title="暂无案件数据" description="请先创建案件" actionLabel="创建案件" onAction={() => router.push("/")} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/u06")}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← 案件工作台
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900 truncate">
              案件报告
            </h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="border-b border-gray-100 px-4 py-2.5 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
          <button
            onClick={() => showToast("PDF 导出功能即将上线")}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            导出 PDF
          </button>
          <button
            onClick={() => showToast("Markdown 导出功能即将上线")}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            导出 Markdown
          </button>
          <button
            onClick={() => showToast("HTML 导出功能即将上线")}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            导出 HTML
          </button>
          <div className="flex-1" />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-primary text-white hover:bg-[#3C3489] transition-colors"
          >
            分享报告
          </button>
        </div>
      </div>

      {/* 报告正文 */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 报告头部 */}
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 print:mb-4">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              {caseInfo?.title ?? "未命名案件"} 案件报告
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
              <span>案件编号：{caseInfo?.id ?? "-"}</span>
              <span>生成时间：{new Date().toLocaleString("zh-CN")}</span>
              {caseInfo?.domain && <span>领域：{caseInfo.domain === "labor" ? "劳动法" : caseInfo.domain}</span>}
            </div>
          </div>

          {/* 1. 案件边界 */}
          <Section title="1. 案件边界">
            <div className="text-sm text-gray-700 leading-relaxed space-y-1">
              <p><span className="text-gray-400">对方主体：</span>北京某某科技有限公司</p>
              <p><span className="text-gray-400">实际工作地：</span>北京市朝阳区</p>
              <p><span className="text-gray-400">案件目标：</span>{caseInfo?.goal === "prepare" ? "准备劳动仲裁" : caseInfo?.goal ?? "-"}</p>
              <p><span className="text-gray-400">管辖地：</span>北京市朝阳区劳动人事争议仲裁委员会</p>
            </div>
          </Section>

          {/* 2. 案件主体 */}
          <Section title="2. 案件主体">
            {facts.filter((f) => f.category === "主体").length > 0 ? (
              <div className="space-y-2">
                {facts
                  .filter((f) => f.category === "主体")
                  .map((f) => (
                    <div key={f.id} className="flex items-start gap-3 text-sm">
                      <span className="text-gray-500 w-24 shrink-0">{f.label}</span>
                      <span className="text-gray-900 flex-1">{f.value}</span>
                      <Badge variant={f.status === "confirmed" ? "green" : f.status === "contradiction" ? "red" : "amber"}>
                        {FACT_STATUS_LABELS[f.status]}
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无主体信息</p>
            )}
          </Section>

          {/* 3. 已确认事实 */}
          <Section title="3. 已确认事实">
            {confirmedFacts.length > 0 ? (
              <div className="space-y-2">
                {confirmedFacts.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-500 w-24 shrink-0">{f.label}</span>
                    <span className="text-gray-900 flex-1">{f.value}</span>
                    {f.source && <span className="text-gray-300 text-xs shrink-0">来源：{f.source}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无已确认事实</p>
            )}
          </Section>

          {/* 4. 金额明细 */}
          <Section title="4. 金额明细">
            {moneyItems.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
                    <div className="text-xs text-gray-400">应付总额</div>
                    <div className="text-sm font-bold text-gray-900">{totalPayable.toLocaleString()} 元</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
                    <div className="text-xs text-gray-400">实付总额</div>
                    <div className="text-sm font-bold text-gray-900">{totalPaid.toLocaleString()} 元</div>
                  </div>
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-center">
                    <div className="text-xs text-red-400">欠薪总额</div>
                    <div className="text-sm font-bold text-red-600">{Math.abs(totalDiff).toLocaleString()} 元</div>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="text-left py-1.5 font-medium">期间</th>
                      <th className="text-right py-1.5 font-medium">应付</th>
                      <th className="text-right py-1.5 font-medium">实付</th>
                      <th className="text-right py-1.5 font-medium">差额</th>
                      <th className="text-right py-1.5 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moneyItems.map((m) => {
                      const t = calcMoneyItemTotal(m);
                      const d = calcMoneyItemDiff(m);
                      return (
                        <tr key={m.id} className="border-b border-gray-50">
                          <td className="py-1.5 text-gray-900">{m.period}</td>
                          <td className="py-1.5 text-right text-gray-900">{t.toLocaleString()}</td>
                          <td className="py-1.5 text-right text-gray-900">{m.paidAmount.toLocaleString()}</td>
                          <td className={`py-1.5 text-right font-medium ${d > 0 ? "text-red-600" : "text-gray-900"}`}>
                            {d.toLocaleString()}
                          </td>
                          <td className="py-1.5 text-right">
                            <Badge variant={m.status === "confirmed" ? "green" : m.status === "estimated" ? "amber" : "default"}>
                              {MONEY_STATUS_LABELS[m.status]}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {moneyItems.some((m) => m.notes) && (
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {moneyItems.filter((m) => m.notes).map((m) => (
                      <p key={m.id}>{m.period}：{m.notes}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无金额数据</p>
            )}
          </Section>

          {/* 5. 时间线 */}
          <Section title="5. 时间线">
            {timelineEvents.length > 0 ? (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2.5 top-1 bottom-1 w-px bg-gray-200" />
                {timelineEvents.map((ev) => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white" />
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{ev.title}</span>
                        <span className="text-xs text-gray-400">{ev.date}{ev.isEstimated ? "（估算）" : ""}</span>
                      </div>
                      {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无时间线数据</p>
            )}
          </Section>

          {/* 6. 证据材料 */}
          <Section title="6. 证据材料">
            {derivedEvidence.length > 0 ? (
              <div className="space-y-2">
                {derivedEvidence.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-gray-900">{ev.name}</span>
                      <span className="text-gray-400 ml-2">{ev.purpose}</span>
                    </div>
                    <Badge variant={ev.status === "existing" ? "green" : ev.status === "missing" ? "red" : "amber"}>
                      {ev.status === "existing" ? "已有" : ev.status === "missing" ? "缺失" : "解析中"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无证据材料数据</p>
            )}
          </Section>

          {/* 7. 法律依据 */}
          <Section title="7. 法律依据">
            {derivedSources.length > 0 ? (
              <div className="space-y-3">
                {derivedSources.map((src) => (
                  <div key={src.id} className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{src.title}</span>
                      <Badge variant={src.status === "effective" ? "green" : src.status === "invalid" ? "red" : "amber"}>
                        {src.status === "effective" ? "现行有效" : src.status === "invalid" ? "已失效" : src.status === "region_mismatch" ? "区域不匹配" : "已修订"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{src.authority} · {src.articleNo}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{src.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无法律依据数据</p>
            )}
          </Section>

          {/* 8. 风险评估 */}
          <Section title="8. 风险评估">
            {derivedRisks.length > 0 ? (
              <div className="space-y-2">
                {derivedRisks.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <Badge variant={r.level === "critical" || r.level === "high" ? "red" : r.level === "medium" ? "amber" : "green"}>
                      {r.level === "critical" ? "严重" : r.level === "high" ? "高" : r.level === "medium" ? "中" : "低"}
                    </Badge>
                    <span className="text-gray-500 w-16 shrink-0">{r.dimension}</span>
                    <span className="text-gray-900 flex-1">{r.reason}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无风险评估数据</p>
            )}
          </Section>

          {/* 9. 行动方案 */}
          <Section title="9. 行动方案">
            {derivedActions.length > 0 ? (
              <div className="space-y-3">
                {derivedActions
                  .sort((a, b) => a.priority - b.priority)
                  .map((act) => (
                    <div key={act.id} className="rounded-lg border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {act.priority}. {act.title}
                        </span>
                        <Badge variant={act.type === "negotiate" ? "blue" : act.type === "arbitration" ? "amber" : "default"}>
                          {act.type === "negotiate" ? "协商" : act.type === "complaint" ? "投诉" : act.type === "mediation" ? "调解" : act.type === "arbitration" ? "仲裁" : "诉讼"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><span className="text-gray-400">目标：</span>{act.target}</p>
                        <p><span className="text-gray-400">前置条件：</span>{act.prerequisites.join("、")}</p>
                        <p><span className="text-gray-400">风险：</span>{act.risks.join("；")}</p>
                        <p><span className="text-gray-400">费用：</span>{act.costs} · <span className="text-gray-400">周期：</span>{act.estimatedDuration}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无行动方案数据</p>
            )}
          </Section>

          {/* 10. 来源说明 */}
          <Section title="10. 信息来源说明" defaultOpen={false}>
            <div className="text-xs text-gray-500 leading-relaxed space-y-1">
              <p>本报告所依据的事实信息来源于：</p>
              <p>· 用户输入和口述（标注"用户口述"）</p>
              <p>· 用户上传的文件材料</p>
              <p>· 系统基于已知事实的合理推断（标注"系统推断"）</p>
              <p>· 公开法律法规数据库（法律依据引用）</p>
              <p className="mt-2">所有未确认的事实均已标注相应状态，用户应在使用前逐项核对。</p>
            </div>
          </Section>

          {/* 11. 生成信息 */}
          <Section title="11. 报告生成信息" defaultOpen={false}>
            <div className="text-xs text-gray-500 leading-relaxed space-y-1">
              <p>生成工具：Legal AI Lab v0.1</p>
              <p>生成时间：{new Date().toLocaleString("zh-CN")}</p>
              <p>报告版本：1.0</p>
              <p>案件 ID：{caseInfo?.id ?? "-"}</p>
              <p>基于事实版本：{caseInfo?.factVersionId ?? "current"}</p>
            </div>
          </Section>

          {/* 免责声明 */}
          <div className="rounded-xl border border-gray-200 bg-amber-50/50 px-5 py-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-1">免责声明</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              本报告由 Legal AI Lab 自动生成，仅供参考，不构成法律意见或律师-客户关系。
              报告中的事实信息以用户提供为准，AI 推断内容可能存在误差。
              在做出法律决策前，建议咨询持牌律师。使用本报告即表示您同意
              <a href="#" className="text-primary underline mx-0.5">服务条款</a>和
              <a href="#" className="text-primary underline mx-0.5">隐私政策</a>。
            </p>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
