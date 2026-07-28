"""E2E API tests for Legal AI Lab."""
import httpx
import json
import sys

BASE = "http://localhost:8002/api/v1"

passed = 0
failed = 0

def check(name: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        print(f"  ✅ {name}")
        passed += 1
    else:
        print(f"  ❌ {name} — {detail}")
        failed += 1

def get(path: str, expect_code: int = 200):
    r = httpx.get(f"{BASE}{path}", timeout=10)
    check(f"GET {path} → {r.status_code}", r.status_code == expect_code,
          f"Expected {expect_code}, got {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        check(f"GET {path} code=0", data.get("code") == 0,
              f"code={data.get('code')}")
        return data
    return None

def post(path: str, body: dict, expect_code: int = 200):
    r = httpx.post(f"{BASE}{path}", json=body, timeout=30)
    check(f"POST {path} → {r.status_code}", r.status_code == expect_code,
          f"Expected {expect_code}, got {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        check(f"POST {path} code=0", data.get("code") == 0,
              f"code={data.get('code')}")
        return data
    return None


# ============================================================
# Test 1.1: Knowledge Graph Categories
# ============================================================
print("\n=== 1.1 Knowledge Graph Categories ===")
data = get("/knowledge/categories")
if data:
    cats = data.get("data", [])
    check("Categories list is non-empty", len(cats) > 0, f"count={len(cats)}")
    # Check expected count (data has 40 categories)
    check("Has 42 categories", len(cats) == 42, f"count={len(cats)}")
    first = cats[0]
    check("First has categoryId", "categoryId" in first)
    check("First has level1", "level1" in first)
    check("First has level2", "level2" in first)
    check("First has displayName", "displayName" in first)
    check("First has keywords", "keywords" in first)
    check("First has requiredFields", "requiredFields" in first)

# ============================================================
# Test 1.5: Category Detail
# ============================================================
print("\n=== 1.5 Category Detail (contract_renewal) ===")
data = get("/knowledge/categories/contract_renewal")
if data:
    d = data.get("data", {})
    check("Has categoryId == contract_renewal", d.get("categoryId") == "contract_renewal")
    check("Has keywords list", isinstance(d.get("keywords"), list))
    check("Has requiredFields list", isinstance(d.get("requiredFields"), list))
    check("Has relevantLaws", "relevantLaws" in d)
    check("Has excludeFrom", "excludeFrom" in d)
    check("Has relatedQuestions", "relatedQuestions" in d)
    check("excludeFrom excludes salary_arrears", "salary_arrears" in d.get("excludeFrom", []))
    check("excludeFrom excludes illegal_termination", "illegal_termination" in d.get("excludeFrom", []))

# ============================================================
# Test 1.2: Intent Identification — Contract Non-Renewal
# ============================================================
print("\n=== 1.2 Intent — Contract Non-Renewal ===")
data = post("/chat/identify", {"message": "公司说合同到期不续签了，我这有补偿吗"})
if data:
    d = data.get("data", {})
    cid = d.get("categoryId", "")
    conf = d.get("confidence", 0)
    check(f"categoryId = contract_renewal (not salary_arrears)",
          cid == "contract_renewal",
          f"Got categoryId={cid}")
    check(f"confidence > 0.5", conf > 0.5, f"confidence={conf}")
    check("confidence <= 1.0", conf <= 1.0, f"confidence={conf}")
    check("has extractedKeywords", isinstance(d.get("extractedKeywords"), list))
    check("has summary", bool(d.get("summary")))
    check("summary <= 50 chars", len(d.get("summary", "")) <= 50,
          f"len={len(d.get('summary', ''))}")

# ============================================================
# Test 1.3: Intent Identification — Salary Arrears
# ============================================================
print("\n=== 1.3 Intent — Salary Arrears ===")
data = post("/chat/identify", {"message": "公司拖欠我三个月工资了，一直不发"})
if data:
    d = data.get("data", {})
    cid = d.get("categoryId", "")
    conf = d.get("confidence", 0)
    check(f"categoryId = salary_arrears",
          cid == "salary_arrears",
          f"Got categoryId={cid}")
    check("not misclassified as contract_renewal",
          cid != "contract_renewal",
          f"Got categoryId={cid}")
    check(f"confidence > 0.5", conf > 0.5, f"confidence={conf}")

# ============================================================
# Test 1.4: Intent Identification — Illegal Termination
# ============================================================
print("\n=== 1.4 Intent — Illegal Termination ===")
data = post("/chat/identify", {"message": "公司突然把我开除了，没有任何补偿"})
if data:
    d = data.get("data", {})
    cid = d.get("categoryId", "")
    conf = d.get("confidence", 0)
    check(f"categoryId = illegal_termination",
          cid == "illegal_termination",
          f"Got categoryId={cid}")
    check("not misclassified as contract_renewal",
          cid != "contract_renewal",
          f"Got categoryId={cid}")
    check("not misclassified as salary_arrears",
          cid != "salary_arrears",
          f"Got categoryId={cid}")
    check(f"confidence > 0.5", conf > 0.5, f"confidence={conf}")

# ============================================================
# Test 1.6: Chat Ask API
# ============================================================
print("\n=== 1.6 Chat Ask ===")
data = post("/chat/ask", {
    "message": "公司说合同到期不续签了",
    "contextId": "test-001",
})
if data:
    d = data.get("data", {})
    check("has message", bool(d.get("message")))
    check("has fields list", isinstance(d.get("fields"), list))
    check("has isComplete", "isComplete" in d)
    # The message doesn't have categoryId, so it should do intent identification first
    # and return intent info
    if d.get("intent"):
        check("intent has categoryId", bool(d["intent"].get("categoryId")))

# ============================================================
# Summary
# ============================================================
print(f"\n{'='*50}")
print(f"Total: {passed + failed} | Passed: {passed} | Failed: {failed}")
if failed > 0:
    print("SOME TESTS FAILED!")
    sys.exit(1)
else:
    print("ALL TESTS PASSED! ✅")
    sys.exit(0)
