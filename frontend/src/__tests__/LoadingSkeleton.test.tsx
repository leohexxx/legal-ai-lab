// ============================================================
// Legal AI Lab — LoadingSkeleton 组件测试
// ============================================================

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSkeleton from "@/components/LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("应渲染默认 text 变体", () => {
    const { container } = render(<LoadingSkeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("加载中")).toBeInTheDocument();
    // 默认 text 变体应包含多个骨架块
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(4);
  });

  it("应渲染 card 变体", () => {
    const { container } = render(<LoadingSkeleton variant="card" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(4);
  });

  it("应渲染 table 变体", () => {
    const { container } = render(<LoadingSkeleton variant="table" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    // table 有 header + 4 rows
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(10);
  });

  it("应渲染 list 变体", () => {
    const { container } = render(<LoadingSkeleton variant="list" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(10);
  });

  it("应渲染 page 变体", () => {
    const { container } = render(<LoadingSkeleton variant="page" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(5);
  });

  it("应渲染 timeline 变体", () => {
    const { container } = render(<LoadingSkeleton variant="timeline" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(8);
  });

  it("应渲染 money 变体", () => {
    const { container } = render(<LoadingSkeleton variant="money" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    const blocks = container.querySelectorAll(".animate-pulse");
    expect(blocks.length).toBeGreaterThanOrEqual(10);
  });

  it("应显示自定义消息", () => {
    render(<LoadingSkeleton message="正在加载数据..." />);
    expect(screen.getByText("正在加载数据...")).toBeInTheDocument();
  });

  it("没有消息时不应显示消息区域", () => {
    render(<LoadingSkeleton />);
    expect(screen.queryByRole("paragraph")).toBeNull();
  });

  it("应包含 sr-only 文本", () => {
    render(<LoadingSkeleton />);
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });
});
