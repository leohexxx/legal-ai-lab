"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import { MOCK_LAWYERS, filterLawyers } from "@/lib/lawyers";
import type { Lawyer } from "@/lib/lawyers";

type Step = "info" | "matching" | "preview" | "done";

const SERVICE_TYPES = [
  { id: "consult", label: "法律咨询", desc: "一对一电话/面谈咨询，了解您的权益和应对方案" },
  { id: "doc_review", label: "文书审阅", desc: "律师审阅您的案件材料和证据，出具书面意见" },
  { id: "arbitration", label: "仲裁代理", desc: "律师代理劳动仲裁，全程跟进仲裁程序" },
  { id: "litigation", label: "诉讼代理", desc: "律师代理法院诉讼，处理一审/二审程序" },
  { id: "full", label: "全程委托", desc: "从咨询到仲裁/诉讼全程委托，一站式服务" },
];

export default function U16Page() {
  const router = useRouter();
  const caseInfo = useCaseStore((s) => s.caseInfo);

  const [step, setStep] = useState<Step>("info");
  const [selectedService, setSelectedService] = useState("");
  const [city, setCity] = useState(caseInfo?.province ?? "北京市");
  const [sortBy, setSortBy] = useState<"rating" | "cases" | "fee">("rating");
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [searchCity, setSearchCity] = useState("");

  const matchedLawyers = useMemo(() => {
    let lawyers = filterLawyers({
      city: city || undefined,
      specialties: ["劳动争议"],
      availability: "available",
    });
    if (lawyers.length === 0) {
      // fallback: show all labor lawyers
      lawyers = MOCK_LAWYERS.filter((l) => l.specialties.includes("劳动争议"));
    }
    return [...lawyers].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "cases") return b.caseCount - a.caseCount;
      return a.feeRange.min - b.feeRange.min;
    });
  }, [city, sortBy]);

  const handleConfirmTransfer = () => {
    setStep("done");
    // In production, this would call an API to initiate the transfer
  };

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
            <h1 className="text-sm font-medium text-gray-900 truncate">律师帮助与转交</h1>
            <p className="text-xs text-gray-400">{caseInfo?.id ?? ""}</p>
          </div>
          {/* 步骤指示器 */}
          <div className="flex items-center gap-1.5">
            {(["info", "matching", "preview", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s
                      ? "bg-primary text-white"
                      : ["info", "matching", "preview", "done"].indexOf(step) >= i
                        ? "bg-primary-light text-primary"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {["info", "matching", "preview", "done"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                {i < 3 && <div className="w-4 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* 步骤 1：选择服务类型 */}
          {step === "info" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">选择服务类型</h2>
                <p className="text-sm text-gray-500 mb-4">请选择您需要的法律服务</p>
                <div className="space-y-2">
                  {SERVICE_TYPES.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedService(svc.id)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        selectedService === svc.id
                          ? "border-primary bg-primary-light"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{svc.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{svc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => router.push("/u06")}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  取消
                </button>
                <button
                  disabled={!selectedService}
                  onClick={() => setStep("matching")}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50"
                >
                  下一步：匹配律师
                </button>
              </div>
            </div>
          )}

          {/* 步骤 2：匹配律师 */}
          {step === "matching" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">匹配律师</h2>
                <p className="text-sm text-gray-500 mb-4">
                  根据您的地区和需求，为您推荐以下劳动法律师
                </p>

                {/* 筛选 */}
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className="flex-1 min-w-[160px]">
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="输入城市筛选..."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">排序：</span>
                    {(["rating", "cases", "fee"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                          sortBy === s
                            ? "bg-primary-light text-primary border-primary"
                            : "text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {s === "rating" ? "评分" : s === "cases" ? "案件数" : "费用"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 律师列表 */}
                <div className="space-y-3">
                  {matchedLawyers.map((lawyer) => (
                    <div
                      key={lawyer.id}
                      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                        selectedLawyer?.id === lawyer.id
                          ? "border-primary bg-primary-light"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedLawyer(lawyer)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{lawyer.name}</span>
                            <span className="text-xs text-gray-400">{lawyer.firm}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-amber-500">
                              {"★".repeat(Math.round(lawyer.rating))}{" "}
                              <span className="text-gray-400">{lawyer.rating}</span>
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500">{lawyer.yearsOfExperience} 年经验</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500">{lawyer.caseCount} 件</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{lawyer.bio}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lawyer.tags.map((tag) => (
                              <span key={tag} className="text-[10px] rounded-full bg-gray-50 text-gray-500 px-2 py-0.5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-gray-500">咨询费</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {lawyer.feeRange.min / 1000}k-{lawyer.feeRange.max / 1000}k
                          </div>
                          <div className="text-xs text-gray-400">{lawyer.responseTime}响应</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("info")}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  上一步
                </button>
                <button
                  disabled={!selectedLawyer}
                  onClick={() => setStep("preview")}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50"
                >
                  下一步：确认转交
                </button>
              </div>
            </div>
          )}

          {/* 步骤 3：转交预览 */}
          {step === "preview" && selectedLawyer && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">转交预览</h2>
              <p className="text-sm text-gray-500 mb-4">请在确认前预览将转交给律师的信息</p>

              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="px-4 py-3">
                  <div className="text-xs text-gray-400 mb-1">接收律师</div>
                  <div className="text-sm font-medium text-gray-900">{selectedLawyer.name}</div>
                  <div className="text-xs text-gray-500">{selectedLawyer.firm}</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs text-gray-400 mb-1">服务类型</div>
                  <div className="text-sm text-gray-900">
                    {SERVICE_TYPES.find((s) => s.id === selectedService)?.label}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs text-gray-400 mb-1">转交方式</div>
                  <div className="text-sm text-gray-900">匿名摘要（律师先查看基本信息，确认后再展示详细内容）</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-xs text-gray-400 mb-1">转交内容</div>
                  <ul className="text-sm text-gray-600 space-y-0.5 list-disc list-inside">
                    <li>案件基本信息和事实摘要</li>
                    <li>已确认的事实版本</li>
                    <li>欠薪金额明细</li>
                    <li>事件时间线</li>
                    <li>已有证据清单</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                ⚠️ 律师接收前，对方只能看到匿名摘要信息。您可以在数据控制页面随时撤回转交。
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("matching")}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  上一步
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors"
                >
                  确认转交
                </button>
              </div>
            </div>
          )}

          {/* 步骤 4：完成 */}
          {step === "done" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-600">✓</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">转交请求已发送</h2>
              <p className="text-sm text-gray-500 mb-2">
                您的案件已通过匿名方式转交给 {selectedLawyer?.name} 律师
              </p>
              <p className="text-xs text-gray-400 mb-6">
                律师接受后，您将收到通知。可在案件工作台查看转交状态。
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push("/u06")}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors"
                >
                  返回案件工作台
                </button>
                <button
                  onClick={() => router.push("/u15")}
                  className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  数据与授权管理
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
