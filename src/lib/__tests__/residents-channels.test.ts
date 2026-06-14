import { describe, it, expect } from "vitest";
import {
  computeChannelStats,
  computeResidentStats,
} from "@/lib/data/admin";
import type { Lead, Resident } from "@/lib/types";

function lead(over: Partial<Lead>): Pick<Lead, "id" | "channel" | "status"> {
  return {
    id: Math.random().toString(36).slice(2),
    channel: null,
    status: "new",
    ...over,
  } as Pick<Lead, "id" | "channel" | "status">;
}

describe("computeChannelStats", () => {
  it("チャネル別に相談数・見学・入居・成約率を集計する", () => {
    const leads = [
      lead({ id: "a", channel: "web", status: "moved_in" }),
      lead({ id: "b", channel: "web", status: "new" }),
      lead({ id: "c", channel: "care_manager", status: "moved_in" }),
      lead({ id: "d", channel: null, status: "new" }), // 未分類
    ];
    const tours = [{ lead_id: "a" }, { lead_id: "a" }, { lead_id: "c" }];

    const stats = computeChannelStats(leads, tours);
    const web = stats.find((s) => s.channel === "web")!;
    const cm = stats.find((s) => s.channel === "care_manager")!;
    const unknown = stats.find((s) => s.channel === "unknown")!;

    expect(web.lead_count).toBe(2);
    expect(web.tour_count).toBe(2);
    expect(web.moved_in_count).toBe(1);
    expect(web.conversion_rate).toBe(50); // 1/2

    expect(cm.lead_count).toBe(1);
    expect(cm.tour_count).toBe(1);
    expect(cm.conversion_rate).toBe(100);

    expect(unknown.lead_count).toBe(1);
    expect(unknown.label).toBe("未分類");
  });

  it("相談0件のチャネルは結果に含めない", () => {
    const stats = computeChannelStats([lead({ channel: "web", status: "new" })], []);
    expect(stats.every((s) => s.lead_count > 0)).toBe(true);
    expect(stats.find((s) => s.channel === "regional")).toBeUndefined();
  });

  it("定義順（先頭=web）で並ぶ", () => {
    const leads = [
      lead({ channel: "care_manager", status: "new" }),
      lead({ channel: "web", status: "new" }),
    ];
    const stats = computeChannelStats(leads, []);
    expect(stats[0].channel).toBe("web");
  });
});

function resident(over: Partial<Resident>): Pick<Resident, "status" | "monthly_fee"> {
  return { status: "residing", monthly_fee: null, ...over } as Pick<Resident, "status" | "monthly_fee">;
}

describe("computeResidentStats", () => {
  it("ステータス別件数と入居中の月額合計を集計する", () => {
    const residents = [
      resident({ status: "residing", monthly_fee: 130000 }),
      resident({ status: "residing", monthly_fee: 150000 }),
      resident({ status: "scheduled", monthly_fee: 140000 }),
      resident({ status: "moved_out", monthly_fee: 120000 }),
    ];
    const stats = computeResidentStats(residents);

    expect(stats.total).toBe(4);
    expect(stats.residing).toBe(2);
    expect(stats.scheduled).toBe(1);
    expect(stats.movedOut).toBe(1);
    // 入居中のみ合算（予定・退去は除外）
    expect(stats.monthlyRevenue).toBe(280000);
  });

  it("月額未設定(null)は0として扱う", () => {
    const stats = computeResidentStats([
      resident({ status: "residing", monthly_fee: null }),
      resident({ status: "residing", monthly_fee: 100000 }),
    ]);
    expect(stats.monthlyRevenue).toBe(100000);
  });
});
