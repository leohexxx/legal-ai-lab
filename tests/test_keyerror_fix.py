"""Test: KeyError fix for nonexistent context_id in ChatService.ask()"""
import sys, asyncio
sys.path.insert(0, "D:\\4.开发工具\\legal_ai_lab")

from app.services.chat_service import ChatService
from app.services.knowledge_service import KnowledgeService


async def test():
    svc = ChatService(KnowledgeService())

    # Test 1: None context_id should create new context (not crash)
    r1 = await svc.ask(message="hello", context_id=None)
    print(f"Test 1 (None context_id): isComplete={r1.isComplete}, fields_len={len(r1.fields)}")
    assert r1 is not None
    print("  ✅ PASS")

    # Test 2: nonexistent context_id should NOT raise KeyError
    r2 = await svc.ask(message="world", context_id="nonexistent-context-id")
    print(f"Test 2 (nonexistent context_id): isComplete={r2.isComplete}, fields_len={len(r2.fields)}")
    assert r2 is not None
    print("  ✅ PASS")

    print()
    print("🎉 All tests passed! KeyError bug is fixed.")


if __name__ == "__main__":
    asyncio.run(test())
