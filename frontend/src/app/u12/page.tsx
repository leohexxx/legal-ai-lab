"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import { ACTION_PLAN_TYPE_LABELS } from "@/lib/types";
import type { TodoItem } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ---- 主页面 ----

export default function U12Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const actionPlans = useCaseStore((s) => s.actionPlans);
  const todos = useCaseStore((s) => s.todos);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const toggleTodo = useCaseStore((s) => s.toggleTodo);
  const addTodo = useCaseStore((s) => s.addTodo);

  const [newTodoText, setNewTodoText] = useState("");

  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && actionPlans.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, actionPlans.length]);

  const sortedPlans = [...actionPlans].sort((a, b) => a.priority - b.priority);

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
  const sortedTodos = [...todos].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );

  const handleAddTodo = () => {
    const text = newTodoText.trim();
    if (!text) return;
    addTodo({
      id: `t${Date.now()}`,
      text,
      priority: "medium",
      done: false,
    });
    setNewTodoText("");
  };

  const pendingCount = todos.filter((t) => !t.done).length;

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="card" message="正在加载行动方案..." />
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
            <h1 className="text-sm font-medium text-gray-900 truncate">行动方案与任务</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 行动方案 */}
          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-3">行动方案</h2>
            {sortedPlans.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center">
                <p className="text-sm text-gray-400">暂无行动方案</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </section>

          {/* 待办事项 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">待办事项</h2>
              <span className="text-xs text-gray-400">{pendingCount} 项待完成</span>
            </div>

            {/* 新增待办 */}
            <div className="flex items-center gap-2 mb-3">
              <input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTodo();
                }}
                placeholder="添加新的待办事项..."
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
              />
              <button
                onClick={handleAddTodo}
                disabled={!newTodoText.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50"
              >
                添加
              </button>
            </div>

            {/* 待办列表 */}
            {sortedTodos.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center">
                <p className="text-sm text-gray-400">暂无待办事项</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedTodos.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} onToggle={() => toggleTodo(todo.id)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ---- 子组件 ----

const PLAN_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  negotiate: { bg: "bg-blue-50", text: "text-blue-700" },
  complaint: { bg: "bg-amber-50", text: "text-amber-700" },
  mediation: { bg: "bg-purple-50", text: "text-purple-700" },
  arbitration: { bg: "bg-orange-50", text: "text-orange-700" },
  litigation: { bg: "bg-red-50", text: "text-red-700" },
};

function PlanCard({ plan }: { plan: import("@/lib/types").ActionPlan }) {
  const ts = PLAN_TYPE_STYLES[plan.type];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors">
      <div className="px-4 py-3">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{plan.title}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${ts.bg} ${ts.text}`}>
              {ACTION_PLAN_TYPE_LABELS[plan.type]}
            </span>
            <span className="text-xs text-gray-400">
              优先级 {plan.priority}
            </span>
          </div>
        </div>

        {/* 目标 */}
        <div className="text-xs text-gray-600 mb-2">
          <span className="text-gray-400">目标：</span>{plan.target}
        </div>

        {/* 标签区 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {plan.prerequisites.map((p, i) => (
            <span key={i} className="text-[10px] rounded-full bg-gray-50 text-gray-500 px-2 py-0.5">
              前提: {p}
            </span>
          ))}
          {plan.risks.map((r, i) => (
            <span key={i} className="text-[10px] rounded-full bg-red-50 text-red-600 px-2 py-0.5">
              风险: {r}
            </span>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="flex items-center gap-4 text-[10px] text-gray-400 border-t border-gray-50 pt-2">
          <span>费用：{plan.costs}</span>
          <span>预估时长：{plan.estimatedDuration}</span>
        </div>
      </div>
    </div>
  );
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "重要",
  medium: "一般",
  low: "可延后",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-gray-400",
};

function TodoRow({ todo, onToggle }: { todo: TodoItem; onToggle: () => void }) {
  return (
    <label
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <input
        type="checkbox"
        checked={todo.done}
        onChange={onToggle}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light"
      />
      <span
        className={`text-sm flex-1 ${
          todo.done ? "line-through text-gray-300" : "text-gray-700"
        }`}
      >
        {todo.text}
      </span>
      {!todo.done && (
        <span className={`text-xs ${PRIORITY_COLORS[todo.priority]}`}>
          {PRIORITY_LABELS[todo.priority]}
        </span>
      )}
    </label>
  );
}
