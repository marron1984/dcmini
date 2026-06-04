import { getCurrentUser } from "@/lib/auth";
import { canAccess, type Section } from "@/lib/permissions";
import type { AppUser } from "@/lib/types";

// ページ先頭で呼び、セクションへのアクセス可否と現在ユーザーを返す。
// data取得の前に呼べば、権限が無いユーザーに対する無駄なクエリも避けられる。
export async function checkSectionAccess(
  section: Section
): Promise<{ ok: boolean; user: AppUser | null }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, user: null };
  return { ok: canAccess(user.role, section), user };
}
