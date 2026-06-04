import { describe, it, expect } from "vitest";
import { scoreFacility, matchFacilities, scoreColor } from "@/lib/matching";
import type { Lead, Facility, Room } from "@/lib/types";

function makeLead(over: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    status: "new",
    assigned_user_id: null,
    referrer_id: null,
    consultant_name: "テスト",
    consultant_name_kana: null,
    consultant_phone: null,
    consultant_email: null,
    relationship: null,
    consultant_area: null,
    resident_name: null,
    resident_age: null,
    resident_gender: null,
    resident_current_area: null,
    care_level: null,
    dementia_status: null,
    welfare_status: null,
    medical_needs: null,
    mental_illness: null,
    has_guarantor: null,
    desired_move_in_date: null,
    budget: null,
    desired_area: null,
    note: null,
    hearing: {},
    lost_reason: null,
    reapproach_date: null,
    lp_name: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    gclid: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

function vacantRoom(): Room {
  return {
    id: "room-1",
    facility_id: "fac-1",
    room_number: "101",
    floor: 1,
    rent: null,
    common_fee: null,
    meal_fee: null,
    management_fee: null,
    status: "vacant",
    note: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function makeFacility(over: Partial<Facility> = {}): Facility {
  return {
    id: "fac-1",
    name: "テスト施設",
    address: "大阪市西淀川区1-2-3",
    area: "大阪市西淀川区",
    nearest_station: null,
    type: "住宅型有料老人ホーム",
    capacity: null,
    monthly_fee: 120000,
    initial_fee: null,
    max_care_level: "要介護5",
    accepts_dementia: true,
    accepts_welfare: true,
    medical_support: ["インスリン"],
    end_of_life_care: false,
    photo_urls: null,
    description: null,
    is_published: true,
    note: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rooms: [vacantRoom()],
    ...over,
  };
}

describe("scoreFacility", () => {
  it("全条件が合致すると100%になる", () => {
    const lead = makeLead({
      welfare_status: true,
      budget: 130000,
      dementia_status: true,
      medical_needs: true,
      care_level: "要介護3",
      desired_area: "大阪市西淀川区",
    });
    const result = scoreFacility(lead, makeFacility());
    expect(result.score).toBe(100);
    expect(result.reasons.every((r) => r.ok)).toBe(true);
  });

  it("生活保護に対応しないと該当理由がNGになりスコアが下がる", () => {
    const lead = makeLead({ welfare_status: true, budget: 130000 });
    const facility = makeFacility({ accepts_welfare: false });
    const result = scoreFacility(lead, facility);
    const welfareReason = result.reasons.find((r) => r.label.includes("生活保護"));
    expect(welfareReason?.ok).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it("予算を超える施設は予算理由がNGになる", () => {
    const lead = makeLead({ budget: 100000 });
    const facility = makeFacility({ monthly_fee: 200000 });
    const result = scoreFacility(lead, facility);
    const budgetReason = result.reasons.find((r) => r.label.includes("予算"));
    expect(budgetReason?.ok).toBe(false);
  });

  it("要介護度が対応上限を超えるとNG", () => {
    const lead = makeLead({ care_level: "要介護5" });
    const facility = makeFacility({ max_care_level: "要介護2" });
    const result = scoreFacility(lead, facility);
    const careReason = result.reasons.find((r) => r.label.includes("要介護度"));
    expect(careReason?.ok).toBe(false);
  });

  it("空室がない場合は空室理由がNG", () => {
    const facility = makeFacility({ rooms: [] });
    const result = scoreFacility(makeLead(), facility);
    const vacancy = result.reasons.find((r) => r.label.includes("空室"));
    expect(vacancy?.ok).toBe(false);
  });
});

describe("matchFacilities", () => {
  it("適合度の高い順に並ぶ", () => {
    const lead = makeLead({ welfare_status: true, budget: 130000 });
    const good = makeFacility({ id: "good", accepts_welfare: true });
    const bad = makeFacility({ id: "bad", accepts_welfare: false, rooms: [] });
    const result = matchFacilities(lead, [bad, good]);
    expect(result[0].facility.id).toBe("good");
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });
});

describe("scoreColor", () => {
  it("スコア帯に応じた色クラスを返す", () => {
    expect(scoreColor(90)).toContain("emerald");
    expect(scoreColor(70)).toContain("amber");
    expect(scoreColor(40)).toContain("slate");
  });
});
