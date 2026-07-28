// ============================================================
// Legal AI Lab — 关键页面 Smoke Test
// 验证页面渲染不报错
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock React.use() for pages with async params (jsdom不支持 React 19 use(Promise))
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    use: (promise: unknown) => {
      // 如果是 Promise，同步返回默认值
      if (promise && typeof (promise as Promise<unknown>).then === "function") {
        return { id: "M-20260727-001" };
      }
      return promise;
    },
  };
});

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

// Mock zustand store 持久化
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("U01 - 首页/home page", () => {
  it("应渲染首页不报错", async () => {
    const Page = (await import("@/app/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByPlaceholderText(/例如/)).toBeInTheDocument();
  });

  it("应包含常见问题列表", async () => {
    const Page = (await import("@/app/page")).default;
    render(<Page />);
    expect(screen.getByText("公司欠我工资")).toBeInTheDocument();
    expect(screen.getByText("没签劳动合同")).toBeInTheDocument();
    expect(screen.getByText("被公司辞退")).toBeInTheDocument();
  });
});

describe("U02 - 服务边界与隐私同意", () => {
  it("应渲染不报错", async () => {
    const Page = (await import("@/app/u02/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("服务边界与隐私同意")).toBeInTheDocument();
  });

  it("应包含所有同意项", async () => {
    const Page = (await import("@/app/u02/page")).default;
    render(<Page />);
    expect(screen.getByText("了解 AI 的角色")).toBeInTheDocument();
    expect(screen.getByText("了解数据用途")).toBeInTheDocument();
    expect(screen.getByText("了解服务范围")).toBeInTheDocument();
  });
});

describe("U06 - 案件工作台", () => {
  it("应渲染不报错（加载中状态）", async () => {
    const Page = (await import("@/app/u06/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
  });
});

describe("U14 - 历史案件", () => {
  it("应渲染不报错", async () => {
    const Page = (await import("@/app/u14/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("历史案件")).toBeInTheDocument();
  });

  it("应显示案件列表", async () => {
    const Page = (await import("@/app/u14/page")).default;
    render(<Page />);
    expect(screen.getByText("北京某某科技欠薪纠纷")).toBeInTheDocument();
    expect(screen.getByText("上海某某餐饮违法解除劳动合同")).toBeInTheDocument();
  });
});

// ============================================================
// U05 — 事实确认（复杂状态渲染，store 依赖最深）
// ============================================================
describe("U05 - 事实确认", () => {
  beforeEach(async () => {
    // 直接设置 store 为 hydrated + 加载完成 + 有演示事实数据，绕过加载中状态
    const { useCaseStore } = await import("@/lib/store");
    useCaseStore.setState({
      isHydrated: true,
      isLoading: false,
      hasError: false,
      facts: [
        { id: "f01", label: "用人单位", value: "北京某某科技有限公司", status: "confirmed", category: "主体" },
        { id: "f02", label: "欠薪期间", value: "2026年1月至6月", status: "pending", category: "欠薪" },
        { id: "f03", label: "欠薪总额", value: "75,000元", status: "inferred", category: "欠薪" },
      ],
      caseInfo: {
        id: "SMOKE-TEST", title: "测试案件", status: "draft",
        createdAt: "", updatedAt: "", domain: "labor",
        province: "北京市", city: "朝阳区", goal: "", urgent: [], description: "",
      },
    });
  });

  it("应渲染事实确认页面不报错", async () => {
    const Page = (await import("@/app/u05/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("确认案件事实")).toBeInTheDocument();
    expect(screen.getByText("请核对以下信息")).toBeInTheDocument();
  });

  it("应显示已确认和待确认的事实区域", async () => {
    const Page = (await import("@/app/u05/page")).default;
    render(<Page />);
    expect(screen.getByText(/已确认/)).toBeInTheDocument();
    expect(screen.getByText(/待确认/)).toBeInTheDocument();
  });

  it("应显示 AI 推断区域和事实值", async () => {
    const Page = (await import("@/app/u05/page")).default;
    render(<Page />);
    expect(screen.getByText(/AI 推断/)).toBeInTheDocument();
    expect(screen.getByText("75,000元")).toBeInTheDocument();
  });
});

// ============================================================
// U13 — 报告导出（聚合所有 store 数据，依赖链路最长）
// ============================================================
describe("U13 - 案件报告", () => {
  beforeEach(async () => {
    const { useCaseStore } = await import("@/lib/store");
    useCaseStore.setState({
      isHydrated: true,
      isLoading: false,
      caseInfo: {
        id: "REPORT-TEST", title: "北京某某科技欠薪纠纷", status: "draft",
        createdAt: "2026-07-27", updatedAt: "2026-07-28", domain: "labor",
        province: "北京市", city: "朝阳区", goal: "仲裁", urgent: [], description: "测试用案件",
      },
      facts: [
        { id: "f01", label: "用人单位", value: "北京某某科技有限公司", status: "confirmed", category: "主体" },
        { id: "f02", label: "欠薪期间", value: "2026年1月至6月", status: "confirmed", category: "欠薪" },
      ],
      moneyItems: [],
      timelineEvents: [],
      evidenceItems: [],
      sources: [],
      risks: [],
      actionPlans: [],
      todos: [],
    });
  });

  it("应渲染案件报告不报错", async () => {
    const Page = (await import("@/app/u13/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("案件报告")).toBeInTheDocument();
  });

  it("应显示报告章节", async () => {
    const Page = (await import("@/app/u13/page")).default;
    render(<Page />);
    expect(screen.getByText("1. 案件边界")).toBeInTheDocument();
    expect(screen.getByText(/2. 案件主体/)).toBeInTheDocument();
  });
});

// ============================================================
// 律师端 — 案件列表（独立 mock 数据，无需 store）
// ============================================================
describe("律师端 - 案件列表", () => {
  it("应渲染律师案件列表不报错", async () => {
    const Page = (await import("@/app/lawyer/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("张明华 律师")).toBeInTheDocument();
    expect(screen.getByText("北京明华律师事务所")).toBeInTheDocument();
  });

  it("应显示案件列表和筛选选项", async () => {
    const Page = (await import("@/app/lawyer/page")).default;
    render(<Page />);
    const pendingItems = screen.getAllByText("待审阅");
    expect(pendingItems.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("广州某某科技合同纠纷")).toBeInTheDocument();
  });
});

// ============================================================
// 律师端 — 案件详情（store 依赖 + 异步 params）
// ============================================================
describe("律师端 - 案件详情", () => {
  beforeEach(async () => {
    const { useCaseStore } = await import("@/lib/store");
    useCaseStore.setState({
      isHydrated: true,
      isLoading: false,
      caseInfo: {
        id: "DETAIL-TEST", title: "北京某某科技欠薪纠纷", status: "draft",
        createdAt: "2026-07-27", updatedAt: "2026-07-28", domain: "labor",
        province: "北京市", city: "朝阳区", goal: "仲裁", urgent: [], description: "",
      },
      facts: [{ id: "f01", label: "用人单位", value: "北京某某科技有限公司", status: "confirmed", category: "主体" }],
      moneyItems: [],
      timelineEvents: [],
      evidenceItems: [],
      sources: [],
      risks: [],
      actionPlans: [],
      todos: [],
    });
  });

  it("应渲染案件详情不报错", async () => {
    const Page = (await import("@/app/lawyer/cases/[id]/page")).default;
    const { container } = render(<Page params={Promise.resolve({ id: "test" })} />);
    expect(container.textContent).toBeTruthy();
    const titles = screen.getAllByText("北京某某科技欠薪纠纷");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("应显示案件信息和导航标签", async () => {
    const Page = (await import("@/app/lawyer/cases/[id]/page")).default;
    render(<Page params={Promise.resolve({ id: "test" })} />);
    // 案件信息出现在导航菜单和页面标题中
    const infoItems = screen.getAllByText("案件信息");
    expect(infoItems.length).toBeGreaterThanOrEqual(1);
    // 导航菜单
    expect(screen.getByText("事实")).toBeInTheDocument();
    expect(screen.getByText("金额")).toBeInTheDocument();
    expect(screen.getByText("证据")).toBeInTheDocument();
  });
});

// ============================================================
// 律师端 — 证据对照（独立 mock 数据 + 异步 params）
// ============================================================
describe("律师端 - 证据和来源对照", () => {
  it("应渲染证据对照页面不报错", async () => {
    const Page = (await import("@/app/lawyer/cases/[id]/evidence/page")).default;
    const { container } = render(<Page params={Promise.resolve({ id: "test" })} />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("证据和来源对照")).toBeInTheDocument();
  });

  it("应显示充分度信息和关联证据", async () => {
    const Page = (await import("@/app/lawyer/cases/[id]/evidence/page")).default;
    render(<Page params={Promise.resolve({ id: "test" })} />);
    expect(screen.getByText("当前事实充分度：")).toBeInTheDocument();
    expect(screen.getByText("关联证据")).toBeInTheDocument();
  });
});

// ============================================================
// 律师端 — 补充请求和律师意见（独立 mock 数据 + 异步 params）
// ============================================================
describe("律师端 - 补充请求和律师意见", () => {
  it("应渲染意见页面不报错", async () => {
    const Page = (await import("@/app/lawyer/cases/[id]/opinion/page")).default;
    const { container } = render(<Page params={Promise.resolve({ id: "test" })} />);
    expect(container.textContent).toBeTruthy();
    expect(screen.getByText("补充请求和律师意见")).toBeInTheDocument();
  });

  it("应显示补充提问和律师意见两个标签", async () => {
    const Page = (await import("@/app/lawyer/cases/[id]/opinion/page")).default;
    render(<Page params={Promise.resolve({ id: "test" })} />);
    expect(screen.getByText("补充提问")).toBeInTheDocument();
    expect(screen.getByText("律师意见")).toBeInTheDocument();
  });
});
