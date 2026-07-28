"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import type { IntakeData, FactItem } from "@/lib/types";

// 8 步流程定义
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

function U04Content() {
  const router = useRouter();
  const caseInfo = useCaseStore((s) => s.caseInfo);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(INITIAL_DATA);
  const [savedSteps, setSavedSteps] = useState<number[]>([0]);

  const update = useCallback(<K extends keyof IntakeData>(key: K, value: IntakeData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      const next = step + 1;
      setStep(next);
      setSavedSteps((prev) => (prev.includes(next) ? prev : [...prev, next]));
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleUnknown = (fields: Partial<IntakeData>) => {
    update("isEmployerKnown" as any, false);
    goNext();
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const handleFinish = () => {
    const store = useCaseStore.getState();

    // 1. Save intake data to store
    store.setIntakeData(data);

    // 2. Generate initial facts from intake data
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

    // 3. Update case info with better title and status
    const title = data.employerName && data.employerName !== "暂不确定"
      ? `${data.employerName}欠薪纠纷`
      : (store.caseInfo?.title || "劳动争议案件");
    store.updateCaseInfo({ title, status: "pending_facts" });

    // 4. Navigate to analysis page
    router.push("/u05");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶栏 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={goBack} className="text-sm text-gray-400 hover:text-primary transition-colors disabled:opacity-30" disabled={step === 0}>
            ← 上一步
          </button>
          <span className="text-sm font-medium text-gray-900">{STEPS[step].title}</span>
          <span className="text-xs text-gray-400 ml-auto">第 {step + 1}/{STEPS.length} 步</span>
        </div>
        {/* 进度条 */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {/* 为什么需要 */}
        <p className="text-xs text-gray-400 mb-2">{getWhyText(step)}</p>

        {/* 问题标题 */}
        <h2 className="text-lg font-medium text-gray-900 mb-6">{STEPS[step].question}</h2>

        {/* 各步骤内容 */}
        {step === 0 && (
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
              <button onClick={goNext} className="flex-1 rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {[
              { value: "yes", label: "在职", desc: "目前还在该公司工作" },
              { value: "no", label: "已离职", desc: "已经办理离职手续" },
              { value: "unknown", label: "不确定", desc: "不清楚是否已解除劳动关系" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { update("isOnJob", opt.value); if (opt.value === "no") setStep(step); goNext(); }}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  data.isOnJob === opt.value
                    ? "border-primary bg-primary-light/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-400">{opt.desc}</div>
              </button>
            ))}
            {/* 如果选了离职，显示离职日期 */}
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
            {data.isOnJob && (
              <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors mt-3">
                下一步 →
              </button>
            )}
          </div>
        )}

        {step === 2 && (
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
                  data.contractStatus === opt.value
                    ? "border-primary bg-primary-light/30"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span className="text-sm text-gray-900">{opt.label}</span>
              </button>
            ))}
            {data.contractStatus && (
              <>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">合同上的公司名称（如果和实际不同）</label>
                  <input
                    type="text"
                    value={data.contractParty}
                    onChange={(e) => update("contractParty", e.target.value)}
                    placeholder="合同上的甲方名称"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">实际谁在管理您的工作（如果和合同不同）</label>
                  <input
                    type="text"
                    value={data.actualManager}
                    onChange={(e) => update("actualManager", e.target.value)}
                    placeholder="实际安排工作的公司或个人"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                  />
                </div>
                <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
                  下一步 →
                </button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
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
                  <button
                    key={opt.value}
                    onClick={() => update("salaryType", opt.value)}
                    className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                      data.salaryType === opt.value
                        ? "border-primary bg-primary-light/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm text-gray-900">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {data.salaryType && data.salaryType !== "unknown" && (
              <>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">约定工资（每月）</label>
                  <input
                    type="text"
                    value={data.baseSalary}
                    onChange={(e) => update("baseSalary", e.target.value)}
                    placeholder="例如：15000元"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">发薪日</label>
                  <input
                    type="text"
                    value={data.payDay}
                    onChange={(e) => update("payDay", e.target.value)}
                    placeholder="例如：每月15日"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                  />
                </div>
                <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
                  下一步 →
                </button>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-xl px-4 py-3 mb-2">
              <p className="text-xs text-amber-800">请尽量提供每一期的信息。您不需要一次填完所有欠薪月份，可以先填写大概信息，后续可以补充。</p>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">欠薪开始月份</label>
              <input
                type="text"
                value={data.arrearsStart}
                onChange={(e) => update("arrearsStart", e.target.value)}
                placeholder="例如：2026年1月"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">欠薪截至月份</label>
              <input
                type="text"
                value={data.arrearsEnd}
                onChange={(e) => update("arrearsEnd", e.target.value)}
                placeholder="例如：2026年6月"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">大概总共欠了多少</label>
              <input
                type="text"
                value={data.totalOwed}
                onChange={(e) => update("totalOwed", e.target.value)}
                placeholder="例如：30000元（估算）"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
              <button onClick={() => { update("totalOwed", "暂不确定"); goNext(); }} className="mt-2 text-xs text-primary hover:text-[#3C3489]">
                不清楚具体金额，先跳过
              </button>
            </div>
            <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
              下一步 →
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">请勾选您目前拥有的证据材料（可多选）</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "hasContract", label: "劳动合同" },
                { key: "hasPaySlip", label: "工资条/工资单" },
                { key: "hasBankStatement", label: "银行流水" },
                { key: "hasAttendance", label: "考勤记录" },
                { key: "hasChatRecord", label: "聊天记录（微信等）" },
                { key: "hasOther", label: "其他材料" },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    (data as any)[item.key]
                      ? "border-primary bg-primary-light/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(data as any)[item.key]}
                    onChange={() => update(item.key as keyof IntakeData, !(data as any)[item.key])}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
            {data.hasOther && (
              <textarea
                value={data.otherEvidence}
                onChange={(e) => update("otherEvidence", e.target.value)}
                placeholder="请说明您还有其他什么材料"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            )}
            <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
              下一步 →
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">请勾选您已经采取的行动（可多选）</p>
            <div className="space-y-3">
              {[
                { key: "hasNegotiated", label: "和公司/老板协商过" },
                { key: "hasComplained", label: "向劳动监察部门投诉过" },
                { key: "hasArbitrated", label: "申请过劳动仲裁" },
                { key: "hasSued", label: "已经向法院起诉" },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    (data as any)[item.key]
                      ? "border-primary bg-primary-light/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(data as any)[item.key]}
                    onChange={() => update(item.key as keyof IntakeData, !(data as any)[item.key])}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">公司对此事的态度或回复</label>
              <textarea
                value={data.companyResponse}
                onChange={(e) => update("companyResponse", e.target.value)}
                placeholder="公司怎么说？承认欠薪吗？有没有提出解决方案？"
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
              />
            </div>
            <button onClick={goNext} className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors">
              下一步 →
            </button>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            {/* 采集汇总 */}
            <div className="bg-green-50 rounded-xl px-4 py-3">
              <p className="text-sm text-green-800 font-medium">✅ 基本信息已采集完成</p>
              <p className="text-xs text-green-700 mt-1">您可以继续或回到任何步骤修改信息。</p>
            </div>

            {/* 案件上下文（来自 U03 的案件基本信息） */}
            {caseInfo && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">案件上下文</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-gray-400">领域：</span>
                  <span className="text-gray-700">{caseInfo.domain === "labor" ? "劳动争议" : caseInfo.domain === "civil" ? "民事纠纷" : caseInfo.domain}</span>
                  <span className="text-gray-400">地区：</span>
                  <span className="text-gray-700">{caseInfo.province}{caseInfo.city ? ` · ${caseInfo.city}` : ""}</span>
                  <span className="text-gray-400">目标：</span>
                  <span className="text-gray-700">
                    {caseInfo.goal === "understand" ? "了解规则" : caseInfo.goal === "prepare" ? "准备材料" : caseInfo.goal === "start_procedure" ? "启动程序" : caseInfo.goal === "find_lawyer" ? "找律师" : caseInfo.goal}
                  </span>
                </div>
              </div>
            )}

            {/* 关键字段摘要 */}
            <div className="space-y-2">
              <SummaryRow label="用人单位" value={data.employerName || "未填写"} />
              <SummaryRow label="工作地点" value={data.workplace || "未填���"} />
              <SummaryRow label="在职状态" value={data.isOnJob === "yes" ? "在职" : data.isOnJob === "no" ? "已离职" : "未填写"} />
              <SummaryRow label="合同情况" value={data.contractStatus === "signed" ? "已签合同" : data.contractStatus === "unsigned" ? "未签合同" : "未填写"} />
              <SummaryRow label="约定工资" value={data.baseSalary || "未填写"} />
              <SummaryRow label="欠薪期间" value={`${data.arrearsStart || "?"} 至 ${data.arrearsEnd || "?"}`} />
              <SummaryRow label="欠薪总额" value={data.totalOwed || "未填写"} />
              <SummaryRow label="证据数量" value={`${[data.hasContract, data.hasPaySlip, data.hasBankStatement, data.hasAttendance, data.hasChatRecord, data.hasOther].filter(Boolean).length} 项`} />
            </div>

            {/* 已保存步骤导航 */}
            <div className="flex flex-wrap gap-2">
              {STEPS.slice(0, -1).map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className="text-xs rounded-full border border-gray-200 px-3 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full rounded-xl bg-primary text-white py-3 text-sm font-medium hover:bg-[#3C3489] transition-colors"
            >
              确认以上信息，生成案件分析 →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}

function getWhyText(step: number): string {
  const why = [
    "用于确定责任主体和管辖地区",
    "影响仲裁时效和申请类型",
    "用于确定劳动关系和举证责任",
    "用于计算欠薪差额",
    "用于生成欠薪明细表",
    "帮您判断哪些可用、哪些需要补充",
    "避免建议重复或无效的行动",
    "您可以在确认前修改任何内容",
  ];
  return why[step] || "";
}

export default function U04Page() {
  return <U04Content />;
}
