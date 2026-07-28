"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import { EVIDENCE_TYPE_LABELS, EVIDENCE_STATUS_LABELS } from "@/lib/types";
import type { EvidenceItem, EvidenceType, EvidenceStatus } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ---- 新增证据弹窗 ----

function EvidenceModal({
  onSave,
  onClose,
}: {
  onSave: (data: Omit<EvidenceItem, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<EvidenceItem, "id">>({
    name: "",
    type: "other",
    purpose: "",
    status: "existing",
    isOriginal: false,
    notes: "",
  });

  const handleSave = () => {
    if (!form.name || !form.purpose) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">新增证据</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* 证据名称 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">证据名称 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="证据名称"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>

          {/* 证据类型 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">证据类型</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EVIDENCE_TYPE_LABELS) as EvidenceType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.type === t
                      ? "bg-primary-light text-primary border-primary"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {EVIDENCE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* 证明目的 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">证明目的 *</label>
            <input
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder="该证据用于证明什么？"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>

          {/* 原件标记 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOriginal"
              checked={form.isOriginal}
              onChange={(e) => setForm((f) => ({ ...f, isOriginal: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light"
            />
            <label htmlFor="isOriginal" className="text-sm text-gray-600">持有原件</label>
          </div>

          {/* 备注 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">备注</label>
            <input
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="备注信息..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.purpose}
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

export default function U09Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const evidenceItems = useCaseStore((s) => s.evidenceItems);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const addEvidenceItem = useCaseStore((s) => s.addEvidenceItem);
  const removeEvidenceItem = useCaseStore((s) => s.removeEvidenceItem);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && evidenceItems.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, evidenceItems.length]);

  const existing = evidenceItems.filter((e) => e.status === "existing");
  const missing = evidenceItems.filter((e) => e.status === "missing");
  const parsing = evidenceItems.filter((e) => e.status === "parsing");
  const failed = evidenceItems.filter((e) => e.status === "failed");

  const handleAdd = (data: Omit<EvidenceItem, "id">) => {
    addEvidenceItem({ id: `ev${Date.now()}`, ...data });
    setShowModal(false);
  };

  const STATUS_SECTIONS: { key: string; label: string; items: EvidenceItem[]; status: EvidenceStatus }[] = [
    { key: "existing", label: "已有证据", items: existing, status: "existing" },
    { key: "missing", label: "缺失证据", items: missing, status: "missing" },
    { key: "parsing", label: "解析中", items: parsing, status: "parsing" },
    { key: "failed", label: "失败", items: failed, status: "failed" },
  ];

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="list" message="正在加载证据列表..." />
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
            <h1 className="text-sm font-medium text-gray-900 truncate">证据中心</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-medium text-primary hover:text-[#3C3489] transition-colors"
          >
            + 新增证据
          </button>
        </div>
      </div>

      {/* 顶部统计 */}
      <div className="px-4 pt-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="已有" value={existing.length} color="text-green-600" bg="bg-green-50" />
            <StatCard label="缺失" value={missing.length} color="text-red-600" bg="bg-red-50" />
            <StatCard label="解析中" value={parsing.length} color="text-amber-600" bg="bg-amber-50" />
            <StatCard label="失败" value={failed.length} color="text-gray-500" bg="bg-gray-100" />
          </div>
        </div>
      </div>

      {/* 证据分区 */}
      <main className="flex-1 px-4 py-4 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {STATUS_SECTIONS.map((section) => (
            <div key={section.key}>
              <h2 className="text-sm font-medium text-gray-900 mb-3">{section.label}</h2>
              {section.items.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center">
                  <p className="text-xs text-gray-400">暂无{section.label}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <EvidenceCard
                      key={item.id}
                      item={item}
                      onDelete={() => {
                        if (confirm("确认删除该证据？")) {
                          removeEvidenceItem(item.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* 弹窗 */}
      {showModal && (
        <EvidenceModal
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ---- 子组件 ----

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 ${bg} px-3 py-2.5`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

const STATUS_BADGE_COLORS: Record<EvidenceStatus, string> = {
  existing: "bg-green-50 text-green-700",
  missing: "bg-red-50 text-red-700",
  parsing: "bg-amber-50 text-amber-700",
  failed: "bg-gray-100 text-gray-500",
};

function EvidenceCard({ item, onDelete }: { item: EvidenceItem; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* 名称和标签行 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{item.name}</span>
              <span className="text-xs rounded-full bg-gray-50 text-gray-500 px-2 py-0.5">
                {EVIDENCE_TYPE_LABELS[item.type]}
              </span>
              {item.isOriginal && (
                <span className="text-xs rounded-full bg-blue-50 text-blue-600 px-2 py-0.5">
                  原件
                </span>
              )}
            </div>
            {/* 证明目的 */}
            <p className="text-xs text-gray-500 mt-1">{item.purpose}</p>
          </div>
          {/* 状态和操作 */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_BADGE_COLORS[item.status]}`}>
              {EVIDENCE_STATUS_LABELS[item.status]}
            </span>
            <button onClick={onDelete} className="text-xs text-gray-300 hover:text-red-500 transition-colors">
              删除
            </button>
          </div>
        </div>
        {/* 备注 */}
        {item.notes && (
          <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2">{item.notes}</p>
        )}
        {item.privacyRisk && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠ {item.privacyRisk}
          </p>
        )}
      </div>
    </div>
  );
}
