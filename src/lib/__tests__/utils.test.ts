import { describe, it, expect } from "vitest";
import { cn, formatYen, formatDate, relativeTime } from "@/lib/utils";

describe("cn", () => {
  it("クラスを結合し、後勝ちでTailwind競合を解決する", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});

describe("formatYen", () => {
  it("3桁区切りで円表記にする", () => {
    expect(formatYen(0)).toBe("¥0");
    expect(formatYen(1200)).toBe("¥1,200");
    expect(formatYen(130000)).toBe("¥130,000");
  });
  it("null/undefinedはダッシュ", () => {
    expect(formatYen(null)).toBe("—");
    expect(formatYen(undefined)).toBe("—");
  });
});

describe("formatDate", () => {
  it("不正値・空はダッシュ", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
  it("ISO文字列を日付に整形する", () => {
    expect(formatDate("2026-06-04T00:00:00.000Z")).toContain("2026");
  });
});

describe("relativeTime", () => {
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  it("当日は『今日』", () => {
    expect(relativeTime(new Date().toISOString())).toBe("今日");
  });
  it("1日前は『昨日』", () => {
    expect(relativeTime(daysAgo(1))).toBe("昨日");
  });
  it("数日前は『N日前』", () => {
    expect(relativeTime(daysAgo(5))).toBe("5日前");
  });
  it("数ヶ月前は『Nヶ月前』", () => {
    expect(relativeTime(daysAgo(70))).toBe("2ヶ月前");
  });
  it("空はダッシュ", () => {
    expect(relativeTime(null)).toBe("—");
  });
});
