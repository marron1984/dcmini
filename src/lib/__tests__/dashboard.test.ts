import { describe, it, expect } from "vitest";
import { computeDashboardStats } from "@/lib/data/admin";
import type { Lead, Tour } from "@/lib/types";

const NOW = new Date("2026-06-15T09:00:00Z"); // 月初=2026-06-01

function lead(over: Partial<Lead>): Lead {
  return {
    id: Math.random().toString(36).slice(2),
    status: "new",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    status_changed_at: "2026-01-01T00:00:00Z",
    assigned_user: null,
    ...over,
  } as unknown as Lead;
}

function tour(scheduled_at: string): Tour {
  return { id: Math.random().toString(36).slice(2), scheduled_at } as unknown as Tour;
}

describe("computeDashboardStats", () => {
  const leads: Lead[] = [
    // 今月の新規・初回未対応（5日経過）→ overdue
    lead({ status: "new", created_at: "2026-06-10T00:00:00Z", assigned_user: { id: "u1", name: "佐藤" } }),
    // 今月入居（status_changed_atは6月、updated_atは5月）→ 今月入居にカウント
    lead({ status: "moved_in", status_changed_at: "2026-06-05T00:00:00Z", updated_at: "2026-05-01T00:00:00Z", assigned_user: { id: "u1", name: "佐藤" } }),
    // 先月入居（updated_atを今月に編集しても、status_changed_atが先月なので今月にカウントしない）
    lead({ status: "moved_in", status_changed_at: "2026-05-20T00:00:00Z", updated_at: "2026-06-14T00:00:00Z" }),
    // 今月失注
    lead({ status: "lost", status_changed_at: "2026-06-02T00:00:00Z" }),
  ];
  const rooms = [
    { id: "r1", status: "vacant" },
    { id: "r2", status: "vacant" },
    { id: "r3", status: "occupied" },
  ];
  const tours: Tour[] = [tour("2026-06-20T00:00:00Z"), tour("2026-05-10T00:00:00Z")];

  const stats = computeDashboardStats(leads, rooms, tours, NOW);

  it("総数とステータス別集計", () => {
    expect(stats.total).toBe(4);
    expect(stats.byStatus.moved_in).toBe(2);
    expect(stats.byStatus.lost).toBe(1);
  });

  it("今月入居は status_changed_at で判定（updated_at編集に影響されない）", () => {
    expect(stats.movedInThisMonth).toBe(1); // 6月入居の1件のみ。5月入居は除外
    expect(stats.lostThisMonth).toBe(1);
  });

  it("今月の新規相談数", () => {
    expect(stats.newThisMonth).toBe(1);
  });

  it("空室・総室数", () => {
    expect(stats.vacantRooms).toBe(2);
    expect(stats.totalRooms).toBe(3);
  });

  it("見学（今月・今後）", () => {
    expect(stats.toursThisMonth).toBe(1); // 6/20のみ（5/10は先月）
    expect(stats.upcomingTours).toHaveLength(1); // 6/20は未来
  });

  it("要対応（初回未対応2日超）", () => {
    expect(stats.overdueLeads).toHaveLength(1);
  });

  it("担当者別成績（u1: 担当2・入居1）", () => {
    const u1 = stats.staffPerformance.find((s) => s.id === "u1");
    expect(u1?.total).toBe(2);
    expect(u1?.movedIn).toBe(1);
  });
});
