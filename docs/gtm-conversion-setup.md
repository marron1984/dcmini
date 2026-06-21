# GTM コンバージョン設定 手順書（フォーム／電話／LINE）

リスティング広告のCVを計測するための、Google タグマネージャー(GTM)設定手順。
本サイトの実装に合わせた**そのまま入れられる設定値**を記載する。

## 前提（サイト側の実装状況）

- GTM / GA4 / gtag は `Analytics` コンポーネントで読み込み済み。
  **環境変数で計測IDを設定**する（公開LPはSSGのためDB設定は反映されない）：
  - `NEXT_PUBLIC_GTM_ID`（例 `GTM-XXXXXXX`）
  - `NEXT_PUBLIC_GA_ID`（例 `G-XXXXXXXXXX`）
  - `NEXT_PUBLIC_GOOGLE_ADS_ID` … **GTMで管理するなら未設定でよい**（後述）
- CVのフック（実装済み）：
  - **フォーム相談**: 送信成功で `/thanks` へ遷移（`router.push("/thanks")` のSPA遷移）
  - **電話**: 電話ボタンに `data-cv="phone"`
  - **LINE**: LINEボタンに `data-cv="line"`

> ⚠️ `/thanks` は**SPA遷移**で表示されるため、GTMの「ページビュー」では拾えない。
> 後述の **History Change トリガ**を使う。

---

## STEP 0. アカウント準備

1. **GA4** プロパティ作成 → 測定ID `G-...` を控える。
2. **GTM** コンテナ作成 → `GTM-...` を控える。
3. **Google 広告** で**コンバージョンアクションを3つ**作成（「ウェブサイト」種別、目標=見込み顧客）：
   - 「相談フォーム」「電話相談」「LINE相談」
   - 各アクションの **コンバージョンID（AW-XXXXXXXXX）** と **コンバージョンラベル** を控える。
4. 本番(Vercel)の環境変数に `NEXT_PUBLIC_GTM_ID` と `NEXT_PUBLIC_GA_ID` を設定 → **再デプロイ**。

---

## STEP 1. GTM 変数（ビルトインを有効化）

GTM →「変数」→「設定」で以下のビルトイン変数にチェック：
- Click 系: **Click Element** / **Click URL** / **Click Text**
- Page 系: **Page Path** / **Page URL** / **History の New History Fragment** は不要

---

## STEP 2. トリガを3つ作成

### T-form（フォーム相談）
- タイプ: **履歴の変更（History Change）**
- 発火条件: **Page Path** 等しい `/thanks`
  （`/thanks?...` 等を含めるなら「Page Path」**含む** `/thanks`）

### T-phone（電話クリック）
- タイプ: **クリック - すべての要素**
- 発火条件: **Click Element** が **CSSセレクタに一致** →
  ```
  [data-cv="phone"], [data-cv="phone"] *
  ```
  （ボタン本体／中のアイコン・テキストどちらをクリックしても拾うため `*` を含める）

### T-line（LINEクリック）
- タイプ: **クリック - すべての要素**
- 発火条件: **Click Element** が **CSSセレクタに一致** →
  ```
  [data-cv="line"], [data-cv="line"] *
  ```

---

## STEP 3. タグを作成

### 3-1. Google 広告 コンバージョンリンカー（最初に1つ・必須）
- タイプ: **コンバージョンリンカー**
- トリガ: **All Pages（全ページビュー）**
- → gclid を保存し、後段のコンバージョン計測を正しくする（**広告運用の土台**）。

### 3-2. Google 広告 コンバージョン（CVごとに3つ）
タイプ: **Google 広告のコンバージョン トラッキング**。STEP0で控えたID/ラベルを入れる。

| タグ名 | Conversion ID / Label | トリガ |
|---|---|---|
| AdsCV-相談フォーム | フォーム用のID/ラベル | **T-form** |
| AdsCV-電話 | 電話用のID/ラベル | **T-phone** |
| AdsCV-LINE | LINE用のID/ラベル | **T-line** |

### 3-3.（推奨）GA4 イベント（CVごとに3つ）
タイプ: **GA4 イベント**（GA4設定タグ or 測定IDを指定）。GA4でもCVを可視化する。

| タグ名 | イベント名 | トリガ |
|---|---|---|
| GA4-generate_lead_form | `generate_lead` | T-form |
| GA4-contact_phone | `contact_phone` | T-phone |
| GA4-contact_line | `contact_line` | T-line |

→ GA4管理画面で `generate_lead` 等を**キーイベント(コンバージョン)**に設定。

> **二重計測の回避**: Google 広告は**GTMで管理**するため、
> `NEXT_PUBLIC_GOOGLE_ADS_ID` は**未設定のまま**にする（環境変数で base gtag を入れると重複の元）。
> GA4 は env で読み込み済みでOK。

---

## STEP 4. テスト（公開前に必ず）

1. GTM「プレビュー」でサイトURLを開く。
2. 動作確認：
   - フォーム送信 → `/thanks` 表示で **T-form 発火 → AdsCV-相談フォーム / GA4-generate_lead** が Tags Fired に出る。
   - 電話ボタン押下 → **T-phone** 発火。
   - LINEボタン押下 → **T-line** 発火。
3. **Google タグアシスタント**でコンバージョンタグの発火を確認。
4. Google 広告「ツール → コンバージョン」で**ステータスが「計測中」**になるか確認（反映に時間差あり）。
5. 問題なければ GTM を **公開（Submit）**。

---

## STEP 5. 公開後の確認・運用メモ

- 配信開始後、Google 広告の各コンバージョン列に数字が入るか1〜2日で確認。
- **電話の質**: クリック=発信意図だが通話完了ではない。重要なら「電話番号アセット」由来の
  通話コンバージョン（通話時間しきい値）も併用。
- **CSP**: 現状 `next.config.mjs` のCSPは Report-Only。将来 enforce する際は
  `googletagmanager.com` `google-analytics.com` `googleadservices.com` 等を許可リストに追加。
- **次フェーズ（推奨）**: leadに保存済みの `gclid` を使い、CRMの「見学／入居」を
  **オフラインコンバージョン**としてGoogle 広告へ戻す（入居基準でSmart Bidding最適化）。
  → 管理画面からの gclid付きCSV出力を実装すると手動アップロードで始められる。

---

## 補足：フォームCVをより確実にしたい場合（任意のコード改修）

`/thanks` の History Change トリガで十分だが、より堅牢にするなら
フォーム送信成功時に `dataLayer.push({ event: "lead_form" })` を発火させ、
GTMトリガを「カスタムイベント `lead_form`」にする方法もある（実装は別途対応可）。
