// ============================================================
// ChatMessage — 聊天消息气泡
// 支持用户/系统角色区分、intent 标签、fields 追问、loading 动画
// ============================================================

"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import IntentTag from "./IntentTag";
import SkipButton from "./SkipButton";
import TypingIndicator from "./TypingIndicator";

interface ChatMessageProps {
  message: ChatMessageType;
  onConfirmIntent?: (categoryId: string) => void;
  onCorrectIntent?: () => void;
  onSkipFollowUp?: () => void;
  onFieldResponse?: (fieldId: string, value: string) => void;
  isIntentConfirmed?: boolean;
}

/** 简单渲染 markdown（支持换行和加粗） */
function renderSimpleMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // 加粗 **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

/** 格式化时间戳 */
function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const timeStr = d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (isToday) return timeStr;
    if (isYesterday) return `昨天 ${timeStr}`;
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${timeStr}`;
  } catch {
    return "";
  }
}

export default function ChatMessage({
  message,
  onConfirmIntent,
  onCorrectIntent,
  onSkipFollowUp,
  onFieldResponse,
  isIntentConfirmed = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isLoading = message.isLoading;
  const hasIntent = message.intent && !isIntentConfirmed;
  const hasFields = message.fields && message.fields.length > 0;

  // Record which fields have been responded to locally
  const [localResponses, setLocalResponses] = useState<Record<string, string>>({});

  const handleFieldSelect = (fieldId: string, value: string) => {
    setLocalResponses((prev) => ({ ...prev, [fieldId]: value }));
    onFieldResponse?.(fieldId, value);
  };

  const handleFieldTextChange = (fieldId: string, value: string) => {
    setLocalResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFieldSubmit = (fieldId: string) => {
    const value = localResponses[fieldId];
    if (value && onFieldResponse) {
      onFieldResponse(fieldId, value);
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "order-1" : "order-1"}`}>
        {/* 消息本体 */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-white rounded-br-md"
              : isSystem
                ? "bg-red-50 border border-red-100 text-gray-700 rounded-bl-md"
                : "bg-gray-50 border border-gray-100 text-gray-700 rounded-bl-md"
          }`}
        >
          {/* 机器人标识 */}
          {!isUser && !isLoading && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                AI
              </span>
              <span className="text-xs text-gray-400">法律助手</span>
            </div>
          )}

          {/* 内容 */}
          {isLoading ? (
            <TypingIndicator />
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {renderSimpleMarkdown(message.content)}
            </div>
          )}

          {/* 时间戳 */}
          {!isLoading && (
            <div className={`mt-1.5 text-[10px] ${isUser ? "text-white/60" : "text-gray-400"}`}>
              {formatTime(message.createdAt)}
            </div>
          )}
        </div>

        {/* 意图标签区域（系统消息特有） */}
        {hasIntent && message.intent && onConfirmIntent && onCorrectIntent && (
          <div className="mt-2">
            <IntentTag
              intent={message.intent}
              onConfirm={onConfirmIntent}
              onCorrect={onCorrectIntent}
              disabled={isIntentConfirmed}
            />
          </div>
        )}

        {/* 追问字段区域 */}
        {hasFields && message.fields && (
          <div className="mt-2 space-y-2">
            {message.fields.map((field) => {
              const hasResponded = !!localResponses[field.fieldId];
              return (
                <div
                  key={field.fieldId}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </div>

                  {field.type === "select" && field.options ? (
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleFieldSelect(field.fieldId, opt.value)}
                          className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                            localResponses[field.fieldId] === opt.value
                              ? "border-primary bg-primary-light/30 text-primary font-medium"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        value={localResponses[field.fieldId] || ""}
                        onChange={(e) => handleFieldTextChange(field.fieldId, e.target.value)}
                        placeholder={`请输入${field.label}`}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-primary focus:ring-2 focus:ring-primary-light focus:outline-none"
                      />
                      {!hasResponded && (
                        <button
                          onClick={() => handleFieldSubmit(field.fieldId)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-[#3C3489] transition-colors"
                        >
                          提交
                        </button>
                      )}
                    </div>
                  )}

                  {hasResponded && (
                    <div className="mt-1 text-[10px] text-green-600">
                      ✅ 已记录
                    </div>
                  )}
                </div>
              );
            })}

            {/* "不补充"按钮 */}
            {onSkipFollowUp && (
              <div className="flex justify-center pt-1">
                <SkipButton onClick={onSkipFollowUp} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
