// ============================================================
// IntentTag — 意图分类标签组件
// 展示分类标签，支持确认/纠错
// ============================================================

"use client";

import type { IntentResult } from "@/lib/types";

interface IntentTagProps {
  intent: IntentResult;
  onConfirm: (categoryId: string) => void;
  onCorrect: () => void;
  isConfirmed?: boolean;
  disabled?: boolean;
}

export default function IntentTag({
  intent,
  onConfirm,
  onCorrect,
  isConfirmed = false,
  disabled = false,
}: IntentTagProps) {
  const confidencePercent = Math.round(intent.confidence * 100);
  const confidenceColor =
    intent.confidence >= 0.7
      ? "text-green-600 bg-green-50 border-green-200"
      : intent.confidence >= 0.4
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="rounded-lg border border-primary/30 bg-primary-light/20 px-3.5 py-2.5 space-y-2">
      {/* 分类标签 */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-xs font-medium text-gray-500">系统判断：</span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {intent.level1} → {intent.level2}
        </span>
        {/* 置信度标识 */}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${confidenceColor}`}>
          {confidencePercent}%
        </span>
      </div>

      {/* 备选分类 */}
      {intent.alternativeCategories && intent.alternativeCategories.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs text-gray-400">也可能属于：</span>
          {intent.alternativeCategories.map((alt, idx) => (
            <span key={idx} className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {alt.categoryId.replace(/_/g, "／")}
            </span>
          ))}
        </div>
      )}

      {/* 关键词 */}
      {intent.extractedKeywords.length > 0 && (
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-xs text-gray-400">关键词：</span>
          {intent.extractedKeywords.map((kw, idx) => (
            <span key={idx} className="inline-block rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500 border border-gray-100">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* 确认/纠错按钮 */}
      {!isConfirmed && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onConfirm(intent.categoryId)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            ✅ 正确，继续
          </button>
          <button
            onClick={onCorrect}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            ❌ 不太对，纠正
          </button>
        </div>
      )}
    </div>
  );
}
