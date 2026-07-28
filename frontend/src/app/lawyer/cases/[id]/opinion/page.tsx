"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

// ---- Toast 组件 ----

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.3s_ease-out] pointer-events-none">
      <div className="bg-gray-900 text-white text-sm rounded-xl px-6 py-3 shadow-lg">
        {message}
      </div>
    </div>
  );
}

// ---- 提问类型 ----

type QuestionType = "fact" | "evidence" | "procedure";
type QuestionStatus = "pending" | "answered";

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  status: QuestionStatus;
  answer?: string;
  createdAt: string;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  fact: "事实",
  evidence: "证据",
  procedure: "程序",
};

const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  fact: "bg-blue-50 text-blue-700",
  evidence: "bg-amber-50 text-amber-700",
  procedure: "bg-purple-50 text-purple-700",
};

// ---- 模拟数据 ----

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q01",
    question: "2026年1月之前的工资是否都正常发放？请提供最后一次正常发薪的月份和金额。",
    type: "fact",
    status: "answered",
    answer:
      "2025年全年工资都正常发放，每月15,000元。最后一次正常发薪是2025年12月的工资（2026年1月15日发放）。",
    createdAt: "2026-07-27",
  },
  {
    id: "q02",
    question: "请提供2026年1月至6月的银行流水或工资单，以证明实际发放金额。",
    type: "evidence",
    status: "pending",
    createdAt: "2026-07-27",
  },
  {
    id: "q03",
    question: "合同签订主体是A公司，但日常管理、发薪由B公司负责，请确认是否有B公司的工牌、邮件、工作群等证据。",
    type: "fact",
    status: "answered",
    answer:
      "有公司企业微信工作群，群名为'某某科技全员群'，群内有B公司管理人员。另外工牌上写的是B公司名称。",
    createdAt: "2026-07-27",
  },
  {
    id: "q04",
    question: "是否已经就欠薪事宜向劳动监察部门投诉或申请劳动仲裁？如有，请提供案件编号。",
    type: "procedure",
    status: "pending",
    createdAt: "2026-07-28",
  },
];

// ---- 版本记录 ----

interface OpinionVersion {
  id: string;
  content: string;
  createdAt: string;
  status: "draft" | "published";
}

const MOCK_VERSIONS: OpinionVersion[] = [
  {
    id: "v01",
    content:
      "本律师经审阅现有案件材料，初步分析如下：\n\n一、关于劳动关系\n申请人（用户）与北京某某科技有限公司之间存在事实劳动关系，有劳动合同、工资流水等证据佐证。但需注意合同签订主体为A公司，实际管理主体为B公司，建议将两公司列为共同被申请人。\n\n二、关于欠薪事实\n2026年1月至6月期间，公司未足额支付工资。其中1-3月每月仅支付5,000元，4-6月未支付。欠薪总额约75,000元（以逐月核算为准）。\n\n三、法律依据\n根据《劳动合同法》第三十条、第八十五条，用人单位应当按时足额支付劳动报酬。拖欠劳动报酬的，劳动行政部门责令限期支付，逾期不支付的，加付50%-100%赔偿金。\n\n四、行动建议\n建议尽快申请劳动仲裁，同时收集补充银行流水、聊天记录等证据。",
    createdAt: "2026-07-28 10:00",
    status: "published",
  },
  {
    id: "v02",
    content:
      "本律师经审阅现有案件材料，初步分析如下：\n\n一、关于劳动关系\n申请人（用户）与北京某某科技有限公司之间存在事实劳动关系，有劳动合同、工资流水等证据佐证。但需注意合同签订主体为A公司，实际管理主体为B公司，建议将两公司列为共同被申请人。\n\n二、关于欠薪事实\n2026年1月至6月期间，公司未足额支付工资。欠薪总额约75,000元。\n\n三、法律依据\n根据《劳动合同法》第三十条、第八十五条。\n\n四、行动建议\n建议尽快申请劳动仲裁。",
    createdAt: "2026-07-28 09:30",
    status: "draft",
  },
];

// ---- 主页面 ----

export default function OpinionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Tab 状态
  const [activeTab, setActiveTab] = useState<"questions" | "opinion">("questions");

  // 提问功能
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState<QuestionType>("fact");

  // 律师意见功能
  const [opinionContent, setOpinionContent] = useState(MOCK_VERSIONS[0].content);
  const [versions, setVersions] = useState<OpinionVersion[]>(MOCK_VERSIONS);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("published");

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => setToast(msg), []);

  // 提交提问
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const q: Question = {
      id: `q${Date.now()}`,
      question: newQuestion.trim(),
      type: newType,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setQuestions((prev) => [...prev, q]);
    setNewQuestion("");
    setShowNewForm(false);
    showToast("提问已提交");
  };

  // 保存意见草稿
  const handleSaveDraft = () => {
    const newVersion: OpinionVersion = {
      id: `v${Date.now()}`,
      content: opinionContent,
      createdAt: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "draft",
    };
    setVersions((prev) => [newVersion, ...prev]);
    setPublishStatus("draft");
    showToast("草稿已保存");
  };

  // 发布意见
  const handlePublish = () => {
    const newVersion: OpinionVersion = {
      id: `v${Date.now()}`,
      content: opinionContent,
      createdAt: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "published",
    };
    setVersions((prev) => [newVersion, ...prev]);
    setPublishStatus("published");
    showToast("律师意见已发布");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/lawyer/cases/${id}`)}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← 案件审阅
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-gray-900 truncate">
              补充请求和律师意见
            </h1>
            <p className="text-xs text-gray-400">{id}</p>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-gray-100 px-4">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === "questions"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            补充提问
          </button>
          <button
            onClick={() => setActiveTab("opinion")}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === "opinion"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            律师意见
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <main className="flex-1 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* ======== 补充提问 Tab ======== */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              {/* 提问列表 */}
              <div className="space-y-2">
                {questions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-400">暂无补充提问</p>
                  </div>
                ) : (
                  questions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                    >
                      {/* 可折叠头部 */}
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === q.id ? null : q.id)
                        }
                        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                                QUESTION_TYPE_COLORS[q.type]
                              }`}
                            >
                              {QUESTION_TYPE_LABELS[q.type]}
                            </span>
                            <span
                              className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                                q.status === "answered"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {q.status === "answered" ? "已回复" : "待回复"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{q.question}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {q.createdAt}
                          </p>
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 mt-1 shrink-0 transition-transform ${
                            expandedId === q.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* 回复内容（展开时显示） */}
                      {expandedId === q.id && q.answer && (
                        <div className="px-4 pb-3 border-t border-gray-50">
                          <div className="pt-3 pl-3 border-l-2 border-primary-light">
                            <p className="text-xs text-gray-500 mb-1">回复：</p>
                            <p className="text-sm text-gray-700">{q.answer}</p>
                          </div>
                        </div>
                      )}

                      {expandedId === q.id && !q.answer && (
                        <div className="px-4 pb-3 border-t border-gray-50">
                          <p className="pt-3 text-sm text-gray-400">
                            等待用户回复...
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 新增提问 */}
              {showNewForm ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">新增提问</h3>

                  {/* 问题输入 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      问题内容
                    </label>
                    <textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      rows={3}
                      placeholder="请输入需要用户补充的信息..."
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary resize-none"
                    />
                  </div>

                  {/* 类型选择 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      问题类型
                    </label>
                    <div className="flex gap-2">
                      {(["fact", "evidence", "procedure"] as QuestionType[]).map(
                        (t) => (
                          <button
                            key={t}
                            onClick={() => setNewType(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              newType === t
                                ? "bg-primary-light text-primary border-primary"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {QUESTION_TYPE_LABELS[t]}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowNewForm(false);
                        setNewQuestion("");
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddQuestion}
                      disabled={!newQuestion.trim()}
                      className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors disabled:opacity-50"
                    >
                      提交
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full rounded-xl border border-dashed border-gray-200 py-3 text-sm text-gray-400 hover:text-primary hover:border-primary transition-colors"
                >
                  + 新增提问
                </button>
              )}
            </div>
          )}

          {/* ======== 律师意见 Tab ======== */}
          {activeTab === "opinion" && (
            <div className="space-y-6">
              {/* 发布状态 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">状态：</span>
                  <span
                    className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                      publishStatus === "published"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {publishStatus === "published" ? "已发布" : "草稿"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    保存草稿
                  </button>
                  <button
                    onClick={handlePublish}
                    className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-[#3C3489] transition-colors"
                  >
                    发布
                  </button>
                </div>
              </div>

              {/* 意见编辑器 */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">
                  律师意见草稿
                </label>
                <textarea
                  value={opinionContent}
                  onChange={(e) => setOpinionContent(e.target.value)}
                  rows={16}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary resize-y leading-relaxed"
                />
              </div>

              {/* 版本记录 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  版本记录
                </h3>
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {v.createdAt}
                        </span>
                        <span
                          className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                            v.status === "published"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {v.status === "published" ? "已发布" : "草稿"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {v.content.slice(0, 120)}...
                      </p>
                      <button
                        onClick={() => setOpinionContent(v.content)}
                        className="mt-1 text-xs text-primary hover:text-[#3C3489] transition-colors"
                      >
                        恢复此版本
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 底部操作栏 */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={() => showToast("操作已记入案件日志")}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#3C3489] transition-colors"
          >
            确认
          </button>
          <button
            onClick={() => showToast("修改请求已提交")}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            修改
          </button>
          <button
            onClick={() => showToast("已拒绝，案件将退回")}
            className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            拒绝
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
