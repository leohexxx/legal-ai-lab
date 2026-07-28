// ============================================================
// TypingIndicator — 打字状态动画（三个跳动圆点）
// ============================================================

"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400">AI 正在输入</span>
      <div className="flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
