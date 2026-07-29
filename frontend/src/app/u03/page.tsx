"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCaseStore } from "@/lib/store";
import { fetchCategories } from "@/lib/api";
import type { KnowledgeCategory } from "@/lib/types";

const PROVINCES = [
  "北京市", "上海市", "广东省", "浙江省", "江苏省",
  "四川省", "湖北省", "湖南省", "福建省", "山东省",
  "河南省", "河北省", "安徽省", "重庆市", "其他省份",
];

const GOALS = [
  { id: "understand", label: "了解规则", desc: "想知道法律怎么规定" },
  { id: "prepare", label: "准备材料", desc: "想整理证据和案件材料" },
  { id: "start_procedure", label: "启动程序", desc: "准备投诉、仲裁或诉讼" },
  { id: "find_lawyer", label: "找律师", desc: "需要推荐律师或法律服务机构" },
];

function U03Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [goal, setGoal] = useState("");
  const [customProvince, setCustomProvince] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isComplete = selectedCategory && province && goal;

  // 加载分类数据
  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "加载分类失败");
        setLoading(false);
      });
  }, []);

  // 按 level1 分组
  const grouped = categories.reduce<Record<string, KnowledgeCategory[]>>((acc, cat) => {
    if (!acc[cat.level1]) acc[cat.level1] = [];
    acc[cat.level1].push(cat);
    return acc;
  }, {});

  const handleProceed = () => {
    if (!isComplete) return;
    const store = useCaseStore.getState();
    store.setCaseInfo({
      id: `M-${Date.now()}`,
      title: "劳动争议案件",
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      domain: "labor",
      province: province === "other" ? customProvince : province,
      city,
      goal,
      urgent: [],
      description: query,
    });
    // 跳转到 U04 对话页，带上 categoryId
    router.push(`/u04?q=${encodeURIComponent(query)}&categoryId=${selectedCategory}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-primary transition-colors">
            ← 返回
          </button>
          <span className="text-sm font-medium text-gray-900">确认问题类型</span>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        {/* 原始问题 */}
        {query && (
          <div className="bg-amber-50 rounded-xl px-4 py-3 mb-8">
            <p className="text-xs text-amber-700 mb-1">我们暂时无法准确识别您的问题，请手动选择分类</p>
            <p className="text-sm text-amber-900">{query}</p>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-gray-400">加载分类中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="bg-red-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 分类选择 */}
        {!loading && Object.keys(grouped).length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-900 mb-3">选择问题类型</h2>
            <div className="space-y-4">
              {Object.entries(grouped).map(([level1, cats]) => (
                <div key={level1}>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{level1}</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {cats.map((cat) => (
                      <button
                        key={cat.categoryId}
                        onClick={() => setSelectedCategory(cat.categoryId)}
                        className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                          selectedCategory === cat.categoryId
                            ? "border-primary bg-primary-light/30"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">{cat.displayName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {cat.keywords.slice(0, 4).join("、")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 地区 */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-900 mb-1">案件发生地区</h2>
          <p className="text-xs text-gray-400 mb-3">地区会影响适用的法规和主管机关</p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {PROVINCES.slice(0, 9).map((p) => (
              <button
                key={p}
                onClick={() => { setProvince(p); setShowOther(false); }}
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
              onClick={() => { setProvince("other"); setShowOther(true); }}
              className={`text-xs rounded-lg border py-2 transition-colors ${
                showOther ? "border-primary bg-primary-light/30 text-primary" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              其他省份
            </button>
          </div>

          {showOther && (
            <input type="text" value={customProvince} onChange={(e) => setCustomProvince(e.target.value)} placeholder="请输入省份" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
          )}

          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="城市（选填）" className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
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
                  goal === g.id ? "border-primary bg-primary-light/30" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{g.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 提交 */}
        <button
          onClick={handleProceed}
          disabled={!isComplete}
          className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          {isComplete ? "确认选择，开始对话咨询 →" : "请先选择问题类型、地区和目标"}
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
