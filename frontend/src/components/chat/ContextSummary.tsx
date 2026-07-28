// ============================================================
// ContextSummary — 对话上下文摘要卡片
// 展示对话中的关键信息摘要
// ============================================================

"use client";

import type { IntentResult } from "@/lib/types";

interface ContextSummaryProps {
  messagesCount: number;
  intent: IntentResult | null;
  collectedFields: Record<string, string>;
  onContinue?: () => void;
}

export default function ContextSummary({
  messagesCount,
  intent,
  collectedFields,
  onContinue,
}: ContextSummaryProps) {
  const fieldCount = Object.keys(collectedFields).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">对话摘要</h3>
        <span className="text-xs text-gray-400">{messagesCount} 条消息</span>
      </div>

      {intent && (
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-400 mb-0.5">已识别问题类型</div>
          <div className="text-sm font-medium text-gray-800">
            {intent.level1} → {intent.level2}
          </div>
        </div>
      )}

      {fieldCount > 0 && (
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-400 mb-0.5">已收集信息</div>
          <div className="text-sm text-gray-800">
            {fieldCount} 项关键信息
          </div>
        </div>
      )}

      {onContinue && (
        <button
          onClick={onContinue}
          className="w-full rounded-lg bg-primary py-2 text-sm text-white hover:bg-[#3C3489] transition-colors"
        >
          查看完整结果 →
        </button>
      )}
    </div>
  );
}
