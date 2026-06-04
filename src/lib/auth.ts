import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

// 現在ログイン中の社内ユーザー（users行）を返す。未ログインなら null。
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (data) {
    const appUser = data as AppUser;
    // 無効化されたスタッフは未認可として扱う（セッションが残っていてもアクセス不可）
    if (!appUser.is_active) return null;
    return appUser;
  }

  // users行が取得できない異常系（トリガ未適用 / RLSで読めない等）は
  // フェイルオープンを避け、書き込み権限を持たない最小権限(viewer)にフォールバックする。
  return {
    id: user.id,
    name: user.email?.split("@")[0] ?? "",
    email: user.email ?? "",
    role: "viewer",
    is_active: true,
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// サイト設定（電話番号・LINE URL）を取得。DB未設定時は環境変数 → 既定値の順。
export interface SiteSettings {
  phone_number: string;
  line_url: string;
  business_hours: string;
  ga_id: string;
  gtm_id: string;
  google_ads_id: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const fallback: SiteSettings = {
    phone_number: process.env.NEXT_PUBLIC_PHONE_NUMBER ?? "0120-000-000",
    line_url:
      process.env.NEXT_PUBLIC_LINE_URL ??
      "https://line.me/R/ti/p/@your-line-id",
    business_hours: "9:00〜18:00",
    ga_id: process.env.NEXT_PUBLIC_GA_ID ?? "",
    gtm_id: process.env.NEXT_PUBLIC_GTM_ID ?? "",
    google_ads_id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "",
  };
  try {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    if (!data) return fallback;
    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    return {
      phone_number: map.phone_number || fallback.phone_number,
      line_url: map.line_url || fallback.line_url,
      business_hours: map.business_hours || fallback.business_hours,
      ga_id: map.ga_id ?? fallback.ga_id,
      gtm_id: map.gtm_id ?? fallback.gtm_id,
      google_ads_id: map.google_ads_id ?? fallback.google_ads_id,
    };
  } catch {
    return fallback;
  }
}
