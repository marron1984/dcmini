"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseLooseInt } from "@/lib/utils";

export interface ContactFormResult {
  ok: boolean;
  error?: string;
}

// 9. 問い合わせフォーム → CRMに新規案件として自動登録
export async function submitContact(
  formData: FormData
): Promise<ContactFormResult> {
  // ハニーポット（フォームスパム対策・32）
  if ((formData.get("company") as string)?.length) {
    return { ok: true }; // botには成功を返して静かに破棄
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
    consultant_name: consultantName.slice(0, 100),
    consultant_name_kana: str("consultant_name_kana"),
    consultant_phone: phone || null,
    consultant_email: email || null,
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
