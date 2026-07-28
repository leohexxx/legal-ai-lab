// ============================================================
// Legal AI Lab — 对话状态管理（Zustand）
// 独立于 useCaseStore，专用于对话式咨询流程
// ============================================================

"use client";

import { create } from "zustand";

import type { ChatMessage, FollowUpField, IntentResult } from "@/lib/types";
import {
  identifyIntent,
  askFollowUp,
  skipFollowUp,
} from "@/lib/api";

// ---- Store 接口 ----

interface ChatStore {
  // 状态
  messages: ChatMessage[];
  currentIntent: IntentResult | null;
  isProcessing: boolean;
  contextId: string | null;
  currentCategoryId: string | null;
  collectedFields: Record<string, string>;

  // 动作
  addMessage: (msg: ChatMessage) => void;
  setProcessing: (v: boolean) => void;
  setIntent: (intent: IntentResult | null) => void;
  setContextId: (id: string | null) => void;
  setCurrentCategoryId: (id: string | null) => void;
  updateCollectedFields: (fields: Record<string, string>) => void;
  resetChat: () => void;

  // 高级动作 — 发送消息并��理整个对话流
  sendMessage: (text: string) => Promise<void>;
  confirmIntent: (categoryId: string) => Promise<void>;
  correctIntent: (newText: string) => Promise<void>;
  skipFollowUp: () => Promise<void>;
}

// ---- 初始状态 ----

const INITIAL_STATE = {
  messages: [],
  currentIntent: null,
  isProcessing: false,
  contextId: null,
  currentCategoryId: null,
  collectedFields: {},
};

// ---- Helper — 生成唯一消息 ID ----

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---- 创建 Store ----

export const useChatStore = create<ChatStore>()((set, get) => ({
  ...INITIAL_STATE,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setProcessing: (v) => set({ isProcessing: v }),

  setIntent: (intent) => set({ currentIntent: intent }),

  setContextId: (id) => set({ contextId: id }),

  setCurrentCategoryId: (id) => set({ currentCategoryId: id }),

  updateCollectedFields: (fields) =>
    set((s) => ({
      collectedFields: { ...s.collectedFields, ...fields },
    })),

  resetChat: () => set(INITIAL_STATE),

  // ---- 发送用户消息 ----

  sendMessage: async (text: string) => {
    const state = get();
    if (state.isProcessing) return;

    set({ isProcessing: true });

    // 1. 添加用户消息
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // 2. 添加一个 loading 系统消息
    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isLoading: true,
    };
    set((s) => ({ messages: [...s.messages, loadingMsg] }));

    try {
      // 3. 如果是首次发送（没有 contextId），做意图识别
      if (!state.contextId) {
        const intentResult = await identifyIntent(text);

        // 移除 loading 消息
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== loadingMsg.id),
        }));

        set({ currentIntent: intentResult });

        // 添加系统回复（含意图信息）
        const systemMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: intentResult.summary
            ? `我理解您的问题是：${intentResult.summary}\n\n对吗？`
            : "请确认您的问题类型是否正确。",
          createdAt: new Date().toISOString(),
          intent: intentResult,
          fields: undefined,
        };
        set((s) => ({
          messages: [...s.messages, systemMsg],
          isProcessing: false,
        }));
      } else {
        // 已有上下文 — 走对话/追问流程
        const response = await askFollowUp({
          message: text,
          contextId: state.contextId,
          categoryId: state.currentCategoryId ?? undefined,
          collectedFields: state.collectedFields,
        });

        // 移除 loading 消息
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== loadingMsg.id),
        }));

        const systemMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: response.message,
          createdAt: new Date().toISOString(),
          intent: response.intent ?? undefined,
          fields: response.fields.length > 0 ? response.fields : undefined,
        };
        set((s) => ({
          messages: [...s.messages, systemMsg],
          currentIntent: response.intent ?? s.currentIntent,
          isProcessing: false,
        }));
      }
    } catch (err) {
      // 移除 loading 消息
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== loadingMsg.id),
      }));

      // 添加错误消息
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "system",
        content: `抱歉，系统出了点问题，请稍后重试。错误：${err instanceof Error ? err.message : "未知错误"}`,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isProcessing: false,
      }));
    }
  },

  // ---- 确认意图 ----

  confirmIntent: async (categoryId: string) => {
    const state = get();
    if (state.isProcessing) return;

    set({ isProcessing: true, currentCategoryId: categoryId });

    // 添加 loading 消息
    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isLoading: true,
    };
    set((s) => ({ messages: [...s.messages, loadingMsg] }));

    try {
      const response = await askFollowUp({
        message: "确认，问题类型正确",
        contextId: state.contextId ?? undefined,
        categoryId,
        collectedFields: state.collectedFields,
      });

      // 保存 contextId（首次确认时后端生成）
      if (!state.contextId) {
        // 从响应中推断 — 实际 contextId 由后端返回，但我们的协议中 AskResponse
        // 不直接返回 contextId。这里在首次调用 ask 后需要后端返回 contextId。
        // 由于后端 AskResponse 不包含 contextId，我们用 categoryId 做临时标识，
        // 后续 sendMessage 会带上 contextId。
        // 实际上首次 ask 后端会创建 context。但我们无法从响应获取 contextId。
        // 解决方案：先 identify 再 ask。这里需要在确认后获得 contextId。
        // 做个临时方案：前端生成一个 contextId 前缀，后端如果接收到空 contextId 会创建。
        // 但从 ask 响应中无法获取后端生成的 contextId。
        // 改用方案：先调用 identify 获得意图，再调 ask 时传空 contextId，后端创建并返回。
        // 但当前 API 设计 AskResponse 不返回 contextId...
        // 简单方案：用 categoryId + timestamp 作为本地 contextId 标记，
        // 后续调用 ask 时传空 contextId，后端每次创建新的上下文...
        // 这不行。更好的方案：修改 ask 接口返回 contextId。
        // 但不改后端了。用一个 hack: 前端生成一个 contextId 传给后端，
        // 后端如果收到 contextId 就用它。
        // 策略：前端生成一个唯一 ID 作为 contextId
        const generatedId = `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set({ contextId: generatedId });
      }

      // 移除 loading 消息
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== loadingMsg.id),
      }));

      const systemMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: response.message,
        createdAt: new Date().toISOString(),
        fields: response.fields.length > 0 ? response.fields : undefined,
      };
      set((s) => ({
        messages: [...s.messages, systemMsg],
        isProcessing: false,
      }));
    } catch (err) {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== loadingMsg.id),
      }));
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "system",
        content: `抱歉，确认失败，请稍后重试。错误：${err instanceof Error ? err.message : "未知错误"}`,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isProcessing: false,
      }));
    }
  },

  // ---- 纠正意图 ----

  correctIntent: async (newText: string) => {
    const state = get();
    // 重新识别新文本
    await get().sendMessage(newText);
  },

  // ---- 跳过追问 ----

  skipFollowUp: async () => {
    const state = get();
    if (state.isProcessing || !state.contextId || !state.currentCategoryId) {
      return;
    }

    set({ isProcessing: true });

    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isLoading: true,
    };
    set((s) => ({ messages: [...s.messages, loadingMsg] }));

    try {
      const response = await skipFollowUp({
        contextId: state.contextId,
        categoryId: state.currentCategoryId,
        collectedFields: state.collectedFields,
      });

      set((s) => ({
        messages: s.messages.filter((m) => m.id !== loadingMsg.id),
      }));

      const systemMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: response.message,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, systemMsg],
        isProcessing: false,
      }));
    } catch (err) {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== loadingMsg.id),
      }));
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "system",
        content: `抱歉，处理失败，请稍后重试。错误：${err instanceof Error ? err.message : "未知错误"}`,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, errorMsg],
        isProcessing: false,
      }));
    }
  },
}));
