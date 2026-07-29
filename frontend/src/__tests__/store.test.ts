// ============================================================
// Legal AI Lab — Zustand Store 单元测试
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useCaseStore, initDemoCase } from "@/lib/store";
import type {
  Case,
  FactItem,
  MoneyItem,
  TimelineEvent,
  EvidenceItem,
  TodoItem,
  IntakeData,
  Source,
  RiskFactor,
  ActionPlan,
} from "@/lib/types";

// 每次测试前重置 store
beforeEach(() => {
  useCaseStore.getState().resetCase();
  // 重置 hydrated 状态 (resetCase 会重置)
});

describe("Store 初始状态", () => {
  it("应使用正确的初始值", () => {
    const state = useCaseStore.getState();
    expect(state.caseInfo).toBeNull();
    expect(state.parties).toEqual([]);
    expect(state.facts).toEqual([]);
    expect(state.factVersions).toEqual([]);
    expect(state.moneyItems).toEqual([]);
    expect(state.timelineEvents).toEqual([]);
    expect(state.evidenceItems).toEqual([]);
    expect(state.sources).toEqual([]);
    expect(state.risks).toEqual([]);
    expect(state.actionPlans).toEqual([]);
    expect(state.todos).toEqual([]);
    expect(state.intakeData).toBeNull();
    expect(state.isHydrated).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});

describe("Store 加载状态", () => {
  it("setHydrated 应将 isHydrated 设为 true", () => {
    useCaseStore.getState().setHydrated();
    expect(useCaseStore.getState().isHydrated).toBe(true);
  });

  it("setLoading 应正确设置加载状态", () => {
    useCaseStore.getState().setLoading(true);
    expect(useCaseStore.getState().isLoading).toBe(true);

    useCaseStore.getState().setLoading(false);
    expect(useCaseStore.getState().isLoading).toBe(false);
  });
});

describe("Store 案件基本信息", () => {
  const mockCase: Case = {
    id: "TEST-001",
    title: "测试案件",
    status: "draft",
    createdAt: "2026-07-27",
    updatedAt: "2026-07-27",
    domain: "labor",
    province: "北京市",
    city: "朝阳区",
    goal: "prepare",
    urgent: [],
    description: "测试描述",
  };

  it("setCaseInfo 应设置案件信息", () => {
    useCaseStore.getState().setCaseInfo(mockCase);
    expect(useCaseStore.getState().caseInfo).toEqual(mockCase);
  });

  it("updateCaseInfo 应部分更新案件信息", () => {
    useCaseStore.getState().setCaseInfo(mockCase);
    useCaseStore.getState().updateCaseInfo({ title: "已更新标题" });
    expect(useCaseStore.getState().caseInfo?.title).toBe("已更新标题");
    expect(useCaseStore.getState().caseInfo?.id).toBe("TEST-001");
  });

  it("updateCaseInfo 在 caseInfo 为 null 时不应报错", () => {
    expect(() => {
      useCaseStore.getState().updateCaseInfo({ title: "不会崩溃" });
    }).not.toThrow();
    expect(useCaseStore.getState().caseInfo).toBeNull();
  });
});

describe("Store 事实管理", () => {
  const mockFacts: FactItem[] = [
    { id: "f01", label: "用人单位", value: "某某公司", status: "confirmed", category: "主体" },
    { id: "f02", label: "欠薪期间", value: "2026年1月", status: "pending", category: "欠薪" },
    { id: "f03", label: "欠薪总额", value: "75,000元", status: "inferred", category: "欠薪" },
  ];

  it("setFacts 应设置事实列表", () => {
    useCaseStore.getState().setFacts(mockFacts);
    expect(useCaseStore.getState().facts).toEqual(mockFacts);
  });

  it("updateFact 应更新指定事实", () => {
    useCaseStore.getState().setFacts(mockFacts);
    useCaseStore.getState().updateFact("f02", { value: "2026年1月至6月" });
    const fact = useCaseStore.getState().facts.find((f) => f.id === "f02");
    expect(fact?.value).toBe("2026年1月至6月");
    expect(fact?.label).toBe("欠薪期间");
  });

  it("updateFact 对不存在的 id 不应影响其他事实", () => {
    useCaseStore.getState().setFacts(mockFacts);
    useCaseStore.getState().updateFact("nonexistent", { value: "xxx" });
    expect(useCaseStore.getState().facts).toEqual(mockFacts);
  });

  it("confirmAllFacts 应将所有 pending 状态改为 confirmed", () => {
    useCaseStore.getState().setFacts(mockFacts);
    useCaseStore.getState().confirmAllFacts();
    const facts = useCaseStore.getState().facts;
    expect(facts.find((f) => f.id === "f01")?.status).toBe("confirmed");
    expect(facts.find((f) => f.id === "f02")?.status).toBe("confirmed");
    expect(facts.find((f) => f.id === "f03")?.status).toBe("inferred"); // 非 pending 不应改变
  });
});

describe("Store 金额明细管理", () => {
  const mockItem: MoneyItem = {
    id: "m01", period: "2026-01", dueDate: "2026-01-15",
    baseSalary: 15000, commission: 0, overtime: 0, bonus: 0,
    deduction: 0, paidAmount: 5000, status: "confirmed",
  };
  const mockItem2: MoneyItem = {
    id: "m02", period: "2026-02", dueDate: "2026-02-15",
    baseSalary: 15000, commission: 0, overtime: 0, bonus: 0,
    deduction: 0, paidAmount: 0, status: "pending",
  };

  it("setMoneyItems 应设置金额列表", () => {
    useCaseStore.getState().setMoneyItems([mockItem]);
    expect(useCaseStore.getState().moneyItems).toHaveLength(1);
  });

  it("addMoneyItem 应添加金额项", () => {
    useCaseStore.getState().addMoneyItem(mockItem);
    useCaseStore.getState().addMoneyItem(mockItem2);
    expect(useCaseStore.getState().moneyItems).toHaveLength(2);
  });

  it("updateMoneyItem 应更新指定金额项", () => {
    useCaseStore.getState().addMoneyItem(mockItem);
    useCaseStore.getState().updateMoneyItem("m01", { paidAmount: 8000 });
    expect(useCaseStore.getState().moneyItems[0].paidAmount).toBe(8000);
  });

  it("removeMoneyItem 应移除指定金额项", () => {
    useCaseStore.getState().addMoneyItem(mockItem);
    useCaseStore.getState().addMoneyItem(mockItem2);
    useCaseStore.getState().removeMoneyItem("m01");
    expect(useCaseStore.getState().moneyItems).toHaveLength(1);
    expect(useCaseStore.getState().moneyItems[0].id).toBe("m02");
  });
});

describe("Store 时间线管理", () => {
  const mockEvent: TimelineEvent = {
    id: "e01", type: "hire", title: "入职", date: "2024-10-01", isEstimated: false,
  };

  it("setTimelineEvents 应设置事件列表", () => {
    useCaseStore.getState().setTimelineEvents([mockEvent]);
    expect(useCaseStore.getState().timelineEvents).toHaveLength(1);
  });

  it("addTimelineEvent 应添加事件", () => {
    useCaseStore.getState().addTimelineEvent(mockEvent);
    expect(useCaseStore.getState().timelineEvents).toHaveLength(1);
  });

  it("updateTimelineEvent 应更新事件", () => {
    useCaseStore.getState().addTimelineEvent(mockEvent);
    useCaseStore.getState().updateTimelineEvent("e01", { title: "已更新" });
    expect(useCaseStore.getState().timelineEvents[0].title).toBe("已更新");
  });

  it("removeTimelineEvent 应移除事件", () => {
    useCaseStore.getState().addTimelineEvent(mockEvent);
    useCaseStore.getState().removeTimelineEvent("e01");
    expect(useCaseStore.getState().timelineEvents).toHaveLength(0);
  });
});

describe("Store 待办管理", () => {
  it("setTodos 应设置待办列表", () => {
    const todos: TodoItem[] = [
      { id: "t01", text: "待办事项1", priority: "high", done: false },
    ];
    useCaseStore.getState().setTodos(todos);
    expect(useCaseStore.getState().todos).toHaveLength(1);
  });

  it("toggleTodo 应切换完成状态", () => {
    useCaseStore.getState().setTodos([
      { id: "t01", text: "待办1", priority: "high", done: false },
    ]);
    useCaseStore.getState().toggleTodo("t01");
    expect(useCaseStore.getState().todos[0].done).toBe(true);
    useCaseStore.getState().toggleTodo("t01");
    expect(useCaseStore.getState().todos[0].done).toBe(false);
  });

  it("addTodo 应添加待办", () => {
    useCaseStore.getState().addTodo({ id: "t01", text: "新待办", priority: "medium", done: false });
    expect(useCaseStore.getState().todos).toHaveLength(1);
  });
});

describe("Store 证据管理", () => {
  const mockEvidence: EvidenceItem = {
    id: "ev01", name: "劳动合同", type: "contract",
    purpose: "证明劳动关系", status: "existing", isOriginal: true,
  };

  it("setEvidenceItems 应设置证据列表", () => {
    useCaseStore.getState().setEvidenceItems([mockEvidence]);
    expect(useCaseStore.getState().evidenceItems).toHaveLength(1);
  });

  it("addEvidenceItem 应添加证据", () => {
    useCaseStore.getState().addEvidenceItem(mockEvidence);
    expect(useCaseStore.getState().evidenceItems).toHaveLength(1);
  });

  it("updateEvidenceItem 应更新证据", () => {
    useCaseStore.getState().addEvidenceItem(mockEvidence);
    useCaseStore.getState().updateEvidenceItem("ev01", { name: "已更新合同" });
    expect(useCaseStore.getState().evidenceItems[0].name).toBe("已更新合同");
  });

  it("removeEvidenceItem 应移除证据", () => {
    useCaseStore.getState().addEvidenceItem(mockEvidence);
    useCaseStore.getState().removeEvidenceItem("ev01");
    expect(useCaseStore.getState().evidenceItems).toHaveLength(0);
  });
});

describe("Store 采集数据", () => {
  const mockIntake: IntakeData = {
    employerName: "某某公司",
    workplace: "北京市朝阳区",
    isEmployerKnown: true,
    isOnJob: "在职",
    resignationDate: "",
    contractStatus: "已签订",
    contractParty: "某某公司",
    actualManager: "",
    salaryType: "固定",
    baseSalary: "15000",
    salaryPeriod: "月",
    payDay: "15",
    arrearsStart: "2026-01",
    arrearsEnd: "2026-06",
    totalOwed: "75000",
    hasPaySlip: true,
    hasBankStatement: false,
    hasChatRecord: true,
    hasContract: true,
    hasAttendance: false,
    hasOther: false,
    otherEvidence: "",
    hasComplained: false,
    hasArbitrated: false,
    hasSued: false,
    hasNegotiated: false,
    companyResponse: "",
    goal: "拿回工资",
    urgentNote: "",
  };

  it("setIntakeData 应设置采集数据", () => {
    useCaseStore.getState().setIntakeData(mockIntake);
    expect(useCaseStore.getState().intakeData).toEqual(mockIntake);
  });
});

describe("Store 法律来源/风险/行动方案", () => {
  it("setSources 应设置法律来源", () => {
    const sources: Source[] = [{
      id: "s01", title: "劳动法", authority: "全国人大",
      articleNo: "第五十条", status: "effective", queryDate: "2026-07-27", summary: "工资应当支付",
    }];
    useCaseStore.getState().setSources(sources);
    expect(useCaseStore.getState().sources).toHaveLength(1);
  });

  it("setRisks 应设置风险列表", () => {
    const risks: RiskFactor[] = [{
      id: "r01", dimension: "证据", level: "high",
      reason: "缺少关键证据",
    }];
    useCaseStore.getState().setRisks(risks);
    expect(useCaseStore.getState().risks).toHaveLength(1);
  });

  it("setActionPlans 应设置行动方案", () => {
    const plans: ActionPlan[] = [{
      id: "a01", title: "协商", type: "negotiate",
      prerequisites: [], target: "要求支付", risks: [], costs: "0",
      estimatedDuration: "1周", priority: 1,
    }];
    useCaseStore.getState().setActionPlans(plans);
    expect(useCaseStore.getState().actionPlans).toHaveLength(1);
  });
});

describe("Store resetCase", () => {
  it("resetCase 应重置所有状态为初始值", () => {
    useCaseStore.getState().setCaseInfo({
      id: "T", title: "测试", status: "draft",
      createdAt: "", updatedAt: "", domain: "labor",
      province: "", city: "", goal: "", urgent: [], description: "",
    });
    useCaseStore.getState().setLoading(true);
    useCaseStore.getState().resetCase();

    const state = useCaseStore.getState();
    expect(state.caseInfo).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isHydrated).toBe(false);
    expect(state.facts).toEqual([]);
    expect(state.moneyItems).toEqual([]);
  });
});

describe("Store 持久化 partialize", () => {
  it("partialize 应只包含核心数据字段", () => {
    // 验证 persist 中间件的 partialize 配置
    // 通过检查 setCaseInfo 后再获取 store 内容来间接验证
    useCaseStore.getState().setCaseInfo({
      id: "T1", title: "测试", status: "draft",
      createdAt: "", updatedAt: "", domain: "labor",
      province: "", city: "", goal: "", urgent: [], description: "",
    });
    useCaseStore.getState().setFacts([{ id: "f1", label: "测试", value: "v1", status: "confirmed", category: "主体" }]);

    // partialize 应包含 caseInfo, facts, parties 等核心字段
    // 我们直接验证通过 localStorage 持久化的内容
    const storageKey = "legal-ai-case-storage";
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state).toHaveProperty("caseInfo");
      expect(parsed.state).toHaveProperty("facts");
      expect(parsed.state).toHaveProperty("parties");
      expect(parsed.state).not.toHaveProperty("isHydrated");
      expect(parsed.state).not.toHaveProperty("isLoading");
    }
  });
});

describe("initDemoCase", () => {
  it("initDemoCase 应加载演示数据", async () => {
    // 确保 store 已 hydrated
    useCaseStore.getState().setHydrated();

    initDemoCase();
    // initDemoCase 使用 setTimeout 600ms，需要等待
    await new Promise((r) => setTimeout(r, 700));

    const state = useCaseStore.getState();
    expect(state.caseInfo).not.toBeNull();
    expect(state.caseInfo?.title).toBe("北京某某科技欠薪纠纷");
    expect(state.facts.length).toBeGreaterThan(0);
    expect(state.moneyItems.length).toBeGreaterThan(0);
    expect(state.timelineEvents.length).toBeGreaterThan(0);
    expect(state.todos.length).toBeGreaterThan(0);
    expect(state.evidenceItems.length).toBeGreaterThan(0);
    expect(state.sources.length).toBeGreaterThan(0);
    expect(state.risks.length).toBeGreaterThan(0);
    expect(state.actionPlans.length).toBeGreaterThan(0);
    expect(state.isLoading).toBe(false);
  });

  it("initDemoCase 在已有案件时不应重复加载", () => {
    useCaseStore.getState().setHydrated();
    useCaseStore.getState().setCaseInfo({
      id: "EXISTING", title: "已有案件", status: "draft",
      createdAt: "", updatedAt: "", domain: "labor",
      province: "", city: "", goal: "", urgent: [], description: "",
    });

    initDemoCase();
    // 因为已有 caseInfo，不应再修改
    expect(useCaseStore.getState().caseInfo?.id).toBe("EXISTING");
  });
});

describe("Store 工具函数", () => {
  it("calcMoneyItemTotal 应正确计算总额", async () => {
    const { calcMoneyItemTotal, calcMoneyItemDiff } = await import("@/lib/types");
    const item: MoneyItem = {
      id: "m01", period: "2026-01", dueDate: "2026-01-15",
      baseSalary: 15000, commission: 2000, overtime: 1500,
      bonus: 1000, deduction: 500, paidAmount: 5000, status: "confirmed",
    };
    expect(calcMoneyItemTotal(item)).toBe(15000 + 2000 + 1500 + 1000 - 500);
    expect(calcMoneyItemDiff(item)).toBe(15000 + 2000 + 1500 + 1000 - 500 - 5000);
  });
});
