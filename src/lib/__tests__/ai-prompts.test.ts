import { describe, it, expect } from "vitest";
import { buildLeadContext, AI_TASKS } from "@/lib/ai-prompts";
import type { Lead, LeadActivity } from "@/lib/types";

function makeLead(over: Partial<Lead> = {}): Lead {
  return {
    id: "l1",
    status: "hearing",
    assigned_user_id: null,
    referrer_id: null,
    consultant_name: "山田太郎",
    consultant_name_kana: null,
    consultant_phone: null,
    consultant_email: null,
    relationship: "長男",
    consultant_area: null,
    resident_name: "山田花子",
    resident_age: 85,
    resident_gender: "女性",
    resident_current_area: "自宅",
    care_level: "要介護3",
    dementia_status: true,
    welfare_status: false,
    medical_needs: null,
    mental_illness: null,
    has_guarantor: null,
    desired_move_in_date: "来月中",
    budget: 130000,
    desired_area: "大阪市西淀川区",
    note: "退院後の住まいを探しています。",
    hearing: { diagnosed: "yes", wandering: "yes", pension: "月12万円" },
    lost_reason: null,
    reapproach_date: null,
    lp_name: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    gclid: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  } as Lead;
}

describe("buildLeadContext", () => {
  it("主要な入居予定者情報を含む", () => {
    const ctx = buildLeadContext(makeLead());
    expect(ctx).toContain("要介護度: 要介護3");
    expect(ctx).toContain("認知症: あり");
    expect(ctx).toContain("生活保護: なし");
    expect(ctx).toContain("月額予算: 130,000円");
    expect(ctx).toContain("退院後の住まい");
  });

  it("ヒアリングのbool値を日本語化し、ラベル付きで出力する", () => {
    const ctx = buildLeadContext(makeLead());
    expect(ctx).toContain("## ヒアリング");
    expect(ctx).toContain("認知症診断の有無: あり");
    expect(ctx).toContain("徘徊: あり");
    expect(ctx).toContain("年金額: 月12万円");
  });

  it("未記入の項目（null/不明）を適切に表現する", () => {
    const ctx = buildLeadContext(makeLead({ care_level: null, medical_needs: null }));
    expect(ctx).toContain("要介護度: 不明");
    expect(ctx).toContain("医療行為: 不明");
  });

  it("対応履歴はステータス変更を除外して列挙する", () => {
    const activities: LeadActivity[] = [
      { id: "a1", lead_id: "l1", user_id: null, activity_type: "call", content: "初回架電・不在", next_action_date: null, created_at: "2026-06-02T00:00:00Z" },
      { id: "a2", lead_id: "l1", user_id: null, activity_type: "status_change", content: "ステータスを変更しました", next_action_date: null, created_at: "2026-06-02T01:00:00Z" },
    ];
    const ctx = buildLeadContext(makeLead(), activities);
    expect(ctx).toContain("初回架電・不在");
    expect(ctx).not.toContain("ステータスを変更しました");
  });
});

describe("AI_TASKS", () => {
  it("4種のタスクが system と instruction を持つ", () => {
    for (const key of ["summary", "matching", "family", "caremanager"] as const) {
      expect(AI_TASKS[key].system.length).toBeGreaterThan(20);
      expect(AI_TASKS[key].instruction.length).toBeGreaterThan(5);
    }
  });
});
