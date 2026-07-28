"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

const CASE_STATUS = [
  { id: "draft", label: "草稿" },
  { id: "pending_facts", label: "待确认事实" },
  { id: "analyzing", label: "分析中" },
  { id: "generated", label: "已生成" },
  { id: "pending_materials", label: "待补材料" },
  { id: "ready", label: "准备行动" },
  { id: "transferred", label: "已转律师" },
];

const RISK_DIMENSIONS: {
  label: string;
  level: string;
  levelColor: "green" | "amber" | "red";
  detail: string;
}[] = [
  { label: "事实完整度", level: "中等", levelColor: "amber", detail: "欠薪期间和金额为估算，缺少逐月明细" },
  { label: "证据充分度", level: "待补", levelColor: "red", detail: "缺少银行流水和考勤记录" },
  { label: "主体明确度", level: "有矛盾", levelColor: "red", detail: "合同主体(A公司)与实际管理主体(B公司)不同" },
  { label: "期限风险", level: "低", levelColor: "green", detail: "在职状态，仲裁时效不受一年限制" },
  { label: "金额明确度", level: "估算", levelColor: "amber", detail: "总金额为用户估算，需逐月核对" },
];

export default function U06Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 从 store 读取数据
  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const facts = useCaseStore((s) => s.facts);
  const todos = useCaseStore((s) => s.todos);
  const toggleTodo = useCaseStore((s) => s.toggleTodo);

  const [activeTab, setActiveTab] = useState("overview");

  // 初始化演示数据
  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && !store.caseInfo && !store.isLoading) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated]);

  // 加载中 — Store 未就绪或演示数据加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="page" message="正在加载案件数据..." />
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
          <ErrorState
            title="加载失败"
            message={errorMessage || "案件数据加载失败，请返回首页重试"}
            severity="error"
            onRetry={() => { setHasError(false); initDemoCase(); }}
            retryLabel="重试"
          />
        </main>
      </div>
    );
  }

  // 空状态 — 没有案件
  if (!caseInfo) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 首页</button>
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <EmptyState
            icon="📂"
            title="暂无案件数据"
            description="请返回首页描述您的法律问题，系统将为您创建案件"
            actionLabel="返回首页"
            onAction={() => router.push("/")}
          />
        </main>
      </div>
    );
  }

  // 从 facts 推导关键信息
  const employerName = facts.find((f) => f.category === "主体" && f.status === "confirmed")?.value || "未知";
  const inferredAmount = facts.find((f) => f.category === "欠薪" && f.status === "inferred");
  const coreAmount = inferredAmount?.value || "未知";
  const amountStatus = inferredAmount ? "估算" : "已确认";
  const mainClaim = coreAmount !== "未知" ? `要求支付拖欠的工资 ${coreAmount}` : "未知";

  const currentStatus = caseInfo?.status || "draft";
  const statusLabel = CASE_STATUS.find((s) => s.id === currentStatus)?.label || currentStatus;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 首页</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900 truncate">{caseInfo?.title || "未命名案件"}</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id || ""}</p>
          </div>
          <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${
            currentStatus === "generated" ? "bg-green-50 text-green-700" :
            currentStatus === "pending_facts" ? "bg-amber-50 text-amber-700" :
            "bg-gray-50 text-gray-600"
          }`}>{statusLabel}</span>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-gray-100 px-4">
        <div className="max-w-4xl mx-auto flex overflow-x-auto gap-0">
          {[
            { id: "overview", label: "总览" },
            { id: "facts", label: "事实" },
            { id: "timeline", label: "时间线", href: "/u08" },
            { id: "amount", label: "金额", href: "/u07" },
            { id: "evidence", label: "证据", href: "/u09" },
            { id: "laws", label: "法律依据", href: "/u10" },
            { id: "actions", label: "行动方案", href: "/u12" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.href ? router.push(tab.href) : setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id ? "border-primary text-primary font-medium" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 关键信息卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard label="对方主体" value={employerName} />
              <InfoCard label="主请求" value={mainClaim} />
              <InfoCard label="核心金额" value={coreAmount} tag={amountStatus} tagColor="amber" />
              <InfoCard label="最近更新" value={caseInfo?.updatedAt || ""} />
            </div>

            {/* 案件准备度 */}
            <div>
              <h2 className="text-sm font-medium text-gray-900 mb-3">案件准备度</h2>
              <div className="space-y-2">
                {RISK_DIMENSIONS.map((risk) => <RiskBar key={risk.label} {...risk} />)}
              </div>
            </div>

            {/* 待办 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-900">待办事项</h2>
                <span className="text-xs text-gray-400">{todos.filter((t) => !t.done).length} 项待完成</span>
              </div>
              {todos.length === 0 ? (
                <EmptyState variant="compact" icon="✅" title="暂无待办事项" />
              ) : (
                <div className="space-y-1">
                  {todos.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <input type="checkbox" checked={item.done} onChange={() => toggleTodo(item.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light" />
                      <span className={`text-sm flex-1 ${item.done ? "line-through text-gray-300" : "text-gray-700"}`}>{item.text}</span>
                      {item.priority === "high" && !item.done && <span className="text-xs text-red-500">重要</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 操作入口 */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push("/u05")} className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center">查看和修改事实</button>
              <button onClick={() => router.push("/u13")} className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center">导出报告</button>
              <button onClick={() => router.push("/u16")} className="rounded-xl bg-primary text-white px-4 py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors text-center">咨询律师</button>
              <button onClick={() => router.push("/u15")} className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center">数据与授权</button>
            </div>

            {/* 快捷导航 */}
            <div>
              <h2 className="text-sm font-medium text-gray-900 mb-3">快速导航</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <QuickLink label="证据中心" href="/u09" />
                <QuickLink label="法律依据" href="/u10" />
                <QuickLink label="风险与准备度" href="/u11" />
                <QuickLink label="行动方案" href="/u12" />
                <QuickLink label="案件报告" href="/u13" />
                <QuickLink label="历史案件" href="/u14" />
                <QuickLink label="数据控制" href="/u15" />
                <QuickLink label="律师转交" href="/u16" />
              </div>
            </div>
          </div>
        )}

        {activeTab !== "overview" && activeTab !== "timeline" && activeTab !== "amount" && activeTab !== "evidence" && activeTab !== "laws" && activeTab !== "actions" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-400 mb-2">此功能即将上线</p>
            <p className="text-xs text-gray-300">{activeTab === "facts" && "详细事实列表，每条标注确认状态"}</p>
          </div>
        )}
        {(activeTab === "timeline" || activeTab === "amount" || activeTab === "evidence" || activeTab === "laws" || activeTab === "actions") && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-400 mb-2">
              {activeTab === "timeline" && "已跳转到时间线页面"}
              {activeTab === "amount" && "已跳转到金额明细页面"}
              {activeTab === "evidence" && "已跳转到证据中心页面"}
              {activeTab === "laws" && "已跳转到法律依据页面"}
              {activeTab === "actions" && "已跳转到行动方案页面"}
            </p>
            <p className="text-xs text-gray-300">点击 Tab 即可返回总览</p>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ label, value, tag, tagColor }: { label: string; value: string; tag?: string; tagColor?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
      {tag && (
        <span className={`inline-block mt-1 text-xs rounded-full px-2 py-0.5 ${tagColor === "amber" ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"}`}>{tag}</span>
      )}
    </div>
  );
}

function RiskBar({ label, level, levelColor, detail }: { label: string; level: string; levelColor: "green" | "amber" | "red"; detail: string }) {
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

function QuickLink({ label, href }: { label: string; href: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(href)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors text-center">{label}</button>
  );
}
