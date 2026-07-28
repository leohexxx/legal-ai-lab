// ============================================================
// 加载骨架屏 — 通用加载状态组件
// 支持多种变体：card / table / list / text / page / timeline / money
// ============================================================

"use client";

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "list" | "text" | "page" | "timeline" | "money";
  count?: number;
  message?: string;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <SkeletonBlock className="mb-3 h-5 w-3/5" />
      <SkeletonBlock className="mb-2 h-4 w-full" />
      <SkeletonBlock className="mb-2 h-4 w-4/5" />
      <SkeletonBlock className="mt-3 h-8 w-1/4 rounded-lg" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="flex gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/6" />
        <SkeletonBlock className="h-4 w-1/6" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-gray-50 px-4 py-3">
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-1/6" />
          <SkeletonBlock className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 p-4">
          <SkeletonBlock className="mt-1 h-4 w-4 rounded-full" />
          <div className="flex-1">
            <SkeletonBlock className="mb-2 h-4 w-4/5" />
            <SkeletonBlock className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-11/12" />
      <SkeletonBlock className="h-4 w-4/5" />
      <SkeletonBlock className="h-4 w-3/5" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-8 w-2/5" />
      <SkeletonBlock className="h-4 w-3/5" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <SkeletonBlock className="h-3 w-3 rounded-full" />
            {i < 3 && <SkeletonBlock className="h-full w-0.5" />}
          </div>
          <div className="flex-1 rounded-lg border border-gray-100 p-4">
            <SkeletonBlock className="mb-2 h-4 w-3/5" />
            <SkeletonBlock className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MoneySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-100 p-4">
          <div className="mb-2 flex items-center justify-between">
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-5 w-1/5 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ variant = "text", message }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return <CardSkeleton />;
      case "table":
        return <TableSkeleton />;
      case "list":
        return <ListSkeleton />;
      case "page":
        return <PageSkeleton />;
      case "timeline":
        return <TimelineSkeleton />;
      case "money":
        return <MoneySkeleton />;
      default:
        return <TextSkeleton />;
    }
  };

  return (
    <div className="w-full" role="status" aria-label="加载中">
      {message && <p className="mb-4 text-sm text-gray-500">{message}</p>}
      {renderSkeleton()}
      <span className="sr-only">加载中...</span>
    </div>
  );
}
