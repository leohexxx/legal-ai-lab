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
  skipResult: { message: string; factsExtracted: { label: string; value: string; source: string }[] } | null;

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
  skipResult: null,
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

        // 如果后端返回了 contextId，使用它（首次确认后）
        if (!state.contextId && response.contextId) {
          set({ contextId: response.contextId });
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

      // 保存 contextId（首次确认时从后端响应获取）
      if (!state.contextId && response.contextId) {
        set({ contextId: response.contextId });
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

      // 存储 skip 结果，供 U04 页面跳转 U05 时使用
      set({ skipResult: response });

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
