"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import { RISK_LEVEL_LABELS } from "@/lib/types";
import type { RiskFactor } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ---- 主页面 ----

export default function U11Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const risks = useCaseStore((s) => s.risks);
  const caseInfo = useCaseStore((s) => s.caseInfo);

  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && risks.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, risks.length]);

  // 计算总体准备度
  const readiness = useMemo(() => {
    if (risks.length === 0) return 0;
    const scoreMap = { low: 90, medium: 65, high: 40, critical: 20 };
    const total = risks.reduce((sum, r) => sum + scoreMap[r.level], 0);
    return Math.round(total / risks.length);
  }, [risks]);

  const readinessColor =
    readiness >= 80 ? "text-green-600" :
    readiness >= 60 ? "text-amber-600" :
    readiness >= 40 ? "text-orange-600" :
    "text-red-600";

  const readinessBg =
    readiness >= 80 ? "bg-green-50 border-green-200" :
    readiness >= 60 ? "bg-amber-50 border-amber-200" :
    readiness >= 40 ? "bg-orange-50 border-orange-200" :
    "bg-red-50 border-red-200";

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="card" message="正在评估风险..." />
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
            <button onClick={() => router.push("/u06")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 案件工作台</button>
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <ErrorState title="加载失败" message={errorMessage} severity="error" onRetry={() => { setHasError(false); initDemoCase(); }} />
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
            <h1 className="text-sm font-medium text-gray-900 truncate">风险与案件准备度</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* 总体准备度 */}
          <div className={`rounded-xl border ${readinessBg} px-6 py-5 mb-6 text-center`}>
            <div className="text-xs text-gray-500 mb-2">总体准备度</div>
            <div className={`text-5xl font-bold ${readinessColor} mb-2`}>
              {readiness}%
            </div>
            <div className="w-full max-w-xs mx-auto bg-white/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  readiness >= 80 ? "bg-green-500" :
                  readiness >= 60 ? "bg-amber-500" :
                  readiness >= 40 ? "bg-orange-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${readiness}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {readiness >= 80 ? "案件准备充分，建议尽快行动"
                : readiness >= 60 ? "案件基本可行，建议补充材料后行动"
                : readiness >= 40 ? "案件存在较多风险，建议谨慎评估"
                : "案件准备不足，建议全面补充"}
            </p>
          </div>

          {/* 维度网格 */}
          {risks.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center">
              <p className="text-sm text-gray-400">暂无风险评估数据</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {risks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ---- 子组件 ----

const LEVEL_STYLES: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  low: { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  medium: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  high: { bar: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  critical: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const LEVEL_WIDTH: Record<string, number> = {
  low: 20,
  medium: 50,
  high: 75,
  critical: 95,
};

function RiskCard({ risk }: { risk: RiskFactor }) {
  const ls = LEVEL_STYLES[risk.level];
  const width = LEVEL_WIDTH[risk.level];

  return (
    <div className={`rounded-xl border ${ls.border} ${ls.bg} overflow-hidden`}>
      <div className="px-4 py-3">
        {/* 维度名 + 等级 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">{risk.dimension}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ls.bg} ${ls.text} border ${ls.border}`}>
            {RISK_LEVEL_LABELS[risk.level]}
          </span>
        </div>

        {/* 等级进度条 */}
        <div className="w-full bg-white/70 rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full ${ls.bar} transition-all duration-500`}
            style={{ width: `${width}%` }}
          />
        </div>

        {/* 原因 */}
        <div className="text-xs text-gray-600 mb-1">
          <span className="text-gray-400">原因：</span>{risk.reason}
        </div>

        {/* 改进建议 */}
        {risk.improvement && (
          <div className="text-xs text-gray-600">
            <span className="text-gray-400">建议：</span>{risk.improvement}
          </div>
        )}
      </div>
    </div>
  );
}
