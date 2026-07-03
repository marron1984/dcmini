"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseLooseInt } from "@/lib/utils";

export interface ContactFormResult {
  ok: boolean;
  error?: string;
}

// 簡易レート制限（IPごと固定窓・インスタンス内メモリ）。
// サーバーレスではインスタンス毎に独立するため完全ではないが、
// 単一IPからの連投・フォームスパムの大半を外部依存なしで抑止できる。
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const rateMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    // 窓の開始と同時に古いエントリを軽く掃除（肥大化防止）
    if (rateMap.size > 5000) rateMap.clear();
    rateMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

// 9. 問い合わせフォーム → CRMに新規案件として自動登録
export async function submitContact(
  formData: FormData
): Promise<ContactFormResult> {
  // ハニーポット（フォームスパム対策・32）
  if ((formData.get("company") as string)?.length) {
    return { ok: true }; // botには成功を返して静かに破棄
  }

  // レート制限（同一IPからの連投を抑止）
  const ip =
    headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return {
      ok: false,
      error:
        "送信回数が多すぎます。しばらく待ってから再度お試しいただくか、お電話でご相談ください。",
    };
  }

  const consultantName = (formData.get("consultant_name") as string)?.trim();
  if (!consultantName) {
    return { ok: false, error: "お名前を入力してください。" };
  }
  const phone = (formData.get("consultant_phone") as string)?.trim();
  const email = (formData.get("consultant_email") as string)?.trim();
  if (!phone && !email) {
    return {
      ok: false,
      error: "電話番号またはメールアドレスのいずれかを入力してください。",
    };
  }

  const num = (k: string): number | null =>
    parseLooseInt(formData.get(k) as string);
  const bool = (k: string): boolean | null => {
    const v = formData.get(k) as string;
    if (v === "yes") return true;
    if (v === "no") return false;
    return null;
  };
  // 文字数上限を設けて巨大ペイロード投入を防ぐ（相談内容のみ長め）
  const str = (k: string, max = 200): string | null => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v.slice(0, max) : null;
  };

  const payload = {
    status: "new" as const,
    channel: "web" as const, // 公開フォーム経由はWEB集客として記録
    consultant_name: consultantName.slice(0, 100),
    consultant_name_kana: str("consultant_name_kana"),
    consultant_phone: phone ? phone.slice(0, 30) : null,
    consultant_email: email ? email.slice(0, 254) : null,
    relationship: str("relationship"),
    consultant_area: str("consultant_area"),

    resident_name: str("resident_name"),
    resident_age: num("resident_age"),
    resident_gender: str("resident_gender"),
    resident_current_area: str("resident_current_area"),
    care_level: str("care_level"),
    dementia_status: bool("dementia_status"),
    welfare_status: bool("welfare_status"),
    medical_needs: bool("medical_needs"),
    mental_illness: bool("mental_illness"),
    has_guarantor: bool("has_guarantor"),
    desired_move_in_date: str("desired_move_in_date"),
    budget: num("budget"),
    desired_area: str("desired_area"),
    note: str("note", 2000),

    // 流入情報（9）
    lp_name: str("lp_name"),
    utm_source: str("utm_source"),
    utm_medium: str("utm_medium"),
    utm_campaign: str("utm_campaign"),
    utm_term: str("utm_term"),
    utm_content: str("utm_content"),
    gclid: str("gclid"),
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").insert(payload);
    if (error) {
      console.error("submitContact insert error", error);
      return {
        ok: false,
        error: "送信に失敗しました。お手数ですがお電話でご相談ください。",
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("submitContact error", e);
    return {
      ok: false,
      error:
        "現在フォームを受け付けできません。お手数ですがお電話でご相談ください。",
    };
  }
}
