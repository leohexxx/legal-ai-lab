"""Chat Service — DeepSeek API 调用与对话管理."""

import json
import logging
import time
import uuid
from typing import Any, Optional
from urllib.parse import urljoin

import httpx

from app.config import get_settings
from app.schemas.chat import (
    AskResponse,
    FollowUpField,
    IdentifyResponse,
    SkipResponse,
    FactExtracted,
)
from app.services.chat_prompts import build_intent_prompt, build_followup_prompt
from app.services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

# DeepSeek API 配置
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/v1/chat/completions"
DEFAULT_MODEL = "deepseek-chat"  # DeepSeek Pro 模型
REQUEST_TIMEOUT = 30  # 秒


class ChatService:
    """Chat Service.

    职责：
    - 调用 DeepSeek Pro API 进行意图识别
    - 管理对话上下文（内存中）
    - 生成追问字段
    - 跳过追问直接生成初步结果
    """

    def __init__(self, knowledge_service: KnowledgeService):
        self.knowledge_service = knowledge_service
        self.settings = get_settings()
        self.api_key = self.settings.llm_api_key or ""
        # 兼容 base_url（不含 /chat/completions）和完整 URL 两种配置
        raw_base = self.settings.llm_api_base or ""
        if raw_base and not raw_base.endswith("/chat/completions"):
            self.api_base = urljoin(raw_base.rstrip("/") + "/", "chat/completions")
        elif raw_base:
            self.api_base = raw_base
        else:
            self.api_base = DEEPSEEK_CHAT_COMPLETIONS_URL
        self.model = self.settings.llm_model or DEFAULT_MODEL
        self.request_timeout = self.settings.llm_timeout or REQUEST_TIMEOUT

        # 内存对话上下文存储 {contextId: {messages, categoryId, collectedFields, createdAt}}
        self._contexts: dict[str, dict[str, Any]] = {}

    # ---- 意图识别 ----

    async def identify_intent(self, message: str) -> IdentifyResponse:
        """识别用户输入的意图.

        Args:
            message: 用户输入的自然语言

        Returns:
            IdentifyResponse 包含分类 ID、置信度、关键词等

        Raises:
            ValueError: API 调用失败或返回格式异常
        """
        categories = self.knowledge_service.get_all_categories()
        prompt_messages = build_intent_prompt(message, categories)

        try:
            llm_response = await self._call_deepseek(prompt_messages)
            parsed = self._parse_intent_response(llm_response)
            return parsed
        except Exception as e:
            logger.error(f"意图识别失败: {e}")
            # 降级：使用关键词匹配
            return self._fallback_keyword_match(message, categories)

    # ---- 对话/追问 ----

    async def ask(
        self,
        message: str,
        context_id: Optional[str] = None,
        category_id: Optional[str] = None,
        collected_fields: Optional[dict[str, str]] = None,
    ) -> AskResponse:
        """处理对话/追问请求.

        Args:
            message: 用户消息
            context_id: 对话上下文 ID（首次为空，由后端生成）
            category_id: 已确认的分类 ID
            collected_fields: 已收集的字段

        Returns:
            AskResponse 包含系统回复、追问字段等
        """
        # 创建或获取上下文
        if not context_id or context_id not in self._contexts:
            context_id = self._create_context()

        context = self._contexts[context_id]

        # 如果收到 category_id，存入上下文
        if category_id:
            context["categoryId"] = category_id

        # 合并已收集字段
        if collected_fields:
            context["collectedFields"].update(collected_fields)

        # 判断是否是首次识别后的确认消息
        if category_id and not context.get("identified"):
            context["identified"] = True
            return await self._handle_first_confirmation(
                message, category_id, context_id, context
            )

        # 正常对话处理
        category = self.knowledge_service.get_category_by_id(
            context.get("categoryId", "")
        )

        if category:
            return await self._handle_follow_up(
                message, category, context_id, context
            )

        # 没有分类信息，做意图识别
        intent = await self.identify_intent(message)
        return AskResponse(
            message=intent.summary,
            intent=intent,
            fields=[],
            isComplete=False,
            contextId=context_id)

    # ---- 跳过追问 ----

    async def skip_and_generate(
        self,
        context_id: str,
        category_id: str,
        collected_fields: dict[str, str],
    ) -> SkipResponse:
        """跳过追问，基于已有信息直接生成初步结果.

        Args:
            context_id: 对话上下文 ID
            category_id: 分类 ID
            collected_fields: 已收集的字段

        Returns:
            SkipResponse 包含初步分析结果和提取的事实
        """
        category = self.knowledge_service.get_category_by_id(category_id)
        if not category:
            return SkipResponse(
                message="抱歉，我暂时无法为您分析这个问题。请重新描述。",
                factsExtracted=[],
            )

        # 根据已有字段生成事实列表
        facts: list[FactExtracted] = []
        for field_id, value in collected_fields.items():
            facts.append(FactExtracted(
                label=self._get_field_label(field_id, category),
                value=value,
                source="对话提取",
            ))

        # 生成初步分析文本
        level1 = category.get("level1", "")
        level2 = category.get("level2", "")
        display_name = category.get("displayName", "")
        field_count = len(collected_fields)

        if field_count == 0:
            conclusion = (
                f"根据您描述的情况，这看起来是一个**{display_name}**相关的问题。"
                f"要获得更准确的分析，建议补充更多信息（如工作年限、具体金额等）。\n\n"
                f"您可以点击下方按钮查看完整分析，或回到对话继续补充信息。"
            )
        else:
            conclusion = (
                f"根据您提供的信息，初步分析如下：\n\n"
                f"**问题类型**：{level1} → {level2}\n"
                f"**已掌握信息**：已收集 {field_count} 项关键信息\n\n"
                f"（基于部分信息的初步分析，完整分析需要更多细节）\n\n"
                f'点击"查看完整结果"进入事实确认页面。'
            )

        return SkipResponse(
            message=conclusion,
            factsExtracted=facts,
        )

    # ---- 内部方法 ----

    async def _call_deepseek(self, messages: list[dict]) -> str:
        """调用 DeepSeek API.

        Args:
            messages: OpenAI 格式的消息列表

        Returns:
            API 返回的 content 文本

        Raises:
            ConnectionError: API 不可达
            ValueError: 返回格式异常
        """
        if not self.api_key:
            logger.warning("DeepSeek API Key 未配置，使用关键词匹配降级")
            return ""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,  # 低温度确保分类一致性
            "max_tokens": 1024,
        }

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=self.request_timeout) as client:
                response = await client.post(
                    self.api_base,
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                result = response.json()
                elapsed = time.time() - start_time
                logger.info(f"DeepSeek API 调用成功，耗时 {elapsed:.2f}s")

                content = result["choices"][0]["message"]["content"]
                return content.strip()
        except httpx.TimeoutException:
            logger.error("DeepSeek API 超时")
            raise ConnectionError("DeepSeek API 请求超时")
        except httpx.HTTPStatusError as e:
            logger.error(f"DeepSeek API HTTP 错误: {e.response.status_code}")
            raise ValueError(f"DeepSeek API 返回错误: {e.response.status_code}")
        except Exception as e:
            logger.error(f"DeepSeek API 调用发生未知错误: {e}")
            raise

    def _parse_intent_response(self, content: str) -> IdentifyResponse:
        """解析 LLM 返回的意图识别 JSON.

        Args:
            content: LLM 返回的字符串

        Returns:
            IdentifyResponse
        """
        if not content:
            return IdentifyResponse(
                categoryId="unknown",
                level1="未知",
                level2="未知",
                confidence=0,
                extractedKeywords=[],
                summary="无法识别您的问题类型",
                alternativeCategories=[],
            )

        # 尝试提取 JSON（LLM 可能在 markdown 代码块中返回）
        cleaned = content.strip()
        if cleaned.startswith("```"):
            # 移除 markdown 代码块标记
            lines = cleaned.split("\n")
            cleaned = "\n".join(
                line for line in lines
                if not line.startswith("```")
            )

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning(f"无法解析 LLM 返回: {content[:200]}")
            return IdentifyResponse(
                categoryId="unknown",
                level1="未知",
                level2="未知",
                confidence=0,
                extractedKeywords=[],
                summary="系统无法识别您的问题类型",
                alternativeCategories=[],
            )

        alt_categories = []
        for alt in data.get("alternativeCategories", []):
            alt_categories.append({
                "categoryId": alt.get("categoryId", ""),
                "reason": alt.get("reason", ""),
            })

        return IdentifyResponse(
            categoryId=data.get("categoryId", "unknown"),
            level1=data.get("level1", "未知"),
            level2=data.get("level2", "未知"),
            confidence=float(data.get("confidence", 0)),
            extractedKeywords=data.get("extractedKeywords", []),
            summary=data.get("summary", "未知"),
            alternativeCategories=alt_categories,
        )

    def _fallback_keyword_match(
        self, message: str, categories: list[dict]
    ) -> IdentifyResponse:
        """关键词匹配降级方案.

        当 DeepSeek API 不可用时，用简单关键词匹配做意图识别。
        """
        message_lower = message.lower()
        best_score = 0
        best_cat = None

        for cat in categories:
            score = 0
            for kw in cat.get("keywords", []):
                if kw.lower() in message_lower:
                    score += 1
            if score > best_score:
                best_score = score
                best_cat = cat

        if best_cat and best_score >= 1:
            return IdentifyResponse(
                categoryId=best_cat["categoryId"],
                level1=best_cat["level1"],
                level2=best_cat["level2"],
                confidence=min(0.5 + best_score * 0.1, 0.8),
                extractedKeywords=best_cat["keywords"][:3],
                summary=best_cat["displayName"],
                alternativeCategories=[],
            )

        return IdentifyResponse(
            categoryId="unknown",
            level1="未知",
            level2="未知",
            confidence=0,
            extractedKeywords=[],
            summary="无法识别您的问题类型",
            alternativeCategories=[],
        )

    def _create_context(self) -> str:
        """创建新的对话上下文."""
        context_id = str(uuid.uuid4())
        self._contexts[context_id] = {
            "createdAt": time.time(),
            "messages": [],
            "categoryId": None,
            "collectedFields": {},
            "identified": False,
        }
        return context_id

    async def _handle_first_confirmation(
        self,
        message: str,
        category_id: str,
        context_id: str,
        context: dict,
    ) -> AskResponse:
        """处理首次确认后的逻辑 — 判断是否需要追问."""
        category = self.knowledge_service.get_category_by_id(category_id)
        if not category:
            return AskResponse(
                message="抱歉，我无法找到对应的分类信息。请重新描述您的问题。",
                intent=None,
                fields=[],
                isComplete=False,
            contextId=context_id)

        display_name = category.get("displayName", "")
        required_fields = category.get("requiredFields", [])
        collected = context["collectedFields"]

        # 判断信息是否充分
        # 简单策略：如果已收集字段覆盖了所有 requiredFields 的 50% 以上，认为可以给初步结论
        if required_fields:
            covered = sum(1 for f in required_fields if f in collected)
            coverage = covered / len(required_fields)
            if coverage >= 0.5 or len(collected) >= 3:
                return AskResponse(
                    message=(
                        f"好的！根据您提供的信息，我已经有了初步判断。\n\n"
                        f"**{display_name}**\n\n"
                        f"您现在想看初步分析结果，还是想再补充一些信息让分析更准确？"
                    ),
                    intent=None,
                    fields=[],
                    isComplete=True,
            contextId=context_id)

        # 信息不足，需要追问
        followup_fields = self.knowledge_service.get_category_fields(category_id)

        # 过滤掉已收集的字段
        remaining = [f for f in followup_fields if f["fieldId"] not in collected]

        if not remaining:
            return AskResponse(
                message="好的，信息已收集完毕，可以为您生成分析结果了。",
                intent=None,
                fields=[],
                isComplete=True,
            contextId=context_id)

        # 每次最多追问 3 个
        next_fields = remaining[:3]

        field_text = "\n".join([
            f"{i+1}. {f['label']}"
            for i, f in enumerate(next_fields)
        ])

        return AskResponse(
            message=(
                f"好的，为了帮您更准确地分析，请补充以下信息：\n\n"
                f"{field_text}\n\n"
                f'（您也可以随时选择"不补充，直接看结果"）'
            ),
            intent=None,
            fields=next_fields,
            isComplete=False,
            contextId=context_id)

    async def _handle_follow_up(
        self,
        message: str,
        category: dict,
        context_id: str,
        context: dict,
    ) -> AskResponse:
        """处理追问轮次."""
        required_fields = category.get("requiredFields", [])
        collected = context["collectedFields"]

        if required_fields:
            covered = sum(1 for f in required_fields if f in collected)
            coverage = covered / len(required_fields)
            if coverage >= 0.6:
                return AskResponse(
                    message="好的，信息已经比较充分了！可以为您生成分析结果。",
                    intent=None,
                    fields=[],
                    isComplete=True,
            contextId=context_id)

        # 继续追问未收集的字段
        followup_fields = self.knowledge_service.get_category_fields(
            category["categoryId"]
        )
        remaining = [f for f in followup_fields if f["fieldId"] not in collected]

        if not remaining:
            return AskResponse(
                message="信息已收集完整，可以生成分析结果了。",
                intent=None,
                fields=[],
                isComplete=True,
            contextId=context_id)

        next_fields = remaining[:3]
        field_text = "\n".join([
            f"{i+1}. {f['label']}"
            for i, f in enumerate(next_fields)
        ])

        return AskResponse(
            message=(
                f"感谢您的补充！还需要以下信息：\n\n"
                f"{field_text}\n\n"
                f'（也可以点击"不补充，直接看结果"）'
            ),
            intent=None,
            fields=next_fields,
            isComplete=False,
            contextId=context_id)

    def _get_field_label(self, field_id: str, category: dict) -> str:
        """获取字段的显示标签."""
        fields = self.knowledge_service.get_category_fields(category["categoryId"])
        for f in fields:
            if f["fieldId"] == field_id:
                return f["label"]
        return field_id
