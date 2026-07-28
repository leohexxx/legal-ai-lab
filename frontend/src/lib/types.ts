// ============================================================
// Legal AI Lab — 核心数据模型
// S2 共享数据层：所有页面共用的 TypeScript 类型定义
// ============================================================

// ---- 案件 ----

export type CaseStatus =
  | "draft"
  | "pending_facts"
  | "analyzing"
  | "generated"
  | "pending_materials"
  | "ready"
  | "transferred"
  | "completed"
  | "archived";

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  domain: string;
  province: string;
  city: string;
  goal: string;
  urgent: string[];
  description: string;
  factVersionId?: string;
}

// ---- 主体 ----

export type PartyType = "employee" | "employer" | "contract_party" | "actual_manager";

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  isConfirmed: boolean;
}

// ---- 事实 ----

export type FactStatus = "confirmed" | "pending" | "inferred" | "contradiction";

export interface FactItem {
  id: string;
  label: string;
  value: string;
  status: FactStatus;
  source?: string;
  category: string;
}

export interface FactVersion {
  id: string;
  createdAt: string;
  facts: FactItem[];
  isCurrent: boolean;
}

// ---- 金额明细 ----

export type MoneyStatus = "confirmed" | "estimated" | "disputed" | "pending";

export interface MoneyItem {
  id: string;
  period: string;          // 工资期间，如 "2026-01"
  dueDate: string;         // 应付日期
  baseSalary: number;      // 固定工资
  commission: number;      // 提成
  overtime: number;        // 加班
  bonus: number;           // 奖金
  deduction: number;       // 扣款
  paidAmount: number;      // 实付金额
  status: MoneyStatus;
  attachment?: string;
  notes?: string;
}

// ---- 时间线 ----

export type EventType =
  | "hire"
  | "contract"
  | "salary_agreed"
  | "salary_due"
  | "payment"
  | "demand"
  | "company_reply"
  | "resignation"
  | "complaint"
  | "arbitration"
  | "litigation"
  | "evidence"
  | "lawyer_opinion";

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;            // "YYYY-MM" 或 "YYYY-MM-DD"
  isEstimated: boolean;
  relatedParty?: string;
  relatedFacts?: string[];
  relatedEvidence?: string[];
  description?: string;
}

// ---- 证据 ----

export type EvidenceType = "contract" | "payslip" | "bank_statement" | "chat" | "attendance" | "recording" | "photo" | "other";

export type EvidenceStatus = "existing" | "missing" | "parsing" | "failed";

export interface EvidenceItem {
  id: string;
  name: string;
  type: EvidenceType;
  purpose: string;
  status: EvidenceStatus;
  isOriginal: boolean;
  privacyRisk?: string;
  notes?: string;
}

// ---- 法律来源 ----

export interface Source {
  id: string;
  title: string;
  authority: string;
  articleNo: string;
  status: "effective" | "invalid" | "revised" | "region_mismatch" | "unavailable";
  queryDate: string;
  summary: string;
  originalUrl?: string;
}

// ---- 风险 ----

export interface RiskFactor {
  id: string;
  dimension: string;
  level: "low" | "medium" | "high" | "critical";
  reason: string;
  improvement?: string;
  relatedFactIds?: string[];
  relatedEvidenceIds?: string[];
}

// ---- 行动方案 ----

export interface ActionPlan {
  id: string;
  title: string;
  type: "negotiate" | "complaint" | "mediation" | "arbitration" | "litigation";
  prerequisites: string[];
  target: string;
  risks: string[];
  costs: string;
  estimatedDuration: string;
  priority: number;
}

// ---- 待办任务 ----

export interface TodoItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  done: boolean;
  relatedTo?: string;
}

// ---- 采集数据（U04 表单） ----

export interface IntakeData {
  employerName: string;
  workplace: string;
  isEmployerKnown: boolean;
  isOnJob: string;
  resignationDate: string;
  contractStatus: string;
  contractParty: string;
  actualManager: string;
  salaryType: string;
  baseSalary: string;
  salaryPeriod: string;
  payDay: string;
  arrearsStart: string;
  arrearsEnd: string;
  totalOwed: string;
  hasPaySlip: boolean;
  hasBankStatement: boolean;
  hasChatRecord: boolean;
  hasContract: boolean;
  hasAttendance: boolean;
  hasOther: boolean;
  otherEvidence: string;
  hasComplained: boolean;
  hasArbitrated: boolean;
  hasSued: boolean;
  hasNegotiated: boolean;
  companyResponse: string;
  goal: string;
  urgentNote: string;
}

// ---- 案件完整状态（store 根对象） ----

export interface CaseState {
  caseInfo: Case | null;
  parties: Party[];
  facts: FactItem[];
  factVersions: FactVersion[];
  moneyItems: MoneyItem[];
  timelineEvents: TimelineEvent[];
  evidenceItems: EvidenceItem[];
  sources: Source[];
  risks: RiskFactor[];
  actionPlans: ActionPlan[];
  todos: TodoItem[];
  intakeData: IntakeData | null;
}

// ---- 工具函数 ----

export function calcMoneyItemTotal(item: MoneyItem): number {
  return item.baseSalary + item.commission + item.overtime + item.bonus - item.deduction;
}

export function calcMoneyItemDiff(item: MoneyItem): number {
  return calcMoneyItemTotal(item) - item.paidAmount;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  hire: "入职",
  contract: "合同",
  salary_agreed: "工资约定",
  salary_due: "工资到期",
  payment: "付款",
  demand: "催讨",
  company_reply: "公司回应",
  resignation: "离职",
  complaint: "投诉",
  arbitration: "仲裁",
  litigation: "诉讼",
  evidence: "证据",
  lawyer_opinion: "律师意见",
};

export const MONEY_STATUS_LABELS: Record<MoneyStatus, string> = {
  confirmed: "已确认",
  estimated: "估算",
  disputed: "争议",
  pending: "待确认",
};

export const FACT_STATUS_LABELS: Record<FactStatus, string> = {
  confirmed: "已确认",
  pending: "待确认",
  inferred: "AI 推断",
  contradiction: "矛盾",
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  contract: "合同",
  payslip: "工资单",
  bank_statement: "银行流水",
  chat: "聊天记录",
  attendance: "考勤",
  recording: "录音",
  photo: "照片",
  other: "其他",
};

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  existing: "已有",
  missing: "缺失",
  parsing: "解析中",
  failed: "失败",
};

export const SOURCE_STATUS_LABELS: Record<Source["status"], string> = {
  effective: "有效",
  invalid: "失效",
  revised: "已修订",
  region_mismatch: "地域不匹配",
  unavailable: "不可用",
};

export const RISK_LEVEL_LABELS: Record<RiskFactor["level"], string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重",
};

export const ACTION_PLAN_TYPE_LABELS: Record<ActionPlan["type"], string> = {
  negotiate: "协商",
  complaint: "投诉",
  mediation: "调解",
  arbitration: "仲裁",
  litigation: "诉讼",
};
