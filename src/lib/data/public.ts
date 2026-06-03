import { createClient } from "@/lib/supabase/server";
import type { Facility, LpPage, Article } from "@/lib/types";

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

// 公開中のLPをslugで取得（公開LPページ用）
export async function getPublishedLp(slug: string): Promise<LpPage | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lp_pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (error) return null;
    return (data as LpPage) ?? null;
  } catch {
    return null;
  }
}

// 静的生成用に公開中LPのslug一覧を取得
export async function getPublishedLpSlugs(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("lp_pages")
      .select("slug")
      .eq("status", "published");
    return (data ?? []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}

// 公開中の記事一覧（コラム）
export async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(60);
    return (data as Article[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (error) return null;
    return (data as Article) ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedArticleSlugs(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("slug")
      .eq("status", "published");
    return (data ?? []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}
