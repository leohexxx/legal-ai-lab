"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CaseStatus } from "@/lib/types";

// ============================================================
// 类型
// ============================================================

interface HistoryCase {
  id: string;
  title: string;
  domain: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  summary: string;
}

// ============================================================
// 模拟数据
// ============================================================

const MOCK_HISTORY: HistoryCase[] = [
  {
    id: "M-20260727-001",
    title: "北京某某科技欠薪纠纷",
    domain: "labor",
    status: "generated",
    createdAt: "2026-07-27",
    updatedAt: "2026-07-27 23:00",
    summary: "公司拖欠2026年1月至6月工资，累计约75,000元",
  },
  {
    id: "M-20260720-002",
    title: "上海某某餐饮违法解除劳动合同",
    domain: "labor",
    status: "transferred",
    createdAt: "2026-07-20",
    updatedAt: "2026-07-25 14:30",
    summary: "被公司无故辞退，要求支付违法解除赔偿金及未休年假工资",
  },
  {
    id: "M-20260715-003",
    title: "深圳某某网络公司加班费争议",
    domain: "labor",
    status: "generated",
    createdAt: "2026-07-15",
    updatedAt: "2026-07-22 09:15",
    summary: "长期加班未足额支付加班费，涉及近12个月加班记录",
  },
  {
    id: "M-20260710-004",
    title: "广州某某物流工伤赔偿纠纷",
    domain: "labor",
    status: "draft",
    createdAt: "2026-07-10",
    updatedAt: "2026-07-12 16:45",
    summary: "工作期间受伤，公司拒绝认定为工伤，需收集医疗记录",
  },
  {
    id: "M-20260705-005",
    title: "杭州某某科技竞业限制争议",
    domain: "labor",
    status: "completed",
    createdAt: "2026-07-05",
    updatedAt: "2026-07-18 11:00",
    summary: "离职后公司主张竞业限制违约金，经协商已达成和解",
  },
  {
    id: "M-20260628-006",
    title: "成都某某教育社保欠缴纠纷",
    domain: "labor",
    status: "transferred",
    createdAt: "2026-06-28",
    updatedAt: "2026-07-08 10:20",
    summary: "入职一年公司未依法缴纳社会保险，要求补缴并赔偿损失",
  },
  {
    id: "M-20260620-007",
    title: "北京某某设计公司项目提成争议",
    domain: "labor",
    status: "archived",
    createdAt: "2026-06-20",
    updatedAt: "2026-07-01 08:00",
    summary: "项目完成后公司拒绝支付约定提成，因证据不足暂缓处理",
  },
  {
    id: "M-20260610-008",
    title: "武汉某某制造加班费与欠薪合并纠纷",
    domain: "labor",
    status: "archived",
    createdAt: "2026-06-10",
    updatedAt: "2026-06-25 17:30",
    summary: "同时存在欠薪和加班费问题，因公司进入破产程序暂缓",
  },
];

// ============================================================
// 状态筛选配置
// ============================================================

const STATUS_FILTERS = [
  { id: "all", label: "全部" },
  { id: "draft", label: "草稿" },
  { id: "generated", label: "已生成" },
  { id: "transferred", label: "已转律师" },
] as const;

// ============================================================
// 状态标签映射
// ============================================================

const STATUS_MAP: Record<string, { label: string; variant: "green" | "amber" | "blue" | "red" | "gray" | "default" }> = {
  draft: { label: "草稿", variant: "gray" },
  pending_facts: { label: "待确认事实", variant: "amber" },
  analyzing: { label: "分析中", variant: "amber" },
  generated: { label: "已生成", variant: "green" },
  pending_materials: { label: "待补材料", variant: "amber" },
  ready: { label: "准备行动", variant: "blue" },
  transferred: { label: "已转律师", variant: "blue" },
  completed: { label: "已完成", variant: "green" },
  archived: { label: "已归档", variant: "default" },
};

// ============================================================
// 子组件：状态徽章
// ============================================================

function StatusBadge({ status, archived }: { status: CaseStatus; archived?: boolean }) {
  const info = STATUS_MAP[status] ?? { label: status, variant: "default" as const };
  const variant = archived ? "default" : info.variant;
  const colorMap = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-50 text-gray-600",
    default: "bg-gray-50 text-gray-400",
  };
  return (
    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${colorMap[variant]}`}>
      {archived ? "已归档" : info.label}
    </span>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function U14Page() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = MOCK_HISTORY;

    // 按关键词搜索（标题/编号）
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(kw) ||
          c.id.toLowerCase().includes(kw)
      );
    }

    // 按状态筛选
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    // 排序：未归档在前，按更新时间降序
    return [...list].sort((a, b) => {
      if (a.status === "archived" && b.status !== "archived") return 1;
      if (a.status !== "archived" && b.status === "archived") return -1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [search, statusFilter]);

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
            <h1 className="text-sm font-medium text-gray-900">历史案件</h1>
            <p className="text-xs text-gray-400">
              共 {MOCK_HISTORY.length} 个案件
            </p>
          </div>
        </div>
      </div>

      {/* 搜索与筛选栏 */}
      <div className="border-b border-gray-100 px-4 py-3 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* 搜索框 */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索案件标题或编号..."
              className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === f.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 案件列表 */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-gray-400 mb-2">暂无历史案件</p>
              <p className="text-xs text-gray-300">
                {search
                  ? "未找到匹配的案件，请尝试其他关键词"
                  : "创建一个新案件，它将显示在这里"}
              </p>
            </div>
          ) : (
            filtered.map((c) => {
              const archived = c.status === "archived";
              return (
                <div
                  key={c.id}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    archived
                      ? "border-gray-100 bg-gray-50/50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="px-5 py-4">
                    {/* 标题行 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <h2
                          className={`text-sm font-semibold truncate ${
                            archived ? "text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {c.title}
                        </h2>
                        <p className={`text-xs mt-0.5 ${archived ? "text-gray-300" : "text-gray-400"}`}>
                          {c.id}
                        </p>
                      </div>
                      <StatusBadge status={c.status} archived={archived} />
                    </div>

                    {/* 摘要 */}
                    <p
                      className={`text-xs mb-3 line-clamp-2 ${
                        archived ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {c.summary}
                    </p>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>
                          {c.domain === "labor" ? "劳动法" : c.domain}
                        </span>
                        <span>创建 {c.createdAt}</span>
                        <span>更新 {c.updatedAt}</span>
                      </div>
                      {!archived && (
                        <button
                          onClick={() => router.push("/u06")}
                          className="px-3 py-1.5 text-xs font-medium rounded-xl bg-primary text-white hover:bg-[#3C3489] transition-colors"
                        >
                          继续
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
