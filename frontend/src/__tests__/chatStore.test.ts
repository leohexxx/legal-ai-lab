import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChatStore } from "@/lib/chatStore";
import type { ChatMessage } from "@/lib/types";

// Mock API module
vi.mock("@/lib/api", () => ({
  identifyIntent: vi.fn(),
  askFollowUp: vi.fn(),
  skipFollowUp: vi.fn(),
}));

import { identifyIntent, askFollowUp, skipFollowUp } from "@/lib/api";

describe("ChatStore", () => {
  beforeEach(() => {
    useChatStore.getState().resetChat();
    vi.clearAllMocks();
  });

  // ---- 1: Initial state ----
  it("has correct initial state", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.currentIntent).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.contextId).toBeNull();
    expect(state.currentCategoryId).toBeNull();
    expect(state.collectedFields).toEqual({});
    expect(state.skipResult).toBeNull();
  });

  // ---- 2: addMessage ----
  it("addMessage appends a message", () => {
    const msg: ChatMessage = { id: "1", role: "user", content: "test", createdAt: new Date().toISOString() };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe("test");
  });

  // ---- 3: setProcessing ----
  it("setProcessing toggles processing state", () => {
    useChatStore.getState().setProcessing(true);
    expect(useChatStore.getState().isProcessing).toBe(true);
    useChatStore.getState().setProcessing(false);
    expect(useChatStore.getState().isProcessing).toBe(false);
  });

  // ---- 4: setIntent ----
  it("setIntent updates currentIntent", () => {
    const intent = { categoryId: "test", level1: "a", level2: "b", confidence: 0.9, extractedKeywords: [], summary: "test" };
    useChatStore.getState().setIntent(intent);
    expect(useChatStore.getState().currentIntent?.categoryId).toBe("test");
  });

  // ---- 5: updateCollectedFields merges ----
  it("updateCollectedFields merges fields", () => {
    useChatStore.getState().updateCollectedFields({ field1: "value1" });
    expect(useChatStore.getState().collectedFields).toEqual({ field1: "value1" });
    useChatStore.getState().updateCollectedFields({ field2: "value2" });
    expect(useChatStore.getState().collectedFields).toEqual({ field1: "value1", field2: "value2" });
  });

  // ---- 6: resetChat ----
  it("resetChat clears all state", () => {
    useChatStore.getState().addMessage({ id: "1", role: "user", content: "x", createdAt: "" });
    useChatStore.getState().setProcessing(true);
    useChatStore.getState().resetChat();
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isProcessing).toBe(false);
  });

  // ---- 7: sendMessage first time -> identifyIntent ----
  it("sendMessage first call invokes identifyIntent", async () => {
    const mockResp = { categoryId: "contract_renewal", level1: "劳动合同", level2: "续签", confidence: 0.85, extractedKeywords: ["不续签"], summary: "合同到期不续签纠纷" };
    (identifyIntent as any).mockResolvedValue(mockResp);

    await useChatStore.getState().sendMessage("合同到期不续签");

    expect(identifyIntent).toHaveBeenCalledWith("合同到期不续签");
    const msgs = useChatStore.getState().messages;
    expect(msgs.length).toBeGreaterThanOrEqual(2); // user msg + system reply
    const lastMsg = msgs[msgs.length - 1];
    expect(lastMsg.role).toBe("assistant");
    expect(lastMsg.intent?.categoryId).toBe("contract_renewal");
    expect(useChatStore.getState().isProcessing).toBe(false);
  });

  // ---- 8: sendMessage with context -> askFollowUp ----
  it("sendMessage with contextId calls askFollowUp", async () => {
    const mockAskResp = { message: "好的，请补充信息", intent: null, fields: [{ fieldId: "testField", label: "测试字段", type: "text", required: true }], isComplete: false };
    (askFollowUp as any).mockResolvedValue(mockAskResp);
    useChatStore.getState().setContextId("ctx-test");
    useChatStore.getState().setCurrentCategoryId("contract_renewal");

    await useChatStore.getState().sendMessage("工作3年了");

    expect(askFollowUp).toHaveBeenCalled();
    const msgs = useChatStore.getState().messages;
    expect(msgs.length).toBeGreaterThanOrEqual(2);
    const lastMsg = msgs[msgs.length - 1];
    expect(lastMsg.role).toBe("assistant");
    expect(lastMsg.content).toBe("好的，请补充信息");
  });

  // ---- 9: confirmIntent ----
  it("confirmIntent calls askFollowUp and stores contextId", async () => {
    const mockResp = { message: "确认成功", intent: null, fields: [], isComplete: false, contextId: "ctx-abc-123" };
    (askFollowUp as any).mockResolvedValue(mockResp);

    await useChatStore.getState().confirmIntent("salary_arrears");

    expect(askFollowUp).toHaveBeenCalledWith(expect.objectContaining({ categoryId: "salary_arrears" }));
    expect(useChatStore.getState().currentCategoryId).toBe("salary_arrears");
    expect(useChatStore.getState().contextId).toBe("ctx-abc-123");
  });

  // ---- 10: correctIntent ----
  it("correctIntent re-sends message", async () => {
    const mockResp = { categoryId: "overtime", level1: "工资报酬", level2: "加班费", confidence: 0.9, extractedKeywords: ["加班"], summary: "加班费纠纷" };
    (identifyIntent as any).mockResolvedValue(mockResp);

    await useChatStore.getState().correctIntent("经常加班不给加班费");

    expect(identifyIntent).toHaveBeenCalledWith("经常加班不给加班费");
  });

  // ---- 11: skipFollowUp ----
  it("skipFollowUp calls skip API and stores result", async () => {
    const mockResp = { message: "初步分析结果", factsExtracted: [{ label: "工作年限", value: "3年", source: "对话提取" }] };
    (skipFollowUp as any).mockResolvedValue(mockResp);
    useChatStore.getState().setContextId("ctx-test");
    useChatStore.getState().setCurrentCategoryId("contract_renewal");

    await useChatStore.getState().skipFollowUp();

    expect(skipFollowUp).toHaveBeenCalled();
    expect(useChatStore.getState().skipResult).toBeTruthy();
    expect(useChatStore.getState().skipResult?.factsExtracted).toHaveLength(1);
  });

  // ---- 12: concurrency guard ----
  it("ignores sendMessage when isProcessing", async () => {
    useChatStore.getState().setProcessing(true);
    await useChatStore.getState().sendMessage("test");
    expect(identifyIntent).not.toHaveBeenCalled();
  });
});
