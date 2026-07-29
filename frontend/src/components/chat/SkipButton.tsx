// ============================================================
// SkipButton — "不补充，直接看结果"按钮
// ============================================================

"use client";

interface SkipButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function SkipButton({ onClick, disabled = false }: SkipButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-500 hover:border-primary hover:text-primary hover:bg-primary-light/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      不补充，直接看结果
    </button>
  );
}
