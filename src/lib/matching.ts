import { CARE_LEVELS } from "@/lib/constants";
import type { Lead, Facility } from "@/lib/types";

// =============================================================
// 20. AI施設マッチング（MVPはルールベースの適合度スコア）
// 相談者の条件と施設情報を突き合わせ、適合度(%)と理由を算出する。
// 将来的にLLMによるマッチングへ差し替え可能なように純粋関数で分離。
// =============================================================

export interface MatchReason {
  label: string;
  ok: boolean;
  weight: number;
}

export interface FacilityMatch {
  facility: Facility;
  score: number; // 0-100
  reasons: MatchReason[];
}

function careIndex(level: string | null | undefined): number {
  if (!level) return -1;
  return CARE_LEVELS.indexOf(level);
}

// エリアの緩いマッチ（市区町村名の部分一致）
function areaMatches(desired: string | null, facilityArea: string | null, address: string | null): boolean {
  if (!desired) return false;
  const target = `${facilityArea ?? ""} ${address ?? ""}`;
  // 「大阪市西淀川区」「西淀川」などの部分一致
  const tokens = desired.replace(/[、,\s]+/g, " ").split(" ").filter((t) => t.length >= 2);
  return tokens.some((t) => target.includes(t));
}

export function scoreFacility(lead: Lead, facility: Facility): FacilityMatch {
  const reasons: MatchReason[] = [];
  let earned = 0;
  let total = 0;

  const add = (applicable: boolean, ok: boolean, label: string, weight: number) => {
    if (!applicable) return;
    total += weight;
    if (ok) earned += weight;
    reasons.push({ label, ok, weight });
  };

  // 生活保護（必須要件に近い: 重み大）
  add(
    lead.welfare_status === true,
    facility.accepts_welfare,
    facility.accepts_welfare ? "生活保護に対応" : "生活保護は対応不可",
    20
  );

  // 予算
  if (lead.budget && facility.monthly_fee) {
    const ok = facility.monthly_fee <= lead.budget;
    const close = facility.monthly_fee <= lead.budget * 1.1;
    total += 25;
    earned += ok ? 25 : close ? 12 : 0;
    reasons.push({
      label: ok ? "予算内の月額費用" : close ? "予算をやや超過" : "予算を超過",
      ok,
      weight: 25,
    });
  }

  // 認知症
  add(
    lead.dementia_status === true,
    facility.accepts_dementia,
    facility.accepts_dementia ? "認知症に対応" : "認知症は対応不可",
    15
  );

  // 医療対応
  add(
    lead.medical_needs === true,
    !!facility.medical_support && facility.medical_support.length > 0,
    facility.medical_support && facility.medical_support.length > 0
      ? "医療対応あり"
      : "医療対応なし",
    15
  );

  // 要介護度（双方がマスタ既知の値のときのみ採点。未知/自由入力は採点対象外）
  if (lead.care_level && facility.max_care_level) {
    const li = careIndex(lead.care_level);
    const fi = careIndex(facility.max_care_level);
    if (li >= 0 && fi >= 0) {
      const ok = li <= fi;
      total += 15;
      earned += ok ? 15 : 0;
      reasons.push({
        label: ok ? "要介護度に対応可能" : "要介護度が対応上限超",
        ok,
        weight: 15,
      });
    }
  }

  // エリア
  if (lead.desired_area) {
    const ok = areaMatches(lead.desired_area, facility.area, facility.address);
    total += 15;
    earned += ok ? 15 : 0;
    reasons.push({ label: ok ? "希望エリアに合致" : "希望エリア外", ok, weight: 15 });
  }

  // 空室
  const vacant = facility.rooms?.some((r) => r.status === "vacant") ?? false;
  total += 10;
  earned += vacant ? 10 : 0;
  reasons.push({ label: vacant ? "空室あり" : "空室なし", ok: vacant, weight: 10 });

  const score = total > 0 ? Math.round((earned / total) * 100) : 0;
  // 重要度順（不適合を上に出して注意喚起）
  reasons.sort((a, b) => b.weight - a.weight);

  return { facility, score, reasons };
}

// 相談者に対して全施設をスコアリングし、適合度順に返す
export function matchFacilities(lead: Lead, facilities: Facility[]): FacilityMatch[] {
  return facilities
    .map((f) => scoreFacility(lead, f))
    .sort((a, b) => b.score - a.score);
}

export function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 60) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}
