# CLAUDE.md

このファイルは、本リポジトリで作業する Claude / 開発者向けのガイドです。

## プロジェクト概要

**DCかいご相談ダイヤル** — 介護施設・高齢者住宅への入居相談をWEBで獲得し、
問い合わせ→ヒアリング→施設提案→見学→申込→入居までを一元管理する入居獲得システム。

- 公開サイト（集客LP・相談フォーム・コラム・空室情報）
- 入居相談CRM（案件管理・ヒアリング・見学・施設マッチング）
- 管理ダッシュボード（KPI・広告・紹介元・LP/記事CMS・ユーザー/設定/ログ）

## 技術スタック

Next.js 14 (App Router) / TypeScript / Tailwind CSS / Supabase(PostgreSQL・Auth) /
Vitest / GitHub Actions。デプロイは Vercel 想定。

## コマンド

```bash
npm run dev        # 開発サーバー
npm run build      # 本番ビルド
npm run start      # 本番起動
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest（src/**/*.test.ts）
```

変更後は基本的に **typecheck / lint / test / build** の4ゲートを通すこと。
CI（`.github/workflows/ci.yml`）でも push/PR ごとに実行される。

## ディレクトリ構成

```
src/
  app/
    (public)/      公開サイト（layout=ヘッダー/フッター, トップ, soudan/[slug], lp/[slug],
                   column, vacancies, about, privacy, thanks）。actions.ts=フォーム送信
    admin/
      login/                 ログイン
      (dashboard)/           認証必須の管理画面（layout=サイドバー+通知ベル+ガード）
      actions.ts             管理操作の Server Actions（全て認可チェック付き）
      leads/export/route.ts  CSVエクスポート（admin/consultantのみ）
    layout.tsx     ルート（metadata, JSON-LD, Analytics）
    sitemap.ts / robots.ts / global-error.tsx / not-found.tsx
  components/
    ui/            汎用UI（button, card, input(Field含む), badge, tabs, spinner）
    public/        公開用（SiteHeader/Footer, ContactForm, FacilityCard, Faq）
    admin/         管理用（Sidebar, 各種フォーム, ForbiddenCard 等）
  lib/
    supabase/      client(ブラウザ) / server(SSR) / admin(service_role) / middleware
    data/          public.ts(公開取得) / admin.ts(管理取得・集計)
    auth.ts        getCurrentUser / getSiteSettings
    permissions.ts セクション別アクセス制御（canAccess）
    guard.ts       checkSectionAccess（ページ先頭ガード）
    matching.ts    施設マッチング（適合度スコア・純粋関数）
    seo.ts         構造化データ(JSON-LD)・URLビルダー（純粋関数）
    ai.ts / ai-prompts.ts  AI連携（サーバー専用）/ プロンプト構築（純粋）
    csv.ts / utils.ts / audit.ts / constants.ts / types.ts
supabase/migrations/  0001_init / 0002_rls / 0003_articles_audit / 0004_settings_keys / 0005_status_changed_at /
                      0006_channels_residents（leads.channel=流入チャネル / residents=入居者台帳）
supabase/seed.sql     デモデータ
```

## 重要な設計・規約

- **Supabaseクライアントの使い分け**
  - `lib/supabase/server.ts`：通常のサーバー処理。RLSが効く（ユーザーのセッション）。
  - `lib/supabase/admin.ts`：service_role。RLSバイパス。**公開フォームのlead登録のみ**で使用。クライアントへ絶対渡さない。
- **認可は二層**：アプリ層（`assertCanEdit`/`assertCanManageAds`/`assertAdmin` in admin/actions.ts、ページの `checkSectionAccess`）＋ DBの RLS（`supabase/migrations/0002_rls.sql`）。両方を一致させること。
- **`getCurrentUser()`** は無効ユーザー(is_active=false)を `null` 扱い、users行欠落時は最小権限(viewer)にフォールバック（フェイルオープン回避）。
- **ラベル/選択肢マスタ**は `lib/constants.ts` に集約（enum値↔日本語）。DBは enum、表示は MAP 経由。
- **数値入力**は `parseLooseInt`（全角/カンマ/単位を許容）。
- **集計の月次判定**は `status_changed_at`（ステータス遷移時刻）を使用。`updated_at` は使わない。
- **レンダリング**：公開ページは `getSiteSettings()`（cookie利用）で多くが動的。`generateStaticParams` を持つ soudan/lp/column はSSGで、計測タグは **環境変数優先**で解決される（DB設定はSSGページに反映されないため、本番は GA/GTM/広告ID を環境変数で設定）。
- **データ取得は失敗時フォールバック**（`safe()`）。Supabase未設定でもUIは表示される。

## 環境変数（`.env.example` 参照）

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`（OGP/sitemap/JSON-LD）
- `NEXT_PUBLIC_PHONE_NUMBER` / `NEXT_PUBLIC_LINE_URL`（DB site_settings が優先）
- `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `ANTHROPIC_API_KEY`（AI機能。サーバー専用・未設定なら自動無効化）

## セットアップ

1. `npm install`
2. `.env.local` を作成（`.env.example` をコピー）
3. Supabase で `supabase/migrations/*.sql` を順に実行（任意で `seed.sql`）
4. Authでスタッフ作成 → `users.role` を必要に応じ `admin` 等に更新
5. `npm run dev`

## テスト方針

- 純粋ロジック（csv/utils/matching）と重要パス（submitContact）を Vitest で単体/結合テスト。
- E2E(Playwright)はブラウザDLが必要なため未導入（CI前提で将来追加可）。
- DBに依存する集計はモック or 純粋関数抽出でテスト可能にする方針。

## 既知の検討事項

- CSPは Report-Only で導入済み（`next.config.mjs`）。安定後に強制へ。
- 第3フェーズのうち **AI（Anthropic Claude）連携は実装済み**（`src/lib/ai.ts` / `src/lib/ai-prompts.ts` /
  `src/app/admin/ai-actions.ts`、案件詳細の「AIアシスト」タブ）。`ANTHROPIC_API_KEY` 設定で有効化。
- 残るLINE/Google広告API/LINE WORKSは外部APIキー・アカウントが前提で未実装。
