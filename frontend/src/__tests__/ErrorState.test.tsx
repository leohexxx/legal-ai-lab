// ============================================================
// Legal AI Lab — ErrorState 组件测试
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorState from "@/components/ErrorState";

describe("ErrorState", () => {
  it("应使用默认 props 渲染", () => {
    render(<ErrorState />);
    expect(screen.getByText("出错了")).toBeInTheDocument();
    expect(screen.getByText("操作无法完成，请稍后重试。")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("应渲染自定义标题和消息", () => {
    render(<ErrorState title="自定义错误" message="自定义错误消息" />);
    expect(screen.getByText("自定义错误")).toBeInTheDocument();
    expect(screen.getByText("自定义错误消息")).toBeInTheDocument();
  });

  it("应渲染不同严重程度的变体", () => {
    const { rerender } = render(<ErrorState severity="error" />);
    expect(screen.getByText("⚠️")).toBeInTheDocument();

    rerender(<ErrorState severity="warning" />);
    expect(screen.getByText("⚡")).toBeInTheDocument();

    rerender(<ErrorState severity="info" />);
    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });

  it("应渲染重试按钮并触发回调", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    const retryBtn = screen.getByText("重试");
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("应渲染自定义重试标签", () => {
    render(<ErrorState onRetry={() => {}} retryLabel="重新加载" />);
    expect(screen.getByText("重新加载")).toBeInTheDocument();
  });

  it("应渲染忽略按钮并触发回调", () => {
    const onDismiss = vi.fn();
    render(<ErrorState onDismiss={onDismiss} />);
    const dismissBtn = screen.getByText("忽略");
    expect(dismissBtn).toBeInTheDocument();
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("应展开和收起详情", () => {
    render(<ErrorState title="错误" detail="这是详细错误信息\n第二行" />);
    // 初始不应显示详情
    expect(screen.queryByText(/这是详细错误信息/)).toBeNull();

    // 点击查看详情
    fireEvent.click(screen.getByText("查看详情"));
    expect(screen.getByText(/这是详细错误信息/)).toBeInTheDocument();

    // 点击收起详情
    fireEvent.click(screen.getByText("收起详情"));
    expect(screen.queryByText(/这是详细错误信息/)).toBeNull();
  });

  it("没有 detail 时不应显示详情按钮", () => {
    render(<ErrorState title="错误" message="消息" />);
    expect(screen.queryByText("查看详情")).toBeNull();
  });

  it("没有 onRetry 时不应渲染重试按钮", () => {
    render(<ErrorState />);
    expect(screen.queryByText("重试")).toBeNull();
  });

  it("没有 onDismiss 时不应渲染忽略按钮", () => {
    render(<ErrorState />);
    expect(screen.queryByText("忽略")).toBeNull();
  });

  it("fullPage 模式应包裹在居中容器中", () => {
    const { container } = render(<ErrorState fullPage />);
    const centerContainer = container.querySelector(".min-h-\\[60vh\\]");
    expect(centerContainer).toBeInTheDocument();
  });
});
