// ============================================================
// Legal AI Lab — EmptyState 组件测试
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyState from "@/components/EmptyState";

describe("EmptyState", () => {
  it("应渲染默认变体（default）", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });

  it("应渲染自定义图标", () => {
    render(<EmptyState title="空" icon="📂" />);
    expect(screen.getByText("📂")).toBeInTheDocument();
  });

  it("应渲染描述文本", () => {
    render(<EmptyState title="暂无数据" description="没有任何内容" />);
    expect(screen.getByText("没有任何内容")).toBeInTheDocument();
  });

  it("应渲染动作按钮并在点击时触发回调", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="暂无数据"
        actionLabel="添加数据"
        onAction={onAction}
      />
    );
    const button = screen.getByText("添加数据");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("没有 actionLabel 时不应渲染按钮", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("应渲染 compact 变体", () => {
    render(<EmptyState title="紧凑模式" variant="compact" />);
    expect(screen.getByText("紧凑模式")).toBeInTheDocument();
  });

  it("应渲染 banner 变体", () => {
    render(<EmptyState title="横幅模式" variant="banner" />);
    expect(screen.getByText("横幅模式")).toBeInTheDocument();
  });

  it("compact 变体应支持动作按钮", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="紧凑空状态"
        variant="compact"
        actionLabel="操作"
        onAction={onAction}
      />
    );
    const button = screen.getByText("操作");
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("banner 变体应支持动作按钮", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="横幅空状态"
        variant="banner"
        actionLabel="横幅操作"
        onAction={onAction}
      />
    );
    const button = screen.getByText("横幅操作");
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
