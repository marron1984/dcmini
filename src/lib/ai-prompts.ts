// =============================================================
// 20. AI機能のプロンプト構築（純粋関数・SDK非依存でテスト可能）
// =============================================================

import type { Lead, LeadActivity } from "@/lib/types";
import { HEARING_SECTIONS, LEAD_STATUS_MAP } from "@/lib/constants";

const yn = (v: boolean | null | undefined): string =>
  v === true ? "あり" : v === false ? "なし" : "不明";

// 相談案件の情報を、AIに渡すための構造化テキストへ整形する。
export function buildLeadContext(lead: Lead, activities: LeadActivity[] = []): string {
  const lines: string[] = [];
  lines.push("# 相談案件情報");
  lines.push(`- ステータス: ${LEAD_STATUS_MAP[lead.status]?.label ?? lead.status}`);
  lines.push(`- 相談者との続柄: ${lead.relationship ?? "不明"}`);

  lines.push("## 入居予定者");
  lines.push(`- 氏名: ${lead.resident_name ?? "不明"}`);
  lines.push(`- 年齢: ${lead.resident_age != null ? `${lead.resident_age}歳` : "不明"}`);
  lines.push(`- 性別: ${lead.resident_gender ?? "不明"}`);
  lines.push(`- 現在の居住地: ${lead.resident_current_area ?? "不明"}`);
  lines.push(`- 要介護度: ${lead.care_level ?? "不明"}`);
  lines.push(`- 認知症: ${yn(lead.dementia_status)}`);
  lines.push(`- 生活保護: ${yn(lead.welfare_status)}`);
  lines.push(`- 医療行為: ${yn(lead.medical_needs)}`);
  lines.push(`- 精神疾患: ${yn(lead.mental_illness)}`);
  lines.push(`- 身元保証人: ${yn(lead.has_guarantor)}`);
  lines.push(`- 希望入居時期: ${lead.desired_move_in_date ?? "不明"}`);
  lines.push(`- 月額予算: ${lead.budget != null ? `${lead.budget.toLocaleString()}円` : "不明"}`);
  lines.push(`- 希望地域: ${lead.desired_area ?? "不明"}`);

  if (lead.note) {
    lines.push("## 相談内容");
    lines.push(lead.note);
  }

  // ヒアリング（記入済みのみ）
  const hearing = (lead.hearing ?? {}) as Record<string, unknown>;
  const hLines: string[] = [];
  for (const section of HEARING_SECTIONS) {
    const items = section.items.filter((it) => {
      const v = hearing[it.key];
      return v !== undefined && v !== null && v !== "";
    });
    if (items.length === 0) continue;
    hLines.push(`### ${section.title}`);
    for (const it of items) {
      const raw = hearing[it.key];
      const v =
        it.type === "bool"
          ? raw === "yes"
            ? "あり"
            : raw === "no"
              ? "なし"
              : String(raw)
          : String(raw);
      hLines.push(`- ${it.label}: ${v}`);
    }
  }
  if (hLines.length) {
    lines.push("## ヒアリング");
    lines.push(...hLines);
  }

  // 対応履歴（ステータス変更を除く新しい順・最大8件）
  const notes = activities
    .filter((a) => a.activity_type !== "status_change")
    .slice(0, 8);
  if (notes.length) {
    lines.push("## 対応履歴（新しい順）");
    for (const a of notes) lines.push(`- ${a.content}`);
  }

  return lines.join("\n");
}

export type AiTaskKey = "summary" | "matching" | "family" | "caremanager";

const BASE_PERSONA =
  "あなたは介護施設・高齢者住宅の入居相談を行う日本の専門相談員です。" +
  "提供された相談情報のみに基づき、事実に忠実に、断定しすぎず丁寧な日本語で出力してください。" +
  "情報が不足している点は推測で補わず「要確認」と明記してください。医療・法律の確定的判断は避けてください。";

export const AI_TASKS: Record<AiTaskKey, { system: string; instruction: string }> = {
  summary: {
    system:
      BASE_PERSONA +
      "出力は社内スタッフ向けの簡潔な要約です。1〜2行の概要に続けて、要点を箇条書き（状況/緊急度/留意点/次のアクション）でまとめてください。",
    instruction: "次の相談情報を社内共有用に要約してください。",
  },
  matching: {
    system:
      BASE_PERSONA +
      "出力は施設選定のための観点整理です。優先すべき施設条件（対応可否・費用・エリア等）と、その理由を箇条書きで提示し、確認が必要な事項も挙げてください。特定施設名は挙げないでください。",
    instruction: "この方に適した施設の選定ポイントと理由を整理してください。",
  },
  family: {
    system:
      BASE_PERSONA +
      "出力はご家族向けの説明文です。専門用語を避け、現在の状況・今後の進め方・安心していただける点を、やさしく丁寧な文章（300〜500字程度）でまとめてください。費用や可否を断定しないでください。",
    instruction: "ご家族向けに、現状と今後の流れをやさしく説明する文面を作成してください。",
  },
  caremanager: {
    system:
      BASE_PERSONA +
      "出力はケアマネジャー（介護支援専門員）向けの申し送り・報告文です。要介護度・医療/認知症の状況・希望条件・支援経過を、専門職同士の簡潔なビジネス文体で整理してください。",
    instruction: "担当ケアマネジャー向けの報告文を作成してください。",
  },
};
