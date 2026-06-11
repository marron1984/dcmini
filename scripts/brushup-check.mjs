#!/usr/bin/env node
/* eslint-disable */
// =============================================================
// 自動ブラッシュアップ: 軽量な健全性チェック（外部依存なし）
// CI(定期実行)とローカルの両方で使える。問題は警告として一覧化し、
// しきい値超過時のみ非ゼロ終了する（既定では警告のみで落とさない）。
// 使い方: node scripts/brushup-check.mjs [--strict]
// =============================================================
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const strict = process.argv.includes("--strict");

const findings = [];
const add = (level, msg) => findings.push({ level, msg });

// src 配下の .ts/.tsx を再帰収集
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      out.push(...walk(p));
    } else if ([".ts", ".tsx"].includes(extname(name))) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SRC);
const rel = (p) => p.replace(ROOT + "/", "");

// 1) TODO / FIXME / @ts-ignore / 生console.log の検出
let todo = 0,
  tsIgnore = 0,
  rawConsole = 0;
for (const f of files) {
  const text = readFileSync(f, "utf8");
  text.split("\n").forEach((line, i) => {
    if (/\b(TODO|FIXME|HACK)\b/.test(line)) {
      todo++;
      add("info", `TODO/FIXME: ${rel(f)}:${i + 1}`);
    }
    if (/@ts-ignore/.test(line)) {
      tsIgnore++;
      add("warn", `@ts-ignore（@ts-expect-error推奨）: ${rel(f)}:${i + 1}`);
    }
    // テスト以外の console.log/info/debug（error/warnは許容）
    if (
      /console\.(log|info|debug)\(/.test(line) &&
      !f.includes("__tests__")
    ) {
      rawConsole++;
      add("warn", `console.${RegExp.$1}: ${rel(f)}:${i + 1}`);
    }
  });
}

// 2) 存在しない可能性のある Tailwind 任意クラス（h-13 等、定義外の素朴な数値）
//    Tailwindの標準スケールに無い h-13/w-13/h-15 などのタイプミスを検知
const SUSPECT_CLASS = /\b(?:h|w)-(?:13|15|17|18|19|21|22|23)\b/g;
for (const f of files) {
  const text = readFileSync(f, "utf8");
  const m = text.match(SUSPECT_CLASS);
  if (m) add("warn", `存在しない可能性のあるTailwindクラス ${[...new Set(m)].join(",")}: ${rel(f)}`);
}

// 3) 依存の陳腐化（package-lock の主要パッケージが極端に古くないか軽く確認）
//    ここでは package.json の依存数のみ記録（重い監査はCIの別ステップで）
try {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length;
  add("info", `依存パッケージ数: ${deps}`);
} catch {}

// 4) 公開ページに metadata（title/description）があるか軽くチェック
//    ルートグループ直下の page.tsx（= "/"）は app/layout.tsx の既定metadataで
//    カバーされるため除外。generateMetadata は async 有無どちらも許容する。
const pageFiles = files.filter(
  (f) =>
    f.endsWith("page.tsx") &&
    f.includes("(public)") &&
    !f.endsWith("(public)/page.tsx"),
);
for (const f of pageFiles) {
  const text = readFileSync(f, "utf8");
  const hasMeta = /export const metadata|export (async )?function generateMetadata/.test(text);
  if (!hasMeta) add("warn", `公開ページにmetadataが無い: ${rel(f)}`);
}

// ---- 出力 ----
const warns = findings.filter((f) => f.level === "warn");
const infos = findings.filter((f) => f.level === "info");

const lines = [];
lines.push("# 🤖 自動ブラッシュアップ チェック結果\n");
lines.push(`- 検査ファイル数: **${files.length}**`);
lines.push(`- 警告: **${warns.length}** / 情報: ${infos.length}`);
lines.push(`- TODO/FIXME: ${todo} / @ts-ignore: ${tsIgnore} / console.log類: ${rawConsole}\n`);

if (warns.length) {
  lines.push("## ⚠️ 警告（要確認）");
  for (const w of warns) lines.push(`- ${w.msg}`);
  lines.push("");
}
if (infos.length) {
  lines.push("<details><summary>ℹ️ 情報</summary>\n");
  for (const i of infos) lines.push(`- ${i.msg}`);
  lines.push("\n</details>");
}

const report = lines.join("\n");
console.log(report);

// GitHub Actions のジョブサマリへ出力
if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + "\n");
  } catch {}
}

// strict時のみ、警告があれば非ゼロ終了
if (strict && warns.length > 0) {
  console.error(`\n✗ strictモード: ${warns.length}件の警告で失敗扱い`);
  process.exit(1);
}
