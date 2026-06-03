# DCかいご相談ダイヤル

介護施設・高齢者住宅・サポート付き住宅への入居相談をWEBで獲得し、
問い合わせ → ヒアリング → 施設提案 → 見学 → 申込 → 契約 → 入居までを
一元管理する入居獲得システムです。

本リポジトリは要件定義書の **MVP（第1フェーズ）** に加え、
**第2フェーズの一部（紹介元管理・広告レポート管理・空室公開ページ・CSV出力・担当者別/紹介元別KPI）** を実装したものです。

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| フロントエンド | Next.js 14 (App Router) / TypeScript / Tailwind CSS |
| UI | 自作 shadcn/ui 風コンポーネント (`src/components/ui`) |
| バックエンド | Supabase (PostgreSQL / Auth / Storage) |
| デプロイ | Vercel 想定 |
| 計測 | Google Analytics / GTM / Google広告タグ（環境変数で設定） |

## 主な機能（MVP範囲）

### 公開サイト
- トップページ（ファーストビュー / 悩み別導線 / 特徴 / 相談内容 / 流れ / 施設一覧 / FAQ / 相談フォーム / LINE導線）
- 悩み別の個別LP（`/soudan/[slug]`、8カテゴリ）
- 問い合わせフォーム → Supabase `leads` に新規案件として自動登録（UTM・gclidの流入情報も保持）
- 完了ページ（`/thanks`）
- 電話CTA / LINE CTA（電話番号・LINE URLは管理設定 `site_settings` から変更可能）
- Google広告タグ設置エリア（`src/components/Analytics.tsx`）

### 管理画面（`/admin`、ログイン必須）
- ログイン（Supabase Auth）
- ダッシュボード（KPIサマリー・ステータス別件数・要対応案件・直近見学）
- 案件管理（テーブル / カンバン表示、氏名・ステータス・担当・要介護度・生保・認知症などで絞り込み）
- 案件詳細（相談者/入居予定者情報、ヒアリング、対応履歴、施設提案、見学、失注登録、ステータス・担当変更、流入元情報）
- 施設管理（施設情報の登録・編集、公開フラグ）
- 部屋・空室管理（部屋登録、ステータスを即時反映）
- 見学管理（見学の登録・一覧）

### 第2フェーズ（実装済み）
- 紹介元管理（紹介元CRUD、紹介件数・見学件数・成約件数・成約率の集計、案件への紐づけ）
- 広告管理（Google広告レポートの手入力、CTR・CPC・CPA・入居単価を自動計算）
- ダッシュボード拡張（担当者別成績・紹介元ランキング）
- 案件一覧のCSV出力（絞り込み条件を引き継ぎ、Excel向けBOM付き）
- 空室・施設情報の公開ページ（`/vacancies`）
- LP管理（LP CMS）：管理画面でLPを作成・編集（タイトル/キャッチコピー/対象者/悩み/本文/FAQ/公開状態）し、
  `/lp/[slug]` で動的に公開。問い合わせフォーム・電話/LINE CTA付き。
- 通知機能（要件22）：新規問い合わせ・初回連絡未対応・見学前日・次回アクション期限・長期放置・再アプローチ予定を
  集計し、管理画面のベル（`/admin/notifications`）に表示。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` を `.env.local` にコピーして値を設定します。

```bash
cp .env.example .env.local
```

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー専用。公開フォームからの案件登録に使用（RLSをバイパス） |
| `NEXT_PUBLIC_PHONE_NUMBER` / `NEXT_PUBLIC_LINE_URL` | 電話・LINEの初期値（DB `site_settings` があればそちらが優先） |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GOOGLE_ADS_ID` | 計測タグ（任意） |

### 3. データベース

Supabase のプロジェクトで以下のSQLを順に実行します（SQL Editor もしくは Supabase CLI）。

```
supabase/migrations/0001_init.sql   -- テーブル・列挙型・トリガ
supabase/migrations/0002_rls.sql    -- RLSポリシー・新規ユーザー自動作成トリガ
supabase/seed.sql                   -- デモ用施設データ（任意）
```

スタッフアカウントは Supabase Auth でユーザーを作成すると、トリガにより
`users` テーブルへ自動で行が作成されます（初期ロールは `consultant`）。
管理者にする場合は `users.role` を `admin` に更新してください。

```sql
update users set role = 'admin' where email = 'you@example.com';
```

### 4. 起動

```bash
npm run dev      # 開発
npm run build    # 本番ビルド
npm run start    # 本番起動
```

> Supabase 未設定でもUI確認用にビルド・起動は可能です（データ取得は空にフォールバック）。

## ディレクトリ構成

```
src/
  app/
    (public)/            公開サイト（レイアウト・トップ・LP・完了・フォームのServer Action）
    admin/
      login/             ログイン
      (dashboard)/       認証必須の管理画面（サイドバー付きレイアウト）
      actions.ts         管理操作のServer Actions
    robots.ts / sitemap.ts
  components/
    ui/                  汎用UI（button, card, input, badge, tabs ...）
    public/              公開サイト用
    admin/               管理画面用
  lib/
    supabase/            client / server / admin / middleware
    data/                public.ts / admin.ts（データ取得層）
    constants.ts         ラベル・選択肢マスタ（enum対応）
    types.ts             ドメイン型
    auth.ts / utils.ts
supabase/
  migrations/            DBスキーマ
  seed.sql
```

## 設計上の方針（将来拡張のために）

- **データ構造**：要件定義書のテーブル設計に準拠。ヒアリング項目は柔軟性のため
  `leads.hearing` を `jsonb` で保持。ステータス・種別は PostgreSQL の `enum` で管理し、
  日本語ラベルは `src/lib/constants.ts` に一元化。
- **権限**：`users.role`（admin / consultant / viewer / ad_manager）と RLS で制御。
- **個人情報保護**：公開フォームの案件登録はサーバーの service_role 経由のみ。
  一般ユーザー（anon）に `leads` への直接アクセスを与えない。管理画面は `noindex` かつ
  `robots.txt` で除外。
- **第2・第3フェーズ**（LP CMS化・広告レポート・紹介元管理・LINE/AI連携など）に向けて、
  `referrers` / `ad_reports` / `lp_pages` テーブルとコンポーネント分割を先行して用意。

## 今後の拡張（要件 第2/第3フェーズ）

- LP複数作成機能（`lp_pages` のCMS化）/ SEO記事CMS
- 広告レポート管理（`ad_reports`）/ 担当者別・紹介元別KPI / CSV出力
- LINE連携 / AIヒアリング・施設マッチング / Google広告API / LINE WORKS通知
