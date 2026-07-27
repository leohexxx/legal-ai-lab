"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMMON_ISSUES = [
  {
    label: "公司欠我工资",
    desc: "工资未发或少发",
    query: "公司上个月的工资到现在还没发",
  },
  {
    label: "没签劳动合同",
    desc: "入职后一直没签合同",
    query: "入职三个月了公司一直没跟我签劳动合同",
  },
  {
    label: "被公司辞退",
    desc: "被开除或裁员",
    query: "公司突然把我开除了，不给任何补偿",
  },
  {
    label: "加班没给钱",
    desc: "加班费未足额支付",
    query: "公司经常让我加班但不给加班费",
  },
  {
    label: "社保问题",
    desc: "欠缴或少缴社保",
    query: "公司一直没给我交社保",
  },
  {
    label: "工伤赔偿",
    desc: "工作中受伤后赔偿问题",
    query: "我在工作中受伤了，公司不承认是工伤",
  },
];

type PageState = "default" | "inputting" | "identifying" | "identified" | "unrecognized" | "urgent";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pageState, setPageState] = useState<PageState>("default");

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setPageState("identifying");

    // 模拟识别过程
    await new Promise((r) => setTimeout(r, 1200));

    // 识别结果由后端决定，前端先导航到 U03（领域确认页）
    // 把查询文本通过 URL 参数传递
    router.push(`/u03?q=${encodeURIComponent(query.trim())}`);
  };

  const handleScenarioClick = (q: string) => {
    setQuery(q);
    setPageState("inputting");
    // 自动触发
    setTimeout(() => {
      setPageState("identifying");
    }, 300);
    setTimeout(() => {
      router.push(`/u03?q=${encodeURIComponent(q)}`);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 紧急提示 */}
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-sm text-orange-800 text-center">
        ⚠️ 如涉及人身安全、群体性事件或已临近法定期限，请立即咨询执业律师或拨打 12348 法律援助热线
      </div>

      {/* 主内容 */}
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16 max-w-2xl mx-auto w-full">
        {/* 品牌 */}
        <div className="mb-6">
          <span className="text-sm font-medium text-primary bg-primary-light px-3 py-1 rounded-full">
            Legal AI Lab
          </span>
        </div>

        {/* 价值说明 */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 leading-snug mb-2">
          把法律问题变成
          <br />
          可核对、可追溯、可执行的材料
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8 max-w-md">
          描述您遇到的法律问题，系统将引导您梳理事实、收集证据、找到依据，生成结构化的案件材料
        </p>

        {/* 输入区域 */}
        <div className="w-full mb-6">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPageState(e.target.value.trim() ? "inputting" : "default");
              }}
              placeholder="例如：我从去年10月入职一家公司，前三个月工资正常发，但从今年1月开始就只发了一半，到现在还欠我两个月工资..."
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none transition-colors"
              disabled={pageState === "identifying"}
            />
            {/* 状态指示 */}
            {pageState === "identifying" && (
              <div className="absolute right-3 top-3 flex items-center gap-2 text-sm text-primary">
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                正在识别...
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!query.trim() || pageState === "identifying"}
            className="mt-3 w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            {pageState === "identifying" ? "识别中..." : "开始梳理"}
          </button>
        </div>

        {/* 常见问题 */}
        <div className="w-full mb-8">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            常见问题（点击快速开始）
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {COMMON_ISSUES.map((issue) => (
              <button
                key={issue.label}
                onClick={() => handleScenarioClick(issue.query)}
                disabled={pageState === "identifying"}
                className="text-left rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-primary hover:bg-primary-light/30 transition-colors disabled:opacity-50"
              >
                <div className="text-sm font-medium text-gray-900">{issue.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{issue.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 继续已有案件 */}
        <button
          onClick={() => router.push("/u06?case=demo")}
          className="text-sm text-gray-400 hover:text-primary transition-colors underline underline-offset-2"
        >
          继续已有案件 →
        </button>
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
          <span>当前深度支持：劳动争议（欠薪）</span>
          <button
            onClick={() => router.push("/u02")}
            className="hover:text-primary"
          >
            服务边界与隐私
          </button>
          <span>AI 不替代律师，不构成法律意见</span>
        </div>
      </footer>
    </div>
  );
}
