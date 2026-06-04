import type { UserRole } from "@/lib/types";

// =============================================================
// 21. 権限管理: 画面セクションごとの閲覧可能ロール定義
// 管理者=全機能 / 相談員=案件業務 / 閲覧者=案件閲覧のみ /
// 広告担当=広告・LP・記事・KPI（案件の個人情報は閲覧不可）
// =============================================================

export type Section =
  | "dashboard"
  | "leads"
  | "facilities"
  | "rooms"
  | "tours"
  | "referrers"
  | "ads"
  | "lp"
  | "articles"
  | "notifications"
  | "users"
  | "settings"
  | "logs";

const ACCESS: Record<Section, UserRole[]> = {
  dashboard: ["admin", "consultant", "viewer", "ad_manager"],
  leads: ["admin", "consultant", "viewer"],
  facilities: ["admin", "consultant", "viewer"],
  rooms: ["admin", "consultant", "viewer"],
  tours: ["admin", "consultant", "viewer"],
  referrers: ["admin", "consultant"],
  ads: ["admin", "ad_manager"],
  lp: ["admin", "ad_manager"],
  articles: ["admin", "ad_manager"],
  notifications: ["admin", "consultant", "viewer"],
  users: ["admin"],
  settings: ["admin"],
  logs: ["admin"],
};

export function canAccess(role: UserRole, section: Section): boolean {
  return ACCESS[section].includes(role);
}
