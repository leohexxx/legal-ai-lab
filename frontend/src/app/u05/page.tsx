"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCaseStore, initDemoCase } from "@/lib/store";
import type { FactItem } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

function U05Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);

  useEffect(() => {
    try {
      const state = useCaseStore.getState();
      if (state.isHydrated && state.facts.length === 0 && !state.isLoading) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated]);

  // 本地可编辑的事实副本，从 store 初始化
  const [facts, setFacts] = useState<FactItem[]>(() => {
    const state = useCaseStore.getState();
    return state.facts;
  });
  const [showEdit, setShowEdit] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const hasContradiction = facts.some((f) => f.status === "contradiction");

  const handleConfirm = () => {
    const store = useCaseStore.getState();
    store.setFacts(facts);
    store.confirmAllFacts();
    router.push("/u06");
  };

  const handleEdit = (fact: FactItem) => {
    setShowEdit(fact.id);
    setEditValue(fact.value);
  };

  const handleSaveEdit = () => {
    if (showEdit) {
      setFacts((prev) =>
        prev.map((f) => (f.id === showEdit ? { ...f, value: editValue, status: "pending" as const } : f))
      );
      setShowEdit(null);
    }
  };

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
          <LoadingSkeleton variant="list" message="正在整理事实摘要..." />
        </main>
      </div>
    );
  }

  // 错误状态
  if (hasError) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 首页</button>
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
          <ErrorState title="加载失败" message={errorMessage} severity="error" onRetry={() => { setHasError(false); initDemoCase(); }} />
        </main>
      </div>
    );
  }

  // 空状态
  if (facts.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-primary transition-colors">← 首页</button>
          </div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
          <EmptyState icon="📋" title="暂无事实数据" description="请先在引导采集页面填写案件信息" actionLabel="去采集" onAction={() => router.push("/u04")} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-primary transition-colors">
            ← 返回修改
          </button>
          <span className="text-sm font-medium text-gray-900">确认案件事实</span>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-lg font-medium text-gray-900 mb-1">请核对以下信息</h1>
          <p className="text-sm text-gray-500">
            在生成分析结果前，请确认以下事实是否准确。未确认的信息不会用作分析依据。
          </p>
        </div>

        {/* 事实分区 */}
        <div className="space-y-4 mb-8">
          {/* 已确认 */}
          <FactSection
            title="已确认"
            color="green"
            facts={facts.filter((f) => f.status === "confirmed")}
            onEdit={handleEdit}
          />

          {/* 待确认 */}
          <FactSection
            title="待确认"
            color="amber"
            facts={facts.filter((f) => f.status === "pending")}
            onEdit={handleEdit}
          />

          {/* AI 推断 */}
          <FactSection
            title="AI 推断（系统根据已有信息推测）"
            color="blue"
            facts={facts.filter((f) => f.status === "inferred")}
            onEdit={handleEdit}
          />

          {/* 矛盾 */}
          {hasContradiction && (
            <FactSection
              title="⚠️ 存在矛盾"
              color="red"
              facts={facts.filter((f) => f.status === "contradiction")}
              onEdit={handleEdit}
            />
          )}
        </div>

        {/* 编辑弹窗 */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">修改事实</h3>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowEdit(null)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  取消
                </button>
                <button onClick={handleSaveEdit} className="flex-1 rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
                  保存修改
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 操作 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors"
          >
            {hasContradiction ? "我已了解矛盾信息，仍要生成分析" : "确认以上事实，生成分析 →"}
          </button>
          <button
            onClick={() => router.push("/u04")}
            className="w-full rounded-xl border border-gray-200 text-gray-500 py-3 text-sm hover:bg-gray-50 transition-colors"
          >
            返回采集页面修改
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400 text-center">
          事实版本：fv-20260727-001 ｜ 修改历史将保留
        </p>
      </main>
    </div>
  );
}

function FactSection({
  title,
  color,
  facts,
  onEdit,
}: {
  title: string;
  color: "green" | "amber" | "blue" | "red";
  facts: FactItem[];
  onEdit: (fact: FactItem) => void;
}) {
  const colorMap = {
    green: { bg: "bg-green-50", dot: "bg-green-500", text: "text-green-800" },
    amber: { bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-800" },
    blue: { bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-800" },
    red: { bg: "bg-red-50", dot: "bg-red-500", text: "text-red-800" },
  };

  const c = colorMap[color];

  return (
    <div className={`rounded-xl ${c.bg} overflow-hidden`}>
      <div className="px-4 py-2.5 border-b border-white/50 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-xs font-medium ${c.text}`}>
          {title}（{facts.length}）
        </span>
      </div>
      <div className="divide-y divide-white/50">
        {facts.map((fact) => (
          <div key={fact.id} className="px-4 py-2.5 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500">{fact.label}</div>
              <div className="text-sm text-gray-900 mt-0.5">{fact.value}</div>
              {fact.source && <div className="text-xs text-gray-400 mt-0.5">来源：{fact.source}</div>}
            </div>
            <button
              onClick={() => onEdit(fact)}
              className="shrink-0 text-xs text-primary hover:text-[#3C3489] mt-1"
            >
              修改
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function U05Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">加载中...</div>}>
      <U05Content />
    </Suspense>
  );
}
