// =============================================================
// CSV生成ユーティリティ（テスト可能なよう純粋関数として分離）
// =============================================================

// 1セルをCSV用にエスケープ（", , 改行 を含む場合はクォート）
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// boolean → 日本語の あり/なし/空
export function ynLabel(v: boolean | null | undefined): string {
  if (v === true) return "あり";
  if (v === false) return "なし";
  return "";
}

// ヘッダ＋行データからCSV文字列を生成（Excel向けBOM付き）
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  // ﻿ = Excelで文字化けを防ぐBOM
  return "﻿" + lines.join("\r\n");
}
