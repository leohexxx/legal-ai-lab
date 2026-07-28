"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCaseStore } from "@/lib/store";
import { useChatStore } from "@/lib/chatStore";
import {
  ChatMessage,
  SkipButton,
  ContextSummary,
} from "@/components/chat";
import type { IntakeData, FactItem } from "@/lib/types";

// ============================================================
// 旧版表单模式（8 步流程）
// ============================================================

const STEPS = [
  { id: "employer", title: "用工主体", question: "您的用人单位（公司/老板）全称是什么？" },
  { id: "status", title: "在职状态", question: "您现在还在职吗？" },
  { id: "contract", title: "合同关系", question: "您和公司有签劳动合同吗？" },
  { id: "salary", title: "工资约定", question: "您的工资是怎么约定的？" },
  { id: "arrears", title: "欠薪明细", question: "我们来逐月看看欠薪情况" },
  { id: "evidence", title: "现有证据", question: "您目前有哪些证据？" },
  { id: "actions", title: "已采取的行动", question: "您已经做了哪些事？" },
  { id: "summary", title: "采集汇总", question: "以上是您提供的全部信息" },
];

const INITIAL_DATA: IntakeData = {
  employerName: "",
  workplace: "",
  isEmployerKnown: false,
  isOnJob: "",
  resignationDate: "",
  contractStatus: "",
  contractParty: "",
  actualManager: "",
  salaryType: "",
  baseSalary: "",
  salaryPeriod: "",
  payDay: "",
  arrearsStart: "",
  arrearsEnd: "",
  totalOwed: "",
  hasPaySlip: false,
  hasBankStatement: false,
  hasChatRecord: false,
  hasContract: false,
  hasAttendance: false,
  hasOther: false,
  otherEvidence: "",
  hasComplained: false,
  hasArbitrated: false,
  hasSued: false,
  hasNegotiated: false,
  companyResponse: "",
  goal: "",
  urgentNote: "",
};

// ---- 表单模式组件 ----

function FormMode() {
  const router = useRouter();
  const caseInfo = useCaseStore((s) => s.caseInfo);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(INITIAL_DATA);

  const update = useCallback(<K extends keyof IntakeData>(key: K, value: IntakeData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const handleFinish = () => {
    const store = useCaseStore.getState();
    store.setIntakeData(data);

    const ts = Date.now();
    const facts: FactItem[] = [];

    if (data.employerName) {
      facts.push({ id: `f-${ts}-1`, label: "用人单位", value: data.employerName, status: "confirmed", category: "主体" });
    }
    if (data.workplace) {
      facts.push({ id: `f-${ts}-2`, label: "实际工作地点", value: data.workplace, status: "confirmed", category: "主体" });
    }
    if (data.isOnJob) {
      const statusLabel = data.isOnJob === "yes" ? "在职" : data.isOnJob === "no" ? `已离职${data.resignationDate ? "（" + data.resignationDate + "）" : ""}` : "待确认";
      facts.push({ id: `f-${ts}-3`, label: "在职状态", value: statusLabel, status: "confirmed", category: "状态" });
    }
    if (data.contractStatus) {
      const contractLabel = data.contractStatus === "signed" ? "已签订劳动合同" : data.contractStatus === "unsigned" ? "未签订劳动合同" : "待确认";
      facts.push({ id: `f-${ts}-4`, label: "劳动合同情况", value: contractLabel, status: "confirmed", category: "合同" });
    }
    if (data.baseSalary) {
      facts.push({ id: `f-${ts}-5`, label: "约定工资", value: `${data.baseSalary}/月`, status: "confirmed", category: "工资" });
    }
    facts.push({
      id: `f-${ts}-6`,
      label: "欠薪期间",
      value: `${data.arrearsStart || "?"} 至 ${data.arrearsEnd || "?"}`,
      status: "pending",
      category: "欠薪",
    });
    if (data.totalOwed) {
      facts.push({ id: `f-${ts}-7`, label: "欠薪金额", value: data.totalOwed, status: "pending", category: "欠薪" });
    }
    if (data.contractParty) {
      facts.push({ id: `f-${ts}-8`, label: "合同主体", value: data.contractParty, status: "confirmed", category: "主体" });
    }
    if (data.actualManager) {
      facts.push({ id: `f-${ts}-9`, label: "实际管理方", value: data.actualManager, status: "confirmed", category: "主体" });
    }

    store.setFacts(facts);

    const title = data.employerName && data.employerName !== "暂不确定"
      ? `${data.employerName}欠薪纠纷`
      : (store.caseInfo?.title || "劳动争议案件");
    store.updateCaseInfo({ title, status: "pending_facts" });

    router.push("/u05");
  };

  // 渲染各步骤（保持原逻辑）
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">用人单位全称</label>
              <input
                type="text"
                value={data.employerName}
                onChange={(e) => update("employerName", e.target.value)}
                placeholder="例如：北京某某科技有限公司"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
              <button onClick={() => { update("employerName", "暂不确定"); update("isEmployerKnown", false); goNext(); }} className="mt-2 text-xs text-primary hover:text-[#3C3489]">
                不知道公司全名，先跳过
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">实际工作地点</label>
              <input
                type="text"
                value={data.workplace}
                onChange={(e) => update("workplace", e.target.value)}
                placeholder="省/市/区"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={goNext} className="flex-1 rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">下一步 →</button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            {[
              { value: "yes", label: "在职", desc: "目前还在该公司工作" },
              { value: "no", label: "已离职", desc: "已经办理离职手续" },
              { value: "unknown", label: "不确定", desc: "不清楚是否已解除劳动关系" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { update("isOnJob", opt.value); goNext(); }}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  data.isOnJob === opt.value ? "border-primary bg-primary-light/30" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-400">{opt.desc}</div>
              </button>
            ))}
            {data.isOnJob === "no" && (
              <div className="mt-3">
                <label className="text-sm text-gray-700 mb-1 block">离职日期</label>
                <input
                  type="text"
                  value={data.resignationDate}
                  onChange={(e) => update("resignationDate", e.target.value)}
                  placeholder="例如：2026年3月"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            {[
              { value: "signed", label: "签了书面合同" },
              { value: "unsigned", label: "没签合同" },
              { value: "unknown", label: "不确定/记不清了" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("contractStatus", opt.value)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  data.contractStatus === opt.value ? "border-primary bg-primary-light/30" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-sm text-gray-900">{opt.label}</span>
              </button>
            ))}
            {data.contractStatus && (
              <>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">合同上的公司名称（如果和实际不同）</label>
                  <input type="text" value={data.contractParty} onChange={(e) => update("contractParty", e.target.value)} placeholder="合同上的甲方名称" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">实际谁在管理您的工作（如果和合同不同）</label>
                  <input type="text" value={data.actualManager} onChange={(e) => update("actualManager", e.target.value)} placeholder="实际安排工作的公司或个人" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
                </div>
                <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">下一步 →</button>
              </>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">工资类型</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "fixed", label: "固定工资" },
                  { value: "fixed_plus", label: "底薪+提成" },
                  { value: "performance", label: "绩效工资" },
                  { value: "unknown", label: "不确定" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => update("salaryType", opt.value)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${data.salaryType === opt.value ? "border-primary bg-primary-light/30" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <span className="text-sm text-gray-900">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {data.salaryType && data.salaryType !== "unknown" && (
              <>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">约定工资（每月）</label>
                  <input type="text" value={data.baseSalary} onChange={(e) => update("baseSalary", e.target.value)} placeholder="例如：15000元" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
                </div>
                <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">下一步 →</button>
              </>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl px-4 py-3 mb-2">
              <p className="text-xs text-amber-800">请尽量提供每一期的信息。您不需要一次填完所有欠薪月份，可以先填写大概信息，后续可以补充。</p>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">欠薪开始月份</label>
              <input type="text" value={data.arrearsStart} onChange={(e) => update("arrearsStart", e.target.value)} placeholder="例如：2026年1月" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">欠薪截至月份</label>
              <input type="text" value={data.arrearsEnd} onChange={(e) => update("arrearsEnd", e.target.value)} placeholder="例如：2026年6月" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">大概总共欠了多少</label>
              <input type="text" value={data.totalOwed} onChange={(e) => update("totalOwed", e.target.value)} placeholder="例如：30000元（估算）" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
              <button onClick={() => { update("totalOwed", "暂不确定"); goNext(); }} className="mt-2 text-xs text-primary hover:text-[#3C3489]">不清楚具体金额，先跳过</button>
            </div>
            <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">下一步 →</button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">请勾选您目前拥有的证据材料（可多选）</p>
            {[
              { key: "hasContract", label: "劳动合同" },
              { key: "hasPaySlip", label: "工资条/工资单" },
              { key: "hasBankStatement", label: "银行流水" },
              { key: "hasAttendance", label: "考勤记录" },
              { key: "hasChatRecord", label: "聊天记录（微信等）" },
              { key: "hasOther", label: "其他材料" },
            ].map((item) => (
              <label key={item.key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${(data as any)[item.key] ? "border-primary bg-primary-light/30" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <input type="checkbox" checked={(data as any)[item.key]} onChange={() => update(item.key as keyof IntakeData, !(data as any)[item.key])} className="h-4 w-4 rounded border-gray-300 text-primary" />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
            <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">下一步 →</button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">请勾选您已经采取的行动（可多选）</p>
            {[
              { key: "hasNegotiated", label: "和公司/老板协商过" },
              { key: "hasComplained", label: "向劳动监察部门投诉过" },
              { key: "hasArbitrated", label: "申请过劳动仲裁" },
              { key: "hasSued", label: "已经向法院起诉" },
            ].map((item) => (
              <label key={item.key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${(data as any)[item.key] ? "border-primary bg-primary-light/30" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <input type="checkbox" checked={(data as any)[item.key]} onChange={() => update(item.key as keyof IntakeData, !(data as any)[item.key])} className="h-4 w-4 rounded border-gray-300 text-primary" />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">公司对此事的态度或回复</label>
              <textarea value={data.companyResponse} onChange={(e) => update("companyResponse", e.target.value)} placeholder="公司怎么说？承认欠薪吗？有没有提出解决方案？" rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none" />
            </div>
            <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">下一步 →</button>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 rounded-xl px-4 py-3">
              <p className="text-sm text-green-800 font-medium">✅ 基本信息已采集完成</p>
              <p className="text-xs text-green-700 mt-1">您可以继续或回到任何步骤修改信息。</p>
            </div>
            {caseInfo && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">案件上下文</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-gray-400">领域：</span>
                  <span className="text-gray-700">{caseInfo.domain === "labor" ? "劳动争议" : caseInfo.domain}</span>
                  <span className="text-gray-400">地区：</span>
                  <span className="text-gray-700">{caseInfo.province}{caseInfo.city ? ` · ${caseInfo.city}` : ""}</span>
                  <span className="text-gray-400">目标：</span>
                  <span className="text-gray-700">{caseInfo.goal}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <FormSummaryRow label="用人单位" value={data.employerName || "未填写"} />
              <FormSummaryRow label="工作地点" value={data.workplace || "未填写"} />
              <FormSummaryRow label="在职状态" value={data.isOnJob === "yes" ? "在职" : data.isOnJob === "no" ? "已离职" : "未填写"} />
              <FormSummaryRow label="合同情况" value={data.contractStatus === "signed" ? "已签合同" : data.contractStatus === "unsigned" ? "未签合同" : "未填写"} />
              <FormSummaryRow label="约定工资" value={data.baseSalary || "未填写"} />
              <FormSummaryRow label="欠薪期间" value={`${data.arrearsStart || "?"} 至 ${data.arrearsEnd || "?"}`} />
              <FormSummaryRow label="欠薪总额" value={data.totalOwed || "未填写"} />
            </div>
            <button onClick={handleFinish} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
              确认以上信息，生成案件分析 →
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={goBack} className="text-sm text-gray-400 hover:text-primary transition-colors disabled:opacity-30" disabled={step === 0}>← 上一步</button>
          <span className="text-sm font-medium text-gray-900">{STEPS[step].title}</span>
          <span className="text-xs text-gray-400 ml-auto">第 {step + 1}/{STEPS.length} 步</span>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-medium text-gray-900 mb-6">{STEPS[step].question}</h2>
        {renderStep()}
      </main>
    </div>
  );
}

function FormSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}

// ============================================================
// 对话模式（新默认模式）
// ============================================================

function ChatMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");

  const {
    messages,
    isProcessing,
    currentIntent,
    contextId,
    currentCategoryId,
    collectedFields,
    sendMessage,
    confirmIntent,
    correctIntent,
    skipFollowUp: storeSkip,
    resetChat,
  } = useChatStore();

  // 从 URL 参数获取初始 query 和 categoryId
  const initialQuery = searchParams.get("q") || "";
  const initialCategoryId = searchParams.get("categoryId") || "";

  // 自动触发初始消息
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      // 如果有 categoryId 且 store 中还没有 contextId，说明是首页传过来的识别结果
      if (initialCategoryId) {
        // 直接进入确认流程
        useChatStore.getState().setCurrentCategoryId(initialCategoryId);
        // 显示一个欢迎消息 + 确认提示
        useChatStore.getState().addMessage({
          id: crypto.randomUUID?.() || `msg-${Date.now()}`,
          role: "assistant",
          content: `我理解您的问题是：${initialQuery}\n\n对吗？`,
          createdAt: new Date().toISOString(),
          intent: {
            categoryId: initialCategoryId,
            level1: "",
            level2: "",
            confidence: 0.8,
            extractedKeywords: [],
            summary: initialQuery,
          },
        });
        useChatStore.getState().setIntent({
          categoryId: initialCategoryId,
          level1: "",
          level2: "",
          confidence: 0.8,
          extractedKeywords: [],
          summary: initialQuery,
        });
      } else {
        // 没有 categoryId，做完整意图识别
        sendMessage(initialQuery);
      }
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isProcessing) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmIntent = (categoryId: string) => {
    confirmIntent(categoryId);
  };

  const handleCorrectIntent = () => {
    // 显示一个输入框让用户重新描述
    const newDesc = prompt("请重新描述您的问题：");
    if (newDesc && newDesc.trim()) {
      correctIntent(newDesc.trim());
    }
  };

  const handleFieldResponse = (fieldId: string, value: string) => {
    useChatStore.getState().updateCollectedFields({ [fieldId]: value });

    // 自动发送���息来收集字段
    if (contextId && currentCategoryId) {
      // 把用户的回答当作一条消息发送给 ask API
      const store = useChatStore.getState();
      const updatedFields = { ...store.collectedFields, [fieldId]: value };
      store.updateCollectedFields({ [fieldId]: value });
    }
  };

  const handleSkip = () => {
    storeSkip();
  };

  const handleViewResult = () => {
    router.push("/u05");
  };

  const handleReset = () => {
    resetChat();
    setInputText("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            ← 返回
          </button>
          <span className="text-sm font-medium text-gray-900">对话式咨询</span>

          {/* 右侧操作 */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => router.push("/u04?mode=form")}
              className="text-xs text-primary hover:text-[#3C3489] transition-colors underline underline-offset-2"
            >
              快速填表
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                重新开始
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {/* 空状态提示 */}
          {messages.length === 0 && !initialQuery && (
            <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-light/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-700 mb-2">描述您遇到的法律问题</h2>
              <p className="text-sm text-gray-400 max-w-md">
                您可以在下方输入问题描述，系统会先判断问题类型，然后引导您补充关键信息
              </p>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onConfirmIntent={handleConfirmIntent}
              onCorrectIntent={handleCorrectIntent}
              onSkipFollowUp={handleSkip}
              onFieldResponse={handleFieldResponse}
              isIntentConfirmed={!!contextId}
            />
          ))}

          {/* 上下文摘要（信息收集完成后显示） */}
          {currentIntent && contextId && (
            <div className="mt-4 mb-2">
              <ContextSummary
                messagesCount={messages.length}
                intent={currentIntent}
                collectedFields={collectedFields}
                onContinue={handleViewResult}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 底部输入栏 */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none transition-colors"
              disabled={isProcessing}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className="flex-shrink-0 rounded-xl bg-primary text-white px-5 py-3 text-sm font-medium hover:bg-[#3C3489] disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 页面入口 — 根据 mode 参数切换对话/表单模式
// ============================================================

function U04Content() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode === "form") {
    return <FormMode />;
  }

  return <ChatMode />;
}

export default function U04Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">加载中...</div>}>
      <U04Content />
    </Suspense>
  );
}
