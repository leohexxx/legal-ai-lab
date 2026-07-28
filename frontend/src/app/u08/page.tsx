"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import type { TimelineEvent, EventType } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ---- 事件类型筛选 ----

const ALL_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];
const TYPE_GROUPS = [
  { label: "全部", types: ALL_TYPES },
  { label: "入职", types: ["hire", "contract", "salary_agreed"] },
  { label: "工资", types: ["salary_due", "payment"] },
  { label: "纠纷", types: ["demand", "company_reply", "resignation"] },
  { label: "法律程序", types: ["complaint", "arbitration", "litigation"] },
  { label: "其他", types: ["evidence", "lawyer_opinion"] },
];

// ---- 新增/编辑弹窗 ----

function EventModal({
  event,
  onSave,
  onClose,
}: {
  event?: TimelineEvent;
  onSave: (data: Omit<TimelineEvent, "id">) => void;
  onClose: () => void;
}) {
  const empty: Omit<TimelineEvent, "id"> = {
    type: "demand",
    title: "",
    date: "",
    isEstimated: false,
    description: "",
    relatedParty: "",
    relatedFacts: [],
    relatedEvidence: [],
  };

  const [form, setForm] = useState(
    event
      ? {
          type: event.type,
          title: event.title,
          date: event.date,
          isEstimated: event.isEstimated,
          description: event.description ?? "",
          relatedParty: event.relatedParty ?? "",
          relatedFacts: event.relatedFacts ?? [],
          relatedEvidence: event.relatedEvidence ?? [],
        }
      : empty
  );

  const handleSave = () => {
    if (!form.title || !form.date) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {event ? "编辑事件" : "新增事件"}
          </h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* 事件标题 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">事件标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="发生了什么？"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>

          {/* 事件类型 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">事件类型</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.type === t
                      ? "bg-primary-light text-primary border-primary"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {EVENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                日期 * <span className="text-gray-300 font-normal">(YYYY-MM-DD 或 YYYY-MM)</span>
              </label>
              <input
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                placeholder="2026-01-15"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isEstimated}
                  onChange={(e) => setForm((f) => ({ ...f, isEstimated: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light"
                />
                <span className="text-sm text-gray-500">估算日期</span>
              </label>
            </div>
          </div>

          {/* 关联主体 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">关联主体</label>
            <input
              value={form.relatedParty ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, relatedParty: e.target.value }))}
              placeholder="公司名称或个人"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">详细描述</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="事件的详细经过..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title || !form.date}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 主页面 ----

export default function U08Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const timelineEvents = useCaseStore((s) => s.timelineEvents);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const addTimelineEvent = useCaseStore((s) => s.addTimelineEvent);
  const updateTimelineEvent = useCaseStore((s) => s.updateTimelineEvent);
  const removeTimelineEvent = useCaseStore((s) => s.removeTimelineEvent);

  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [activeGroup, setActiveGroup] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && timelineEvents.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, timelineEvents.length]);

  const filtered = useMemo(() => {
    const types = TYPE_GROUPS[activeGroup]?.types ?? ALL_TYPES;
    const filtered = timelineEvents.filter((e) => types.includes(e.type));
    return [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  }, [timelineEvents, activeGroup]);

  const displayEvents = showAll ? filtered : filtered.slice(0, 10);

  const handleAdd = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleSave = (data: Omit<TimelineEvent, "id">) => {
    if (editingId) {
      updateTimelineEvent(editingId, data);
    } else {
      addTimelineEvent({
        id: `e${Date.now()}`,
        ...data,
      });
    }
    setShowModal(false);
    setEditingId(null);
  };

  const editingEvent = editingId
    ? timelineEvents.find((e) => e.id === editingId)
    : undefined;

  // 时间轴模式需要按年份分组
  const timelineGroups = useMemo(() => {
    const groups: { year: string; events: TimelineEvent[] }[] = [];
    let currentYear = "";
    filtered.forEach((e) => {
      const year = e.date.slice(0, 4);
      if (year !== currentYear) {
        currentYear = year;
        groups.push({ year, events: [] });
      }
      groups[groups.length - 1].events.push(e);
    });
    return groups;
  }, [filtered]);

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="timeline" message="正在加载时间线..." />
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
            <h1 className="text-sm font-medium text-gray-900 truncate">时间线</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
          <button
            onClick={handleAdd}
            className="text-sm font-medium text-primary hover:text-[#3C3489] transition-colors"
          >
            + 新增事件
          </button>
        </div>
      </div>

      {/* 视图切换 + 类型过滤 */}
      <div className="border-b border-gray-100 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 视图切换 */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            <button
              onClick={() => setViewMode("list")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                viewMode === "timeline"
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              时间轴
            </button>
          </div>

          {/* 类型过滤 */}
          <div className="flex overflow-x-auto gap-1.5 py-2">
            {TYPE_GROUPS.map((g, i) => (
              <button
                key={g.label}
                onClick={() => setActiveGroup(i)}
                className={`whitespace-nowrap text-xs rounded-full px-3 py-1.5 font-medium border transition-colors ${
                  activeGroup === i
                    ? "bg-primary-light text-primary border-primary"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* 列表模式 */}
          {viewMode === "list" && (
            <div className="space-y-1 pt-4">
              {displayEvents.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-400 mb-2">暂无事件记录</p>
                  <button
                    onClick={handleAdd}
                    className="text-sm text-primary font-medium hover:text-[#3C3489]"
                  >
                    添加第一个事件
                  </button>
                </div>
              ) : (
                displayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={() => handleEdit(event.id)}
                    onDelete={() => {
                      if (confirm("确认删除该事件？")) {
                        removeTimelineEvent(event.id);
                      }
                    }}
                  />
                ))
              )}
              {!showAll && filtered.length > 10 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full text-center text-sm text-gray-400 py-3 hover:text-primary transition-colors"
                >
                  显示全部 {filtered.length} 个事件
                </button>
              )}
            </div>
          )}

          {/* 时间轴模式 */}
          {viewMode === "timeline" && (
            <div className="pt-6">
              {timelineGroups.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-400">暂无事件记录</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {timelineGroups.map((group) => (
                    <div key={group.year}>
                      {/* 年份标 */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-lg font-bold text-gray-900">{group.year}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      {/* 事件时间轴 */}
                      <div className="space-y-0">
                        {group.events.map((event, idx) => (
                          <div key={event.id} className="flex gap-4">
                            {/* 左侧时间轴 - 视觉元素 */}
                            <div className="flex flex-col items-center w-8 shrink-0">
                              <div
                                className={`w-2.5 h-2.5 rounded-full border-2 ${
                                  event.isEstimated
                                    ? "border-gray-300 bg-white"
                                    : "border-primary bg-primary"
                                } ${idx > 0 ? "" : ""}`}
                              />
                              {idx < group.events.length - 1 && (
                                <div className="w-px flex-1 bg-gray-200" />
                              )}
                            </div>

                            {/* 事件内容 */}
                            <div className="pb-6 flex-1">
                              <div className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-gray-900">
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
                                  <button
                                    onClick={() => handleEdit(event.id)}
                                    className="text-xs text-gray-300 hover:text-primary shrink-0"
                                  >
                                    编辑
                                  </button>
                                </div>

                                {event.description && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {event.description}
                                  </p>
                                )}

                                {event.relatedParty && (
                                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                                    <span>关联：</span>
                                    <span className="rounded-full bg-gray-50 px-2 py-0.5">
                                      {event.relatedParty}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 弹窗 */}
      {showModal && (
        <EventModal
          event={editingEvent}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

// ---- 子组件 ----

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: TimelineEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
      {/* 日期 */}
      <div className="text-right w-16 shrink-0 pt-0.5">
        <div className="text-xs font-medium text-gray-900">{formatDate(event.date)}</div>
        {event.isEstimated && (
          <div className="text-[10px] text-gray-400">估算</div>
        )}
      </div>

      {/* 类型标签 */}
      <span className="text-[10px] rounded-full bg-gray-50 text-gray-500 px-2 py-1 mt-0.5 shrink-0">
        {EVENT_TYPE_LABELS[event.type]}
      </span>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{event.title}</div>
        {event.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
        )}
        {event.relatedParty && (
          <span className="inline-block text-[10px] text-gray-400 bg-gray-50 rounded-full px-1.5 py-0.5 mt-1">
            {event.relatedParty}
          </span>
        )}
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit} className="text-xs text-gray-400 hover:text-primary px-1">
          编辑
        </button>
        <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-500 px-1">
          删除
        </button>
      </div>
    </div>
  );
}

// ---- 工具函数 ----

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
