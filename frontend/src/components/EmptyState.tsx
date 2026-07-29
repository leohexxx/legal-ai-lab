// ============================================================
// 空状态 — 通用空数据状态组件
// 支持多种变体 + 自定义操作按钮
// ============================================================

"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "compact" | "banner";
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
        <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-1 rounded-lg bg-[#534AB7] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#4439A6]"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <span className="text-lg" role="img" aria-hidden="true">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">{title}</p>
          {description && <p className="text-xs text-blue-600">{description}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <span className="text-4xl" role="img" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="max-w-md text-sm text-gray-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 rounded-lg bg-[#534AB7] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4439A6]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
