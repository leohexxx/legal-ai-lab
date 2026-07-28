// ============================================================
// 错误状态 — 通用错误/异常状态组件
// 支持重试、折叠详情、多种严重程度
// ============================================================

"use client";

import { useState } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  detail?: string;
  severity?: "error" | "warning" | "info";
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  fullPage?: boolean;
}

const severityConfig = {
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
    title: "text-red-800",
    text: "text-red-600",
    dot: "bg-red-500",
    iconChar: "⚠️",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
    title: "text-amber-800",
    text: "text-amber-600",
    dot: "bg-amber-500",
    iconChar: "⚡",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    title: "text-blue-800",
    text: "text-blue-600",
    dot: "bg-blue-500",
    iconChar: "ℹ️",
  },
};

export default function ErrorState({
  title = "出错了",
  message = "操作无法完成，请稍后重试。",
  detail,
  severity = "error",
  onRetry,
  onDismiss,
  retryLabel = "重试",
  fullPage = false,
}: ErrorStateProps) {
  const [showDetail, setShowDetail] = useState(false);
  const cfg = severityConfig[severity];

  const content = (
    <div
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        <span className={`text-2xl ${cfg.icon}`} role="img" aria-hidden="true">
          {cfg.iconChar}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`text-base font-semibold ${cfg.title}`}>{title}</h3>
          <p className={`mt-1 text-sm ${cfg.text}`}>{message}</p>

          {detail && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetail(!showDetail)}
                className={`text-xs font-medium underline ${cfg.text} hover:opacity-80`}
              >
                {showDetail ? "收起详情" : "查看详情"}
              </button>
              {showDetail && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/60 p-3 text-xs text-gray-600">
                  {detail}
                </pre>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  severity === "error"
                    ? "bg-[#E24B4A] hover:bg-[#CC3333]"
                    : severity === "warning"
                      ? "bg-[#EF9F27] hover:bg-[#D88A1E]"
                      : "bg-[#534AB7] hover:bg-[#4439A6]"
                }`}
              >
                {retryLabel}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-700"
              >
                忽略
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-lg">{content}</div>
      </div>
    );
  }

  return content;
}
