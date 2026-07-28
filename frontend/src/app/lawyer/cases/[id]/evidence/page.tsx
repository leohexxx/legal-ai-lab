"use client";

import { useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";

// ---- 事实-证据-来源 关联模拟数据 ----

interface FactEvidLink {
  factId: string;
  factLabel: string;
  factValue: string;
  evidence: { id: string; name: string; type: string }[];
  sources: { id: string; title: string; articleNo: string; authority: string }[];
  sufficiency: "sufficient" | "supplement" | "insufficient";
}

const MOCK_LINKS: FactEvidLink[] = [
  {
    factId: "f01",
    factLabel: "用人单位",
    factValue: "北京某某科技有限公司",
    evidence: [
      { id: "e01", name: "劳动合同", type: "合同" },
      { id: "e02", name: "工资流水（部分月份）", type: "银行记录" },
    ],
    sources: [
      {
        id: "s01",
        title: "中华人民共和国劳动合同法",
        articleNo: "第二条",
        authority: "全国人大常委会",
      },
    ],
    sufficiency: "sufficient",
  },
  {
    factId: "f02",
    factLabel: "实际工作地点",
    factValue: "北京市朝阳区",
    evidence: [
      { id: "e01", name: "劳动合同", type: "合同" },
    ],
    sources: [
      {
        id: "s02",
        title: "中华人民共和国劳动争议调解仲裁法",
        articleNo: "第二十一条",
        authority: "全国人大常委会",
      },
    ],
    sufficiency: "sufficient",
  },
  {
    factId: "f03",
    factLabel: "约定月工资",
    factValue: "15,000 元（税前）",
    evidence: [
      { id: "e01", name: "劳动合同", type: "合同" },
    ],
    sources: [
      {
        id: "s03",
        title: "中华人民共和国劳动合同法",
        articleNo: "第三十条",
        authority: "全国人大常委会",
      },
    ],
    sufficiency: "sufficient",
  },
  {
    factId: "f04",
    factLabel: "欠薪期间（1-3月部分发放）",
    factValue: "2026年1-3月每月仅付5,000元",
    evidence: [
      { id: "e03", name: "银行流水（1-3月）", type: "银行记录" },
      { id: "e04", name: "工资条（1-3月）", type: "工资条" },
    ],
    sources: [
      {
        id: "s03",
        title: "中华人民共和国劳动合同法",
        articleNo: "第三十条",
        authority: "全国人大常委会",
      },
      {
        id: "s04",
        title: "中华人民共和国劳动合同法",
        articleNo: "第八十五条",
        authority: "全国人大常委会",
      },
    ],
    sufficiency: "supplement",
  },
  {
    factId: "f05",
    factLabel: "欠薪期间（4-6月未付）",
    factValue: "2026年4-6月未发放任何工资",
    evidence: [
      { id: "e05", name: "银行流水（4-6月）", type: "银行记录", },
    ],
    sources: [
      {
        id: "s03",
        title: "中华人民共和国劳动合同法",
        articleNo: "第三十条",
        authority: "全国人大常委会",
      },
    ],
    sufficiency: "supplement",
  },
  {
    factId: "f06",
    factLabel: "合同主体与实际管理主体不一致",
    factValue: "合同为A公司，实际由B公司管理发薪",
    evidence: [
      { id: "e06", name: "聊天记录（微信截图）", type: "聊天记录" },
    ],
    sources: [
      {
        id: "s05",
        title: "最高人民法院关于审理劳动争议案件适用法律问题的解释（一）",
        articleNo: "第四条",
        authority: "最高人民法院",
      },
    ],
    sufficiency: "insufficient",
  },
];

const SUFFICIENCY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  sufficient: {
    label: "充分",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  supplement: {
    label: "需补充",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  insufficient: {
    label: "不充分",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

// ---- 主页面 ----

export default function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedFact, setSelectedFact] = useState<string>(MOCK_LINKS[0].factId);

  const currentLink = useMemo(
    () => MOCK_LINKS.find((l) => l.factId === selectedFact) ?? MOCK_LINKS[0],
    [selectedFact]
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/lawyer/cases/${id}`)}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← 案件审阅
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900 truncate">
              证据和来源对照
            </h1>
            <p className="text-xs text-gray-400">{id}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* 左列：事实列表 */}
        <section className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="px-3 py-3 border-b border-gray-100">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              事实
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_LINKS.map((link) => {
              const sufficiency = SUFFICIENCY_CONFIG[link.sufficiency];
              return (
                <button
                  key={link.factId}
                  onClick={() => setSelectedFact(link.factId)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedFact === link.factId
                      ? "bg-primary-light/30"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-900">
                      {link.factLabel}
                    </span>
                    <span
                      className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${sufficiency.bg} ${sufficiency.color}`}
                    >
                      {sufficiency.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {link.factValue}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 中列：关联证据 */}
        <section className="flex-1 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              关联证据
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {currentLink.evidence.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">暂无关联证据</p>
              </div>
            ) : (
              currentLink.evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {ev.name}
                    </span>
                    <span className="text-[10px] rounded-full bg-gray-50 text-gray-500 px-1.5 py-0.5">
                      {ev.type}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* 连接线视觉提示 */}
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-gray-100" />
              <svg
                className="w-4 h-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          </div>
        </section>

        {/* 右列：法律来源 */}
        <section className="md:w-80 shrink-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              法律来源
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {currentLink.sources.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">暂无关联法条</p>
              </div>
            ) : (
              currentLink.sources.map((src) => (
                <div
                  key={src.id}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {src.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="rounded-full bg-primary-light/50 text-primary px-1.5 py-0.5 font-medium">
                      {src.articleNo}
                    </span>
                    <span>{src.authority}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* 底部充分度摘要 */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">当前事实充分度：</span>
            <span
              className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                SUFFICIENCY_CONFIG[currentLink.sufficiency].bg
              } ${SUFFICIENCY_CONFIG[currentLink.sufficiency].color}`}
            >
              {SUFFICIENCY_CONFIG[currentLink.sufficiency].label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>
              充分{" "}
              {MOCK_LINKS.filter((l) => l.sufficiency === "sufficient").length}
            </span>
            <span>
              需补充{" "}
              {MOCK_LINKS.filter((l) => l.sufficiency === "supplement").length}
            </span>
            <span>
              不充分{" "}
              {MOCK_LINKS.filter((l) => l.sufficiency === "insufficient").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
