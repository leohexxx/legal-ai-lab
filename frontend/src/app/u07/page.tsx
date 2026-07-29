"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore, initDemoCase } from "@/lib/store";
import {
  calcMoneyItemTotal,
  calcMoneyItemDiff,
  MONEY_STATUS_LABELS,
} from "@/lib/types";
import type { MoneyItem, MoneyStatus } from "@/lib/types";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

// ---- 新增/编辑弹窗组件 ----

function MoneyItemModal({
  item,
  onSave,
  onClose,
}: {
  item?: MoneyItem;
  onSave: (data: Omit<MoneyItem, "id">) => void;
  onClose: () => void;
}) {
  const empty: Omit<MoneyItem, "id"> = {
    period: "",
    dueDate: "",
    baseSalary: 0,
    commission: 0,
    overtime: 0,
    bonus: 0,
    deduction: 0,
    paidAmount: 0,
    status: "pending",
    notes: "",
  };

  const [form, setForm] = useState(
    item
      ? {
          period: item.period,
          dueDate: item.dueDate,
          baseSalary: item.baseSalary,
          commission: item.commission,
          overtime: item.overtime,
          bonus: item.bonus,
          deduction: item.deduction,
          paidAmount: item.paidAmount,
          status: item.status,
          notes: item.notes ?? "",
        }
      : empty
  );

  const handleSave = () => {
    if (!form.period) return;
    onSave(form);
    onClose();
  };

  const setNum = (field: string, val: string) => {
    const n = parseFloat(val) || 0;
    setForm((f) => ({ ...f, [field]: n }));
  };

  const total = form.baseSalary + form.commission + form.overtime + form.bonus - form.deduction;
  const diff = total - form.paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {item ? "编辑工资期间" : "新增工资期间"}
          </h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* 期间 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">工资期间 *</label>
              <input
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                placeholder="2026-01"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">应付日期</label>
              <input
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                placeholder="2026-01-15"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
              />
            </div>
          </div>

          {/* 工资构成 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">应付工资构成</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "baseSalary", label: "固定工资" },
                { key: "commission", label: "提成" },
                { key: "overtime", label: "加班费" },
                { key: "bonus", label: "奖金" },
                { key: "deduction", label: "扣款" },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400">{f.label}</label>
                  <input
                    type="number"
                    value={form[f.key]}
                    onChange={(e) => setNum(f.key, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 实付 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">实付金额</label>
            <input
              type="number"
              value={form.paidAmount}
              onChange={(e) => setNum("paidAmount", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>

          {/* 自动计算 */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">应付总额</span>
              <span className="font-medium text-gray-900">{total.toLocaleString()} 元</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">实付</span>
              <span className="font-medium text-gray-900">{form.paidAmount.toLocaleString()} 元</span>
            </div>
            <div className="border-t border-gray-200 pt-1 flex justify-between text-sm">
              <span className="text-gray-500">差额</span>
              <span className={`font-semibold ${diff > 0 ? "text-red-600" : "text-gray-900"}`}>
                {diff.toLocaleString()} 元
              </span>
            </div>
          </div>

          {/* 状态 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">状态</label>
            <div className="flex gap-2 flex-wrap">
              {(["confirmed", "estimated", "disputed", "pending"] as MoneyStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.status === s
                      ? s === "confirmed"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : s === "estimated"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : s === "disputed"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {MONEY_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">备注</label>
            <input
              value={form.notes}
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
            disabled={!form.period}
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

export default function U07Page() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isHydrated = useCaseStore((s) => s.isHydrated);
  const isLoading = useCaseStore((s) => s.isLoading);
  const moneyItems = useCaseStore((s) => s.moneyItems);
  const caseInfo = useCaseStore((s) => s.caseInfo);
  const addMoneyItem = useCaseStore((s) => s.addMoneyItem);
  const updateMoneyItem = useCaseStore((s) => s.updateMoneyItem);
  const removeMoneyItem = useCaseStore((s) => s.removeMoneyItem);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // 首次加载没数据时初始化演示数据
  useEffect(() => {
    try {
      const store = useCaseStore.getState();
      if (store.isHydrated && moneyItems.length === 0 && !store.isLoading && !store.caseInfo) {
        initDemoCase();
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : "初始化失败");
    }
  }, [isHydrated, moneyItems.length]);

  const sorted = useMemo(
    () =>
      [...moneyItems].sort((a, b) =>
        sortAsc ? a.period.localeCompare(b.period) : b.period.localeCompare(a.period)
      ),
    [moneyItems, sortAsc]
  );

  const totals = useMemo(() => {
    const t = { totalPayable: 0, totalPaid: 0, totalDiff: 0 };
    moneyItems.forEach((m) => {
      t.totalPayable += calcMoneyItemTotal(m);
      t.totalPaid += m.paidAmount;
      t.totalDiff += calcMoneyItemDiff(m);
    });
    return t;
  }, [moneyItems]);

  const handleAdd = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleSave = (data: Omit<MoneyItem, "id">) => {
    if (editingId) {
      updateMoneyItem(editingId, data);
    } else {
      addMoneyItem({
        id: `m${Date.now()}`,
        ...data,
      });
    }
    setShowModal(false);
    setEditingId(null);
  };

  const editingItem = editingId ? moneyItems.find((m) => m.id === editingId) : undefined;

  // 加载中
  if (!isHydrated || isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="max-w-4xl mx-auto"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></div>
        </div>
        <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
          <LoadingSkeleton variant="money" message="正在加载工资明细..." />
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
            <h1 className="text-sm font-medium text-gray-900 truncate">
              欠薪金额明细
            </h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="px-4 pt-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="应付总额" value={totals.totalPayable} color="text-gray-900" formula="固定+提成+加班+奖金-扣款" />
            <SummaryCard label="实付总额" value={totals.totalPaid} color="text-gray-900" />
            <SummaryCard label="欠薪总额" value={totals.totalDiff} color="text-red-600" formula="应付-实付" />
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {moneyItems.length} 个工资期间
            </span>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="text-xs text-gray-400 hover:text-primary transition-colors"
            >
              {sortAsc ? "最早 ↑" : "最新 ↓"}
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="text-sm font-medium text-primary hover:text-[#3C3489] transition-colors"
          >
            + 新增期间
          </button>
        </div>
      </div>

      {/* 金额列表 */}
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {sorted.length === 0 ? (
            <EmptyState
              variant="compact"
              icon="💰"
              title="暂无工资记录"
              description="点击上方「新增期间」添加第一个工资期间的明细"
              actionLabel="新增期间"
              onAction={handleAdd}
            />
          ) : (
            sorted.map((item) => {
              const total = calcMoneyItemTotal(item);
              const diff = calcMoneyItemDiff(item);
              const st = MONEY_STATUS_LABELS[item.status];
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors"
                >
                  {/* 头部 */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.period}
                      </span>
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                          item.status === "confirmed"
                            ? "bg-green-50 text-green-700"
                            : item.status === "estimated"
                              ? "bg-amber-50 text-amber-700"
                              : item.status === "disputed"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {st}
                      </span>
                      {item.dueDate && (
                        <span className="text-xs text-gray-400">
                          应付日 {item.dueDate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-xs text-gray-400 hover:text-primary transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("确认删除该期间的工资记录？")) {
                            removeMoneyItem(item.id);
                          }
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {/* 金额详情 */}
                  <div className="px-4 py-3">
                    {/* 构成条 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.baseSalary > 0 && (
                        <Chip label="固定" value={item.baseSalary} />
                      )}
                      {item.commission > 0 && (
                        <Chip label="提成" value={item.commission} />
                      )}
                      {item.overtime > 0 && (
                        <Chip label="加班" value={item.overtime} />
                      )}
                      {item.bonus > 0 && (
                        <Chip label="奖金" value={item.bonus} />
                      )}
                      {item.deduction > 0 && (
                        <Chip label="扣款" value={-item.deduction} color="text-red-600" />
                      )}
                    </div>

                    {/* 三栏汇总 */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-xs text-gray-400">应付</div>
                        <div className="text-sm font-medium text-gray-900">
                          {total.toLocaleString()} 元
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-xs text-gray-400">实付</div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.paidAmount.toLocaleString()} 元
                        </div>
                      </div>
                      <div className="rounded-lg bg-red-50 px-3 py-2">
                        <div className="text-xs text-red-400">差额</div>
                        <div className="text-sm font-semibold text-red-600">
                          {diff.toLocaleString()} 元
                        </div>
                      </div>
                    </div>

                    {/* 备注 */}
                    {item.notes && (
                      <p className="mt-2 text-xs text-gray-400">{item.notes}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 弹窗 */}
      {showModal && (
        <MoneyItemModal
          item={editingItem}
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

function SummaryCard({
  label,
  value,
  color,
  formula,
}: {
  label: string;
  value: number;
  color: string;
  formula?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs text-gray-400 mb-0.5">
        {label}
        {formula && (
          <span className="ml-1 text-gray-300 text-[10px]">({formula})</span>
        )}
      </div>
      <div className={`text-base font-bold ${color}`}>
        {value.toLocaleString()} 元
      </div>
    </div>
  );
}

function Chip({
  label,
  value,
  color = "text-gray-700",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs ${color}`}>
      {label}
      <span className="font-medium">
        {value >= 0 ? value.toLocaleString() : `-${Math.abs(value).toLocaleString()}`}
      </span>
    </span>
  );
}
