"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCaseStore } from "@/lib/store";

const DOMAINS = [
  { id: "labor", label: "劳动争议", desc: "欠薪、合同、辞退、社保等" },
  { id: "civil", label: "民事纠纷", desc: "合同纠纷、借贷、侵权等（基础支持）" },
];

const GOALS = [
  { id: "understand", label: "了解规则", desc: "想知道法律怎么规定" },
  { id: "prepare", label: "准备材料", desc: "想整理证据和案件材料" },
  { id: "start_procedure", label: "启动程序", desc: "准备投诉、仲裁或诉讼" },
  { id: "find_lawyer", label: "找律师", desc: "需要推荐律师或法律服务机构" },
];

const PROVINCES = [
  "北京市", "上海市", "广东省", "浙江省", "江苏省",
  "四川省", "湖北省", "湖南省", "福建省", "山东省",
  "河南省", "河北省", "安徽省", "重庆市", "其他省份",
];

const URGENT_ITEMS = [
  { id: "personal_safety", label: "涉及人身安全" },
  { id: "mass_event", label: "群体性事件" },
  { id: "deadline_approaching", label: "临近法定期限" },
  { id: "none", label: "无紧急情况" },
];

function U03Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [domain, setDomain] = useState("labor");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [goal, setGoal] = useState("");
  const [urgent, setUrgent] = useState<string[]>([]);
  const [customProvince, setCustomProvince] = useState("");
  const [showOther, setShowOther] = useState(false);

  const isComplete = domain && province && goal;

  const handleUrgentToggle = (id: string) => {
    if (id === "none") {
      setUrgent(["none"]);
      return;
    }
    setUrgent((prev) => {
      const filtered = prev.filter((x) => x !== "none");
      if (filtered.includes(id)) return filtered.filter((x) => x !== id);
      return [...filtered, id];
    });
  };

  const handleProceed = () => {
    if (!isComplete) return;
    const store = useCaseStore.getState();
    store.setCaseInfo({
      id: `M-${Date.now()}`,
      title: "劳动争议案件",
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      domain,
      province: province === "other" ? customProvince : province,
      city,
      goal,
      urgent: urgent.filter((u) => u !== "none"),
      description: query,
    });
    router.push("/u04");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-primary transition-colors">
            ← 返回
          </button>
          <span className="text-sm font-medium text-gray-900">确认案情基本信息</span>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        {/* 原始问题 */}
        {query && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-8">
            <p className="text-xs text-gray-400 mb-1">您描述的问题</p>
            <p className="text-sm text-gray-700">{query}</p>
          </div>
        )}

        {/* 领域 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-1">问题领域</h2>
          <p className="text-xs text-gray-400 mb-3">系统建议的领域，您可以修改</p>
          <div className="grid grid-cols-2 gap-3">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDomain(d.id)}
                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                  domain === d.id
                    ? "border-primary bg-primary-light/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{d.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
          {domain !== "labor" && (
            <div className="mt-3 bg-amber-50 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-800">
                当前对劳动争议（欠薪）场景提供深度支持。您选择的领域将获得基础材料整理服务，分析深度可能受限。
              </p>
            </div>
          )}
        </section>

        {/* 地区 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-1">案件发生地区</h2>
          <p className="text-xs text-gray-400 mb-3">地区会影响适用的法规和主管机关</p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {PROVINCES.slice(0, 9).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProvince(p);
                  setShowOther(false);
                }}
                className={`text-xs rounded-lg border py-2 transition-colors ${
                  province === p && !showOther
                    ? "border-primary bg-primary-light/30 text-primary"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => {
                setProvince("other");
                setShowOther(true);
              }}
              className={`text-xs rounded-lg border py-2 transition-colors ${
                showOther
                  ? "border-primary bg-primary-light/30 text-primary"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              其他省份
            </button>
          </div>

          {showOther && (
            <input
              type="text"
              value={customProvince}
              onChange={(e) => setCustomProvince(e.target.value)}
              placeholder="请输入省份"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
            />
          )}

          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="城市（选填，我们也可以帮您确认）"
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
          />
        </section>

        {/* 目标 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-1">您当前的目标</h2>
          <p className="text-xs text-gray-400 mb-3">选择最符合您需求的选项</p>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                  goal === g.id
                    ? "border-primary bg-primary-light/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{g.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 紧急事项 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-1">是否存在紧急情况</h2>
          <p className="text-xs text-gray-400 mb-3">可多选，如都不符合请选"无紧急情况"</p>
          <div className="space-y-2">
            {URGENT_ITEMS.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  urgent.includes(item.id)
                    ? "border-primary bg-primary-light/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={urgent.includes(item.id)}
                  onChange={() => handleUrgentToggle(item.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-light"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
          {urgent.includes("personal_safety") || urgent.includes("mass_event") ? (
            <div className="mt-3 bg-red-50 rounded-xl px-4 py-3">
              <p className="text-xs text-red-700">
                您标记了紧急情况。如涉及人身安全，请立即拨打 110；如为群体性事件，建议同时咨询执业律师。
                系统分析可能无法替代紧急法律行动。
              </p>
            </div>
          ) : null}
        </section>

        {/* 提交 */}
        <button
          onClick={handleProceed}
          disabled={!isComplete}
          className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          {isComplete ? "确认信息，开始采集详细事实 →" : "请先选择领域、地区和目标"}
        </button>
      </main>
    </div>
  );
}

export default function U03Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">加载中...</div>}>
      <U03Content />
    </Suspense>
  );
}
