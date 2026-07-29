// ============================================================
// Legal AI Lab — Zustand 全局状态 Store
// S2 共享数据层：支持 localStorage 持久化的案件状态管理
// ============================================================

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActionPlan,
  Case,
  CaseState,
  EvidenceItem,
  FactItem,
  MoneyItem,
  RiskFactor,
  Source,
  TimelineEvent,
  TodoItem,
  IntakeData,
} from "@/lib/types";

// ---- Store 接口 ----

interface CaseStore extends CaseState {
  // 加载状态
  isHydrated: boolean;
  isLoading: boolean;
  setHydrated: () => void;
  setLoading: (v: boolean) => void;

  // 案件基本信息
  setCaseInfo: (info: Case) => void;
  updateCaseInfo: (partial: Partial<Case>) => void;

  // 事实
  setFacts: (facts: FactItem[]) => void;
  updateFact: (id: string, partial: Partial<FactItem>) => void;
  confirmAllFacts: () => void;

  // 金额明细
  setMoneyItems: (items: MoneyItem[]) => void;
  addMoneyItem: (item: MoneyItem) => void;
  updateMoneyItem: (id: string, partial: Partial<MoneyItem>) => void;
  removeMoneyItem: (id: string) => void;

  // 时间线
  setTimelineEvents: (events: TimelineEvent[]) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  updateTimelineEvent: (id: string, partial: Partial<TimelineEvent>) => void;
  removeTimelineEvent: (id: string) => void;

  // 待办
  setTodos: (todos: TodoItem[]) => void;
  toggleTodo: (id: string) => void;

  // 采集数据
  setIntakeData: (data: IntakeData) => void;

  // 证据
  setEvidenceItems: (items: EvidenceItem[]) => void;
  addEvidenceItem: (item: EvidenceItem) => void;
  updateEvidenceItem: (id: string, partial: Partial<EvidenceItem>) => void;
  removeEvidenceItem: (id: string) => void;

  // 法律来源
  setSources: (sources: Source[]) => void;

  // 风险
  setRisks: (risks: RiskFactor[]) => void;

  // 行动方案
  setActionPlans: (plans: ActionPlan[]) => void;

  // 待办
  addTodo: (todo: TodoItem) => void;

  // 重置
  resetCase: () => void;
}

// ---- 初始状态 ----

const INITIAL_STATE: CaseState & { isHydrated: boolean; isLoading: boolean } = {
  caseInfo: null,
  parties: [],
  facts: [],
  factVersions: [],
  moneyItems: [],
  timelineEvents: [],
  evidenceItems: [],
  sources: [],
  risks: [],
  actionPlans: [],
  todos: [],
  intakeData: null,
  isHydrated: false,
  isLoading: false,
};

// ---- 默认演示数据（用于首次创建案件时预填） ----

const DEMO_CASE_INFO: Case = {
  id: "M-20260727-001",
  title: "北京某某科技欠薪纠纷",
  status: "generated",
  createdAt: "2026-07-27",
  updatedAt: "2026-07-27 23:00",
  domain: "labor",
  province: "北京市",
  city: "朝阳区",
  goal: "prepare",
  urgent: [],
  description: "公司上个月的工资到现在还没发",
};

const DEMO_FACTS: FactItem[] = [
  { id: "f01", label: "用人单位", value: "北京某某科技有限公司", status: "confirmed", category: "主体" },
  { id: "f02", label: "实际工作地点", value: "北京市朝阳区", status: "confirmed", category: "主体" },
  { id: "f03", label: "在职状态", value: "在职", status: "confirmed", category: "状态" },
  { id: "f04", label: "劳动合同", value: "已签订固定期限劳动合同", status: "confirmed", category: "合同" },
  { id: "f05", label: "约定月工资", value: "15,000 元（税前）", status: "confirmed", category: "工资" },
  { id: "f06", label: "发薪日", value: "每月 15 日", status: "confirmed", category: "工资" },
  { id: "f07", label: "欠薪期间", value: "2026年1月至2026年6月", status: "pending", category: "欠薪", source: "用户口述" },
  { id: "f08", label: "每月应付", value: "15,000 元", status: "pending", category: "工资", source: "根据约定工资推算" },
  { id: "f09", label: "每月实付", value: "2026年1-3月实付5,000元/月，4-6月未付", status: "pending", category: "欠薪", source: "用户口述" },
  { id: "f10", label: "欠薪总额（估算）", value: "约 75,000 元", status: "inferred", category: "欠薪", source: "系统根据应付实付估算" },
  { id: "f11", label: "合同主体与实际管理主体不一致", value: "合同为A公司，实际由B公司管理发薪", status: "contradiction", category: "主体", source: "用户口述与合同信息对比" },
];

const DEMO_MONEY_ITEMS: MoneyItem[] = [
  { id: "m01", period: "2026-01", dueDate: "2026-01-15", baseSalary: 15000, commission: 2000, overtime: 1500, bonus: 0, deduction: 500, paidAmount: 5000, status: "confirmed", notes: "1月只发了部分" },
  { id: "m02", period: "2026-02", dueDate: "2026-02-15", baseSalary: 15000, commission: 0, overtime: 1200, bonus: 0, deduction: 500, paidAmount: 5000, status: "confirmed", notes: "2月只发了部分" },
  { id: "m03", period: "2026-03", dueDate: "2026-03-15", baseSalary: 15000, commission: 1500, overtime: 1800, bonus: 0, deduction: 500, paidAmount: 5000, status: "confirmed", notes: "3月只发了部分" },
  { id: "m04", period: "2026-04", dueDate: "2026-04-15", baseSalary: 15000, commission: 0, overtime: 1000, bonus: 0, deduction: 500, paidAmount: 0, status: "estimated", notes: "4月未付" },
  { id: "m05", period: "2026-05", dueDate: "2026-05-15", baseSalary: 15000, commission: 0, overtime: 0, bonus: 0, deduction: 500, paidAmount: 0, status: "pending", notes: "5月未付" },
  { id: "m06", period: "2026-06", dueDate: "2026-06-15", baseSalary: 15000, commission: 0, overtime: 0, bonus: 0, deduction: 500, paidAmount: 0, status: "pending", notes: "6月未付" },
];

const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  { id: "e01", type: "hire", title: "入职公司", date: "2024-10-01", isEstimated: false, description: "入职北京某某科技有限公司" },
  { id: "e02", type: "contract", title: "签订劳动合同", date: "2024-10-15", isEstimated: false, relatedParty: "北京某某科技有限公司", description: "签订固定期限劳动合同" },
  { id: "e03", type: "salary_agreed", title: "约定月工资15,000元", date: "2024-10-15", isEstimated: false, description: "合同约定月工资15,000元（税前），每月15日发薪" },
  { id: "e04", type: "salary_due", title: "1月工资到期", date: "2026-01-15", isEstimated: false, description: "1月工资应付日" },
  { id: "e05", type: "payment", title: "1月仅发放5,000元", date: "2026-01-20", isEstimated: false, relatedParty: "北京某某科技有限公司", description: "仅发放部分工资，未足额发放" },
  { id: "e06", type: "demand", title: "开始催讨工资", date: "2026-02", isEstimated: true, description: "开始向公司催讨拖欠工资" },
  { id: "e07", type: "company_reply", title: "公司推脱", date: "2026-03", isEstimated: true, relatedParty: "北京某某科技有限公司", description: "公司以资金周转困难为由推脱" },
];

const DEMO_TODOS: TodoItem[] = [
  { id: "t01", text: "补充银行流水（近6个月）", priority: "high", done: false },
  { id: "t02", text: "确认合同主体与实际用工主体关系", priority: "high", done: false },
  { id: "t03", text: "逐月核对欠薪期间和金额", priority: "medium", done: false },
  { id: "t04", text: "保存和整理聊天记录等沟通证据", priority: "medium", done: false },
  { id: "t05", text: "确认是否需要申请劳动仲裁", priority: "low", done: false },
];

const DEMO_EVIDENCE_ITEMS: EvidenceItem[] = [
  { id: "ev01", name: "劳动合同", type: "contract", purpose: "证明劳动关系及工资约定", status: "existing", isOriginal: true },
  { id: "ev02", name: "2026年1-3月工资单", type: "payslip", purpose: "证明工资标准及已发金额", status: "existing", isOriginal: false },
  { id: "ev03", name: "近6个月银行流水", type: "bank_statement", purpose: "证明实际工资发放记录", status: "missing", isOriginal: false, notes: "需联系银行打印" },
  { id: "ev04", name: "微信沟通记录", type: "chat", purpose: "证明催讨工资过程", status: "existing", isOriginal: false, privacyRisk: "包含部分个人信息" },
  { id: "ev05", name: "考勤记录", type: "attendance", purpose: "证明实际出勤情况", status: "missing", isOriginal: false },
  { id: "ev06", name: "与HR通话录音", type: "recording", purpose: "证明公司承认欠薪", status: "parsing", isOriginal: true },
  { id: "ev07", name: "公司办公场所照片", type: "photo", purpose: "辅助证明实际工作地点", status: "failed", isOriginal: false, notes: "照片不清晰，需重新拍摄" },
];

const DEMO_SOURCES: Source[] = [
  { id: "s01", title: "中华人民共和国劳动法", authority: "全国人大常委会", articleNo: "第五十条", status: "effective", queryDate: "2026-07-27", summary: "工资应当以货币形式按月支付给劳动者本人。不得克扣或者无故拖欠劳动者的工资。", originalUrl: "#" },
  { id: "s02", title: "中华人民共和国劳动合同法", authority: "全国人大常委会", articleNo: "第八十五条", status: "effective", queryDate: "2026-07-27", summary: "用人单位克扣或者无故拖欠劳动者工资的，劳动行政部门责令限期支付；逾期不支付的，责令按应付金额百分之五十以上百分之一百以下的标准加付赔偿金。", originalUrl: "#" },
  { id: "s03", title: "中华人民共和国劳动合同法", authority: "全国人大常委会", articleNo: "第三十条", status: "effective", queryDate: "2026-07-27", summary: "用人单位应当按照劳动合同约定和国家规定，及时足额支付劳动报酬。", originalUrl: "#" },
  { id: "s04", title: "工资支付暂行规定", authority: "劳动部", articleNo: "第七条", status: "effective", queryDate: "2026-07-27", summary: "工资必须在用人单位与劳动者约定的日期支付。如遇节假日或休息日，则应提前在最近的工作日支付。", originalUrl: "#" },
  { id: "s05", title: "最高人民法院关于审理劳动争议案件适用法律问题的解释（一）", authority: "最高人民法院", articleNo: "第四十五条", status: "effective", queryDate: "2026-07-27", summary: "用人单位克扣或者无故拖欠劳动者工资，迫使劳动者提出解除劳动合同的，用人单位应当支付经济补偿。", originalUrl: "#" },
  { id: "s06", title: "中华人民共和国劳动合同法", authority: "全国人大常委会", articleNo: "第十条", status: "effective", queryDate: "2026-07-27", summary: "建立劳动关系，应当订立书面劳动合同。已建立劳动关系，未同时订立书面劳动合同的，应当自用工之日起一个月内订立书面劳动合同。", originalUrl: "#" },
];

const DEMO_RISKS: RiskFactor[] = [
  { id: "r01", dimension: "事实完整度", level: "medium", reason: "欠薪期间和金额目前为估算，缺少逐月明细确认", improvement: "逐月核对工资单、银行流水，完善欠薪期间的具体金额" },
  { id: "r02", dimension: "证据充分度", level: "high", reason: "缺少银行流水和考勤记录两项关键证据", improvement: "尽快联系银行打印近6个月流水，向公司申请调取考勤记录" },
  { id: "r03", dimension: "主体明确度", level: "critical", reason: "合同主体(A公司)与实际管理主体(B公司)不一致，可能影响责任认定", improvement: "收集A公司与B公司关联关系的证据，考虑将两公司列为共同被申请人" },
  { id: "r04", dimension: "金额明确度", level: "medium", reason: "欠薪总额为估算值，每月工资构成暂不明确", improvement: "整理每月工资构成明细，与公司核对提成和加班费计算标准" },
  { id: "r05", dimension: "期限风险", level: "low", reason: "目前仍在职，仲裁时效未开始计算", improvement: "如计划离职，需注意离职后一年内提起仲裁" },
  { id: "r06", dimension: "执行可能", level: "high", reason: "公司经营状况不明，存在执行不到位的风险", improvement: "尽快采取行动，关注公司经营动态，必要时申请财产保全" },
  { id: "r07", dimension: "法律适用", level: "medium", reason: "合同签订方与实际用工方不同，涉及劳务派遣或借调关系的法律适用问题", improvement: "进一步明确A公司与B公司的法律关系，确定适用的法律条款" },
];

const DEMO_ACTION_PLANS: ActionPlan[] = [
  { id: "a01", title: "与公司协商解决", type: "negotiate", prerequisites: ["整理欠薪金额明细", "收集基本证据"], target: "要求公司支付拖欠工资 75,000 元", risks: ["协商无果可能拖延时间"], costs: "零成本", estimatedDuration: "1-2 周", priority: 1 },
  { id: "a02", title: "向劳动监察投诉", type: "complaint", prerequisites: ["欠薪事实明确", "有初步证据"], target: "通过劳动监察介入责令公司支付工资", risks: ["劳动监察处理周期较长"], costs: "零成本", estimatedDuration: "2-4 周", priority: 2 },
  { id: "a03", title: "申请劳动仲裁", type: "arbitration", prerequisites: ["收集全部证据", "明确仲裁请求"], target: "裁决公司支付拖欠工资及经济补偿", risks: ["需要时间精力参与仲裁程序"], costs: "仲裁费约 500 元", estimatedDuration: "1-3 个月", priority: 3 },
  { id: "a04", title: "提起诉讼", type: "litigation", prerequisites: ["仲裁裁决不服或仲裁前置程序完成"], target: "法院判决公司支付工资及赔偿金", risks: ["诉讼周期长、成本高"], costs: "诉讼费约 2,000 元", estimatedDuration: "3-6 个月", priority: 4 },
];

// ---- Store 实现 ----

export const useCaseStore = create<CaseStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // 加载状态
      setHydrated: () => set({ isHydrated: true }),
      setLoading: (v) => set({ isLoading: v }),

      setCaseInfo: (info) => set({ caseInfo: info }),
      updateCaseInfo: (partial) =>
        set((s) => ({
          caseInfo: s.caseInfo ? { ...s.caseInfo, ...partial } : s.caseInfo,
        })),

      setFacts: (facts) => set({ facts }),
      updateFact: (id, partial) =>
        set((s) => ({
          facts: s.facts.map((f) => (f.id === id ? { ...f, ...partial } : f)),
        })),
      confirmAllFacts: () =>
        set((s) => ({
          facts: s.facts.map((f) =>
            f.status === "pending" ? { ...f, status: "confirmed" as const } : f
          ),
        })),

      setMoneyItems: (items) => set({ moneyItems: items }),
      addMoneyItem: (item) =>
        set((s) => ({
          moneyItems: [...s.moneyItems, item],
        })),
      updateMoneyItem: (id, partial) =>
        set((s) => ({
          moneyItems: s.moneyItems.map((m) =>
            m.id === id ? { ...m, ...partial } : m
          ),
        })),
      removeMoneyItem: (id) =>
        set((s) => ({
          moneyItems: s.moneyItems.filter((m) => m.id !== id),
        })),

      setTimelineEvents: (events) => set({ timelineEvents: events }),
      addTimelineEvent: (event) =>
        set((s) => ({
          timelineEvents: [...s.timelineEvents, event],
        })),
      updateTimelineEvent: (id, partial) =>
        set((s) => ({
          timelineEvents: s.timelineEvents.map((e) =>
            e.id === id ? { ...e, ...partial } : e
          ),
        })),
      removeTimelineEvent: (id) =>
        set((s) => ({
          timelineEvents: s.timelineEvents.filter((e) => e.id !== id),
        })),

      setTodos: (todos) => set({ todos }),
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        })),

      setIntakeData: (data) => set({ intakeData: data }),

      setEvidenceItems: (items) => set({ evidenceItems: items }),
      addEvidenceItem: (item) =>
        set((s) => ({ evidenceItems: [...s.evidenceItems, item] })),
      updateEvidenceItem: (id, partial) =>
        set((s) => ({
          evidenceItems: s.evidenceItems.map((e) =>
            e.id === id ? { ...e, ...partial } : e
          ),
        })),
      removeEvidenceItem: (id) =>
        set((s) => ({
          evidenceItems: s.evidenceItems.filter((e) => e.id !== id),
        })),

      setSources: (sources) => set({ sources }),
      setRisks: (risks) => set({ risks }),
      setActionPlans: (plans) => set({ actionPlans: plans }),

      addTodo: (todo) =>
        set((s) => ({ todos: [...s.todos, todo] })),

      resetCase: () => set(INITIAL_STATE),
    }),
    {
      name: "legal-ai-case-storage",
      // 持久化完成后标记已就绪
      onRehydrateStorage: () => () => {
        useCaseStore.getState().setHydrated?.();
      },
      // 只持久化核心数据
      partialize: (state) => ({
        caseInfo: state.caseInfo,
        parties: state.parties,
        facts: state.facts,
        factVersions: state.factVersions,
        moneyItems: state.moneyItems,
        timelineEvents: state.timelineEvents,
        evidenceItems: state.evidenceItems,
        todos: state.todos,
        intakeData: state.intakeData,
      }),
    }
  )
);

// ---- 初始化演示数据（外部调用） ----

export function initDemoCase() {
  const store = useCaseStore.getState();
  if (!store.caseInfo) {
    store.setLoading(true);
    // 模拟异步加载延迟 (真实场景从后端获取)
    setTimeout(() => {
      useCaseStore.setState({
        caseInfo: DEMO_CASE_INFO,
        facts: DEMO_FACTS,
        moneyItems: DEMO_MONEY_ITEMS,
        timelineEvents: DEMO_TIMELINE_EVENTS,
        todos: DEMO_TODOS,
        evidenceItems: DEMO_EVIDENCE_ITEMS,
        sources: DEMO_SOURCES,
        risks: DEMO_RISKS,
        actionPlans: DEMO_ACTION_PLANS,
        isLoading: false,
      });
    }, 600);
  }
}
