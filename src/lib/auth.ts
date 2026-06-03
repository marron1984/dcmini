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

  if (data) return data as AppUser;

  // users行が未作成のフォールバック（トリガ未適用環境など）
  return {
    id: user.id,
    name: user.email?.split("@")[0] ?? "",
    email: user.email ?? "",
    role: "consultant",
    is_active: true,
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// サイト設定（電話番号・LINE URL）を取得。DB未設定時は環境変数 → 既定値の順。
export async function getSiteSettings(): Promise<{
  phone_number: string;
  line_url: string;
}> {
  const fallback = {
    phone_number: process.env.NEXT_PUBLIC_PHONE_NUMBER ?? "0120-000-000",
    line_url:
      process.env.NEXT_PUBLIC_LINE_URL ??
      "https://line.me/R/ti/p/@your-line-id",
  };
  try {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    if (!data) return fallback;
    const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
    return {
      phone_number: map.phone_number || fallback.phone_number,
      line_url: map.line_url || fallback.line_url,
    };
  } catch {
    return fallback;
  }
}
