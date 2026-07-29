import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatMessage from "@/components/chat/ChatMessage";
import IntentTag from "@/components/chat/IntentTag";
import SkipButton from "@/components/chat/SkipButton";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ContextSummary from "@/components/chat/ContextSummary";
import type { ChatMessage as ChatMessageType, IntentResult, FollowUpField } from "@/lib/types";

// ==================== ChatMessage ====================
describe("ChatMessage", () => {
  const userMsg: ChatMessageType = {
    id: "1", role: "user", content: "我的问题", createdAt: "2026-01-01T00:00:00Z",
  };
  const assistantMsg: ChatMessageType = {
    id: "2", role: "assistant", content: "系统回复", createdAt: "2026-01-01T00:00:00Z",
  };
  const loadingMsg: ChatMessageType = {
    id: "3", role: "assistant", content: "", createdAt: "2026-01-01T00:00:00Z", isLoading: true,
  };
  const intentMsg: ChatMessageType = {
    id: "4", role: "assistant", content: "我理解您的问题", createdAt: "2026-01-01T00:00:00Z",
    intent: { categoryId: "salary_arrears", level1: "工资报酬", level2: "欠薪", confidence: 0.85, extractedKeywords: ["欠薪"], summary: "拖欠工资纠纷" },
  };
  const field: FollowUpField = { fieldId: "testField", label: "测试字段", type: "text", required: true };
  const fieldMsg: ChatMessageType = {
    id: "5", role: "assistant", content: "请补充信息", createdAt: "2026-01-01T00:00:00Z",
    fields: [field],
  };

  it("renders user message content", () => {
    render(<ChatMessage message={userMsg} />);
    expect(screen.getByText("我的问题")).toBeTruthy();
  });

  it("renders assistant message content", () => {
    render(<ChatMessage message={assistantMsg} />);
    expect(screen.getByText("系统回复")).toBeTruthy();
  });

  it("shows typing indicator when isLoading", () => {
    render(<ChatMessage message={loadingMsg} />);
    expect(screen.getByText(/AI 正在输入/)).toBeTruthy();
  });

  it("renders intent info when message has intent", () => {
    render(<ChatMessage message={intentMsg} onConfirmIntent={() => {}} onCorrectIntent={() => {}} />);
    expect(screen.getByText(/工资报酬/)).toBeTruthy();
  });

  it("renders fields when message has fields", () => {
    render(<ChatMessage message={fieldMsg} onFieldResponse={() => {}} />);
    expect(screen.getByText("测试字段")).toBeTruthy();
  });

  it("shows timestamp", () => {
    render(<ChatMessage message={assistantMsg} />);
    expect(screen.getByText(/01-01/)).toBeTruthy();
  });
});

// ==================== IntentTag ====================
describe("IntentTag", () => {
  const intent: IntentResult = {
    categoryId: "salary_arrears", level1: "工资报酬", level2: "欠薪",
    confidence: 0.85, extractedKeywords: ["欠薪"], summary: "拖欠工资纠纷",
  };

  it("displays category info", () => {
    render(<IntentTag intent={intent} onConfirm={() => {}} onCorrect={() => {}} />);
    expect(screen.getByText(/工资报酬/)).toBeTruthy();
    expect(screen.getByText(/85%/)).toBeTruthy();
  });

  it("calls onConfirm when confirm clicked", () => {
    const onConfirm = vi.fn();
    render(<IntentTag intent={intent} onConfirm={onConfirm} onCorrect={() => {}} />);
    fireEvent.click(screen.getByText(/正确，继续/));
    expect(onConfirm).toHaveBeenCalledWith("salary_arrears");
  });

  it("calls onCorrect when correct clicked", () => {
    const onCorrect = vi.fn();
    render(<IntentTag intent={intent} onConfirm={() => {}} onCorrect={onCorrect} />);
    fireEvent.click(screen.getByText(/纠正/));
    expect(onCorrect).toHaveBeenCalled();
  });

  it("hides buttons when confirmed", () => {
    render(<IntentTag intent={intent} onConfirm={() => {}} onCorrect={() => {}} isConfirmed={true} />);
    expect(screen.queryByText(/正确，继续/)).toBeNull();
  });
});

// ==================== SkipButton ====================
describe("SkipButton", () => {
  it("responds to click", () => {
    const onClick = vi.fn();
    render(<SkipButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders in loading state", () => {
    render(<SkipButton onClick={() => {}} isLoading={true} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders in disabled state", () => {
    render(<SkipButton onClick={() => {}} disabled={true} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});

// ==================== TypingIndicator ====================
describe("TypingIndicator", () => {
  it("shows AI typing text", () => {
    render(<TypingIndicator />);
    expect(screen.getByText(/AI 正在输入/)).toBeTruthy();
  });

  it("renders bouncing dots", () => {
    const { container } = render(<TypingIndicator />);
    expect(container.querySelectorAll('[class*="bounce"]').length).toBeGreaterThanOrEqual(1);
  });
});

// ==================== ContextSummary ====================
describe("ContextSummary", () => {
  const intent: IntentResult = {
    categoryId: "salary_arrears", level1: "工资报酬", level2: "欠薪",
    confidence: 0.85, extractedKeywords: [], summary: "拖欠工资",
  };

  it("renders with title", () => {
    render(<ContextSummary messagesCount={0} intent={null} collectedFields={{}} />);
    expect(screen.getByText(/对话摘要/)).toBeTruthy();
  });

  it("shows intent category when provided", () => {
    render(<ContextSummary messagesCount={3} intent={intent} collectedFields={{}} />);
    expect(screen.getByText(/工资报酬/)).toBeTruthy();
  });

  it("shows collected fields count", () => {
    render(<ContextSummary messagesCount={3} intent={intent} collectedFields={{ f1: "v1", f2: "v2" }} />);
    expect(screen.getByText(/2 项关键/)).toBeTruthy();
  });

  it("calls onContinue when button clicked", () => {
    const onContinue = vi.fn();
    render(<ContextSummary messagesCount={3} intent={intent} collectedFields={{}} onContinue={onContinue} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onContinue).toHaveBeenCalled();
  });
});
