import { createClient } from "@/lib/supabase/server";
import type { Facility } from "@/lib/types";

// 公開トップ・空室公開ページ用に、公開フラグの立った施設を取得。
// Supabase未設定時は空配列でフォールバック（ビルドを通すため）。
export async function getPublishedFacilities(): Promise<Facility[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("facilities")
      .select("*, rooms(*)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) return [];
    return (data as Facility[]) ?? [];
  } catch {
    return [];
  }
}
