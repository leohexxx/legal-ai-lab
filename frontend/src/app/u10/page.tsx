"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import { SOURCE_STATUS_LABELS } from "@/lib/types";
import type { Source } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ---- 主页面 ----

export default function U10Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const sources = useCaseStore((s) => s.sources);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && sources.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, sources.length]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="card" message="正在加载法律依据..." />
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
            <h1 className="text-sm font-medium text-gray-900 truncate">法律依据与来源</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* 层级标识 */}
          <div className="rounded-xl bg-primary-light border border-primary/20 px-4 py-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary bg-white rounded-full px-2 py-0.5">
                P0/P1
              </span>
              <span className="text-xs text-primary font-medium">来源白名单</span>
              <span className="text-xs text-primary/60">以下法律依据经审核确认，可直接引用</span>
            </div>
          </div>

          {/* 来源列表 */}
          <div className="space-y-3">
            {sources.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center">
                <p className="text-sm text-gray-400">暂无法律依据</p>
              </div>
            ) : (
              sources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  expanded={expandedId === source.id}
                  onToggle={() => toggleExpand(source.id)}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- 子组件 ----

const STATUS_COLORS: Record<Source["status"], { text: string; bg: string }> = {
  effective: { text: "text-green-700", bg: "bg-green-50" },
  invalid: { text: "text-red-700", bg: "bg-red-50" },
  revised: { text: "text-amber-700", bg: "bg-amber-50" },
  region_mismatch: { text: "text-orange-600", bg: "bg-orange-50" },
  unavailable: { text: "text-gray-500", bg: "bg-gray-100" },
};

function SourceCard({
  source,
  expanded,
  onToggle,
}: {
  source: Source;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sc = STATUS_COLORS[source.status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors">
      {/* 主卡 */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{source.title}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${sc.bg} ${sc.text}`}>
                {SOURCE_STATUS_LABELS[source.status]}
              </span>
            </div>
            {/* 条款 + 机关 */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                {source.articleNo ? `${source.articleNo}` : ""}
              </span>
              <span className="text-xs text-gray-400">{source.authority}</span>
            </div>
            {/* 摘要 */}
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{source.summary}</p>
            {/* 底部信息 */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
              <span>查询日期: {source.queryDate}</span>
              {source.originalUrl && (
                <a href={source.originalUrl} className="text-primary hover:underline">
                  查看原文
                </a>
              )}
            </div>
          </div>
          {/* 展开按钮 */}
          <button
            onClick={onToggle}
            className="text-xs text-gray-400 hover:text-primary transition-colors shrink-0 mt-1"
          >
            {expanded ? "收起" : "详情"}
          </button>
        </div>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
            {source.summary}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-gray-400">
            <span>发布机关：{source.authority}</span>
            <span>条款编号：{source.articleNo}</span>
            <span>效力状态：{SOURCE_STATUS_LABELS[source.status]}</span>
            <span>查询日期：{source.queryDate}</span>
          </div>
        </div>
      )}
    </div>
  );
}
