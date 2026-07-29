"""Backend API unit tests for Legal AI Lab chat endpoints.

Uses httpx with mock to avoid actual DeepSeek API calls.
Run: python -m pytest tests/test_chat_api.py -v
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def client():
    """Create test client using ASGI transport (no real server needed)."""
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# ============================================================
# Health
# ============================================================
@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


# ============================================================
# GET /knowledge/categories
# ============================================================
@pytest.mark.asyncio
async def test_categories_list(client):
    resp = await client.get("/api/v1/knowledge/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    assert len(data["data"]) == 42


@pytest.mark.asyncio
async def test_category_detail(client):
    resp = await client.get("/api/v1/knowledge/categories/contract_renewal")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["categoryId"] == "contract_renewal"
    assert "keywords" in data
    assert "requiredFields" in data
    assert "excludeFrom" in data
    assert "salary_arrears" in data["excludeFrom"]


@pytest.mark.asyncio
async def test_category_detail_not_found(client):
    resp = await client.get("/api/v1/knowledge/categories/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_category_fields(client):
    resp = await client.get("/api/v1/knowledge/categories/contract_renewal/fields")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    fields = data["data"]
    assert len(fields) >= 3
    for f in fields:
        assert "fieldId" in f
        assert "label" in f
        assert "type" in f


# ============================================================
# POST /chat/identify
# ============================================================
@pytest.mark.asyncio
async def test_identify_valid(client):
    """Normal request returns categoryId with reasonable confidence."""
    resp = await client.post("/api/v1/chat/identify", json={
        "message": "公司拖欠我三个月工资了"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    result = data["data"]
    assert result["categoryId"] == "salary_arrears"
    assert result["confidence"] > 0.5
    assert len(result["extractedKeywords"]) > 0
    assert len(result["summary"]) <= 50


@pytest.mark.asyncio
async def test_identify_empty_message(client):
    """Empty message should return 422 validation error."""
    resp = await client.post("/api/v1/chat/identify", json={"message": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_identify_missing_body(client):
    """Missing body should return 422."""
    resp = await client.post("/api/v1/chat/identify", json={})
    assert resp.status_code == 422


# ============================================================
# POST /chat/ask
# ============================================================
@pytest.mark.asyncio
async def test_ask_without_context(client):
    """First ask call without contextId creates a new context."""
    resp = await client.post("/api/v1/chat/ask", json={
        "message": "确认，问题类型正确",
        "categoryId": "contract_renewal",
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["message"]
    # contextId should be returned
    assert data.get("contextId") is not None, "contextId should be returned"


@pytest.mark.asyncio
async def test_ask_with_context(client):
    """Ask with existing contextId returns follow-up questions."""
    # First create a context
    resp = await client.post("/api/v1/chat/ask", json={
        "message": "确认，问题类型正确",
        "categoryId": "contract_renewal",
    })
    ctx_id = resp.json()["data"]["contextId"]
    assert ctx_id is not None

    # Then ask with that context
    resp = await client.post("/api/v1/chat/ask", json={
        "message": "工作了3年",
        "contextId": ctx_id,
        "categoryId": "contract_renewal",
        "collectedFields": {"yearsOfService": "3年"},
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["message"]
    assert "fields" in data
    assert "isComplete" in data


@pytest.mark.asyncio
async def test_ask_nonexistent_context(client):
    """Non-existent contextId should not throw KeyError, auto-creates new context."""
    resp = await client.post("/api/v1/chat/ask", json={
        "message": "test",
        "contextId": "nonexistent-ctx-999",
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["message"]


# ============================================================
# POST /chat/skip
# ============================================================
@pytest.mark.asyncio
async def test_skip_valid(client):
    """Skip returns message and factsExtracted."""
    resp = await client.post("/api/v1/chat/skip", json={
        "contextId": "test-skip-001",
        "categoryId": "contract_renewal",
        "collectedFields": {"yearsOfService": "3年", "contractPeriod": "固定期限"},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
    result = data["data"]
    assert result["message"]
    assert "factsExtracted" in result


@pytest.mark.asyncio
async def test_skip_invalid_category(client):
    """Skip with nonexistent categoryId returns friendly message."""
    resp = await client.post("/api/v1/chat/skip", json={
        "contextId": "test-skip-002",
        "categoryId": "nonexistent_cat",
        "collectedFields": {},
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["message"]


# ============================================================
# POST /knowledge/search
# ============================================================
@pytest.mark.asyncio
async def test_search(client):
    resp = await client.post("/api/v1/knowledge/search", json={
        "query": "合同到期不续签",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == 0
