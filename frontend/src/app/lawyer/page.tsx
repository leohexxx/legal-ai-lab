"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// ---- 类型定义 ----

type CaseStatus = "pending" | "reviewing" | "completed";

interface LawyerCase {
  matterId: string;
  title: string;
  domain: string;
  province: string;
  city: string;
  isUrgent: boolean;
  completeness: number;
  status: CaseStatus;
  receivedAt: string;
  lawyerId: string;
}

// ---- 模拟数据 ----

const MOCK_LAWYER_CASES: LawyerCase[] = [
  {
    matterId: "M-20260727-001",
    title: "北京某某科技欠薪纠纷",
    domain: "劳动争议",
    province: "北京市",
    city: "朝阳区",
    isUrgent: true,
    completeness: 85,
    status: "reviewing",
    receivedAt: "2026-07-27",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260725-002",
    title: "上海某某餐饮工伤赔偿",
    domain: "工伤赔偿",
    province: "上海市",
    city: "浦东新区",
    isUrgent: true,
    completeness: 60,
    status: "pending",
    receivedAt: "2026-07-25",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260722-003",
    title: "广州某某科技合同纠纷",
    domain: "合同纠纷",
    province: "广东省",
    city: "广州市",
    isUrgent: false,
    completeness: 95,
    status: "completed",
    receivedAt: "2026-07-22",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260720-004",
    title: "深圳某某制造违法解除",
    domain: "劳动争议",
    province: "广东省",
    city: "深圳市",
    isUrgent: false,
    completeness: 40,
    status: "pending",
    receivedAt: "2026-07-20",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260718-005",
    title: "杭州某某科技竞业限制纠纷",
    domain: "劳动争议",
    province: "浙江省",
    city: "杭州市",
    isUrgent: false,
    completeness: 70,
    status: "reviewing",
    receivedAt: "2026-07-18",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260715-006",
    title: "成都某某建筑工伤认定",
    domain: "工伤赔偿",
    province: "四川省",
    city: "成都市",
    isUrgent: true,
    completeness: 30,
    status: "pending",
    receivedAt: "2026-07-15",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260710-007",
    title: "武汉某某物流欠薪纠纷",
    domain: "劳动争议",
    province: "湖北省",
    city: "武汉市",
    isUrgent: false,
    completeness: 100,
    status: "completed",
    receivedAt: "2026-07-10",
    lawyerId: "L001",
  },
  {
    matterId: "M-20260705-008",
    title: "南京某某咨询社保纠纷",
    domain: "社保纠纷",
    province: "江苏省",
    city: "南京市",
    isUrgent: false,
    completeness: 55,
    status: "completed",
    receivedAt: "2026-07-05",
    lawyerId: "L001",
  },
];

const STATUS_TABS = [
  { id: "all", label: "全部" },
  { id: "pending", label: "待审阅" },
  { id: "reviewing", label: "审阅中" },
  { id: "completed", label: "已完成" },
] as const;

const STATUS_LABELS: Record<CaseStatus, string> = {
  pending: "待审阅",
  reviewing: "审阅中",
  completed: "已完成",
};

const STATUS_COLORS: Record<CaseStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  reviewing: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
};

function CompletenessBar({ value }: { value: number }) {
  const barColor =
    value >= 80 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function LawyerPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    let result = [...MOCK_LAWYER_CASES];

    if (activeTab !== "all") {
      result = result.filter((c) => c.status === activeTab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.matterId.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeTab]);

  const stats = useMemo(() => {
    const pending = MOCK_LAWYER_CASES.filter((c) => c.status === "pending").length;
    const reviewing = MOCK_LAWYER_CASES.filter((c) => c.status === "reviewing").length;
    const completed = MOCK_LAWYER_CASES.filter((c) => c.status === "completed").length;
    return { pending, reviewing, completed };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-gray-900">张明华 律师</h1>
            <span className="text-xs text-gray-400">L001</span>
          </div>
          <p className="text-sm text-gray-500">北京明华律师事务所</p>
        </div>
      </div>

      {/* 统计 */}
      <div className="px-4 pt-4">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
            <div className="text-xs text-amber-700">待审阅</div>
            <div className="text-xl font-bold text-amber-800">{stats.pending}</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
            <div className="text-xs text-blue-700">审阅中</div>
            <div className="text-xl font-bold text-blue-800">{stats.reviewing}</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50/50 px-4 py-3">
            <div className="text-xs text-green-700">已完成</div>
            <div className="text-xl font-bold text-green-800">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* 搜索 */}
      <div className="px-4 pt-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索案件编号、名称、领域..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 状态筛选 */}
      <div className="px-4 pt-3">
        <div className="max-w-5xl mx-auto flex gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap text-xs rounded-full px-3.5 py-1.5 font-medium border transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-light text-primary border-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 案件列表 */}
      <main className="flex-1 px-4 pt-3 pb-8">
        <div className="max-w-5xl mx-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-400">暂无匹配案件</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.matterId}
                onClick={() => router.push(`/lawyer/cases/${c.matterId}`)}
                className={`w-full text-left rounded-xl border bg-white p-4 transition-all hover:shadow-sm ${
                  c.isUrgent
                    ? "border-red-300 hover:border-red-400"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {c.isUrgent && (
                        <span className="text-[10px] font-medium text-red-600 bg-red-50 rounded-full px-2 py-0.5 shrink-0">
                          紧急
                        </span>
                      )}
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {c.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400">{c.matterId}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_COLORS[c.status]}`}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5">
                  <span>{c.domain}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>
                    {c.province} {c.city}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>接收 {c.receivedAt}</span>
                </div>

                <CompletenessBar value={c.completeness} />
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
