import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 全角数字や「円」「,」などの混在を許容して整数を取り出す。
// （例:「１３００」「1,300円」→ 1300 / 空・数字なし → null）
export function parseLooseInt(value: string | null | undefined): number | null {
  if (value == null) return null;
  const half = value.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
  const digits = half.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isNaN(n) ? null : n;
}


export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatYen(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return `¥${value.toLocaleString("ja-JP")}`;
}

// ---- 日本時間(JST)基準の日付境界 ----
// サーバーはUTCで動くため、素朴な new Date() ベースの日付演算は
// 日本の業務日と最大9時間ズレる。集計・通知の判定はこちらを使う。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// JSTでの「今日」の日付文字列（YYYY-MM-DD）
export function jstToday(now: Date = new Date()): string {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

// JSTでの「今月1日 0:00」に相当するUTC時刻
export function jstStartOfMonth(now: Date = new Date()): Date {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1) - JST_OFFSET_MS
  );
}

export function relativeTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}ヶ月前`;
  return `${Math.floor(months / 12)}年前`;
}
