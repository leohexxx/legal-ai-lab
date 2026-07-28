// ============================================================
// Legal AI Lab — 律师数据模块测试
// ============================================================

import { describe, it, expect } from "vitest";
import { MOCK_LAWYERS, getLawyerById, filterLawyers } from "@/lib/lawyers";

describe("律师模拟数据", () => {
  it("应有 8 位律师", () => {
    expect(MOCK_LAWYERS).toHaveLength(8);
  });

  it("每位律师应有完整字段", () => {
    for (const lawyer of MOCK_LAWYERS) {
      expect(lawyer.id).toBeTruthy();
      expect(lawyer.name).toBeTruthy();
      expect(lawyer.firm).toBeTruthy();
      expect(lawyer.specialties).toBeInstanceOf(Array);
      expect(lawyer.feeRange.min).toBeGreaterThan(0);
      expect(lawyer.rating).toBeGreaterThanOrEqual(1);
      expect(lawyer.rating).toBeLessThanOrEqual(5);
    }
  });
});

describe("getLawyerById", () => {
  it("应通过 ID 查找律师", () => {
    const lawyer = getLawyerById("L001");
    expect(lawyer).toBeDefined();
    expect(lawyer?.name).toBe("张明华");
  });

  it("不存在的 ID 应返回 undefined", () => {
    const lawyer = getLawyerById("L999");
    expect(lawyer).toBeUndefined();
  });
});

describe("filterLawyers", () => {
  it("不过滤时返回所有律师", () => {
    const result = filterLawyers({});
    expect(result).toHaveLength(8);
  });

  it("按城市筛选", () => {
    const result = filterLawyers({ city: "北京" });
    expect(result.every((l) => l.city.includes("北京"))).toBe(true);
  });

  it("按专业领域筛选", () => {
    const result = filterLawyers({ specialties: ["劳动争议"] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((l) => l.specialties.includes("劳动争议"))).toBe(true);
  });

  it("按最大费用筛选", () => {
    const result = filterLawyers({ maxFee: 3000 });
    expect(result.every((l) => l.feeRange.min <= 3000)).toBe(true);
  });

  it("按可接案状态筛选", () => {
    const result = filterLawyers({ availability: "available" });
    expect(result.every((l) => l.availability === "available")).toBe(true);
  });

  it("组合多个筛选条件", () => {
    const result = filterLawyers({
      city: "北京",
      availability: "available",
    });
    expect(result.every((l) => l.city.includes("北京") && l.availability === "available")).toBe(true);
  });
});
