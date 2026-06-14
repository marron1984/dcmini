# 契約システム連携仕様（電子契約 → CRM Webhook）

自社サインシステム（電子契約）の署名状況の変化を、この CRM の契約台帳へ
**片方向で自動同期**するための仕様。契約システム側がこの仕様に沿って
HTTP POST を送るだけで、`contracts` 行のステータス・原本リンク・締結日が更新される。

## エンドポイント

```
POST {CRM_BASE_URL}/api/contracts/webhook
Content-Type: application/json
X-Signature: sha256=<HMAC-SHA256(body, CONTRACTS_WEBHOOK_SECRET) のhex>
```

- 認証はセッション不要。**HMAC-SHA256 署名**で検証する。
- CRM 側の環境変数 `CONTRACTS_WEBHOOK_SECRET` と、契約システム側の共有シークレットを一致させる。
- **fail-closed**: CRM 側でシークレット未設定なら 503（誤って素通りさせない）。

## ペイロード

```jsonc
{
  "event": "contract.signed",          // 必須: 下記イベントのいずれか
  "external_contract_id": "sign_abc123", // 契約システム側の契約ID
  "crm_contract_id": "uuid",            // 任意: CRM側 contracts.id（あれば優先照合）
  "document_url": "https://.../signed.pdf", // 締結済原本へのリンク（signed時に推奨）
  "signed_at": "2026-06-14"             // 任意: 締結日（省略時は受信日）
}
```

- 対象契約の特定は **`crm_contract_id` を優先**、無ければ `external_contract_id` で照合。
- どちらか一方は必須。

## イベント → 反映ステータス

| event | 反映 status | 付随更新 |
|---|---|---|
| `contract.sent` | 送信済 (sent) | — |
| `contract.signed` | 締結済 (signed) | `document_url`・`signed_at` |
| `contract.cancelled` | 解約 (cancelled) | — |
| `contract.expired` | 失効 (expired) | — |

同じイベントを再送しても結果は変わらない（**冪等**）。

## レスポンス

| ステータス | 意味 |
|---|---|
| 200 | 反映成功 `{ ok: true, id, status }` |
| 401 | 署名不正 |
| 404 | 対象契約が見つからない |
| 422 | event 未対応 / 識別子なし |
| 503 | Webhook 無効（CRM側シークレット未設定） |

契約システム側は **2xx 以外なら指数バックオフで再送**する実装を推奨（CRM側は冪等）。

## 送信側サンプル（Node.js）

```js
import crypto from "node:crypto";

async function notifyCrm(event, body) {
  const payload = JSON.stringify({ event, ...body });
  const signature = crypto
    .createHmac("sha256", process.env.CONTRACTS_WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("hex");

  const res = await fetch(`${CRM_BASE_URL}/api/contracts/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": `sha256=${signature}` },
    body: payload,
  });
  if (!res.ok) throw new Error(`webhook failed: ${res.status}`);
}

// 署名完了時
await notifyCrm("contract.signed", {
  external_contract_id: "sign_abc123",
  document_url: "https://.../signed.pdf",
  signed_at: "2026-06-14",
});
```

## 運用フロー

1. CRM の入居者詳細 →「契約管理」で契約を登録し、`契約ID（電子契約側）` を入れておく
   （または契約システムが採番した ID を後から webhook の `external_contract_id` で渡す）。
2. 契約システムで署名が進むたびに上記 webhook を送る。
3. CRM 側でステータス・原本リンクが自動更新され、満了30日前から更新通知が出る。

## フェーズ2（双方向・将来）

CRM から「署名依頼を作成」するには、契約システム側に
`POST /api/sign-requests`（宛先・雛形・差し込みデータ → `external_contract_id` を返す）
のような API を用意する。CRM 側は作成時に受け取った ID を `external_contract_id` に保存し、
以降は本 webhook でステータス同期する。
