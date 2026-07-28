// ============================================================
// Legal AI Lab — 前端 API 客户端
// 封装后端 REST API 调用，统一错误处理
// ============================================================

import type {
  ApiResponse,
  IdentifyRequest,
  IdentifyResponse,
  AskRequest,
  AskResponse,
  SkipRequest,
  SkipResponse,
  KnowledgeCategory,
  FollowUpField,
} from "@/lib/types";

const BASE_URL = "/api/v1";

// ---- 通用请求封装 ----

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    options.signal = controller.signal;
    response = await fetch(url, options);
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("请求超时，请检查网络后重试");
    }
    throw new Error(`网络错误：${err instanceof Error ? err.message : "未知错误"}`);
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new Error(`服务器返回格式异常（${response.status}）`);
  }

  if (json.code !== 0) {
    throw new Error(json.message || `服务器错误（${json.code}）`);
  }

  return json.data as T;
}

// ---- Chat API ----

/** 意图识别：提交自然语言，返回分类结果 */
export async function identifyIntent(
  message: string,
): Promise<IdentifyResponse> {
  return request<IdentifyResponse>("POST", "/chat/identify", {
    message,
  } satisfies IdentifyRequest);
}

/** 对话/追问：提交消息和上下文 */
export async function askFollowUp(
  payload: AskRequest,
): Promise<AskResponse> {
  return request<AskResponse>("POST", "/chat/ask", payload);
}

/** 跳过追问，直接生成初步结果 */
export async function skipFollowUp(
  payload: SkipRequest,
): Promise<SkipResponse> {
  return request<SkipResponse>("POST", "/chat/skip", payload);
}

// ---- Knowledge API ----

/** 获取全部分类树 */
export async function fetchCategories(): Promise<KnowledgeCategory[]> {
  return request<KnowledgeCategory[]>("GET", "/knowledge/categories");
}

/** 获取某分类的字段定义 */
export async function fetchCategoryFields(
  categoryId: string,
): Promise<FollowUpField[]> {
  return request<FollowUpField[]>(
    "GET",
    `/knowledge/categories/${encodeURIComponent(categoryId)}/fields`,
  );
}

/** 知识检索 */
export async function searchKnowledge(
  query: string,
): Promise<{ categoryId: string; level1: string; level2: string; displayName: string; relevance: number }[]> {
  return request("POST", "/knowledge/search", { query });
}
