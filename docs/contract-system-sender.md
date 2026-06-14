# 契約システム（raw）側の送信実装（Next.js App Router）

dcmini の受け口 `POST /api/contracts/webhook`（`docs/contract-webhook.md`）へ
締結イベントを送る、コピペ用の実装。`raw` リポジトリに以下を追加する。

## 1. 環境変数（raw 側 `.env`）

```bash
# dcmini の Webhook URL
CRM_WEBHOOK_URL=https://<dcmini-domain>/api/contracts/webhook
# dcmini の CONTRACTS_WEBHOOK_SECRET と「同じ値」
CONTRACTS_WEBHOOK_SECRET=<dcminiと同一のシークレット>
```

## 2. 送信ユーティリティ `lib/crm-sync.ts`

```ts
import crypto from "node:crypto";

export type CrmContractEvent =
  | "contract.sent"
  | "contract.signed"
  | "contract.cancelled"
  | "contract.expired";

export interface CrmContractPayload {
  event: CrmContractEvent;
  external_contract_id: string; // raw 側の契約ID（必須）
  crm_contract_id?: string;     // 分かっていれば dcmini の contracts.id（優先照合）
  document_url?: string;        // 締結済原本リンク（signed時に推奨）
  signed_at?: string;           // YYYY-MM-DD（省略時はdcmini側で受信日）
}

// 受け口と同じ方式: HMAC-SHA256(body, secret) の hex
export function signBody(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

// dcmini へ締結イベントを通知。5xx/ネットワーク/429 は指数バックオフで再送（受け口は冪等）。
export async function notifyCrm(
  payload: CrmContractPayload,
  opts: { retries?: number } = {}
): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const url = process.env.CRM_WEBHOOK_URL;
  const secret = process.env.CONTRACTS_WEBHOOK_SECRET;
  if (!url || !secret) return { ok: false, status: 0 }; // 未設定なら無効（fail-safe）

  const body = JSON.stringify(payload);
  const signature = signBody(body, secret);
  const retries = opts.retries ?? 4;

  let lastStatus = 0;
  let lastBody: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": `sha256=${signature}`,
        },
        body,
      });
      lastStatus = res.status;
      lastBody = await res.json().catch(() => undefined);
      if (res.ok) return { ok: true, status: res.status, body: lastBody };
      // 4xx は再送しても無駄（署名不正/未対応event/識別子なし）。ただし404は
      // 「dcmini側に契約行が未登録」の可能性があるので再送対象に含める。
      if (res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 404) {
        return { ok: false, status: res.status, body: lastBody };
      }
    } catch {
      // ネットワークエラーは再送対象
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000)); // 1s,2s,4s,8s
    }
  }
  return { ok: false, status: lastStatus, body: lastBody };
}
```

## 3. 呼び出し例（署名フローの各段階で）

```ts
import { notifyCrm } from "@/lib/crm-sync";

// 署名依頼を送ったとき
await notifyCrm({ event: "contract.sent", external_contract_id: contract.id });

// 署名が完了したとき（原本URLを渡す）
await notifyCrm({
  event: "contract.signed",
  external_contract_id: contract.id,
  document_url: signedPdfUrl,
  signed_at: new Date().toISOString().slice(0, 10),
});

// 取り消し / 失効
await notifyCrm({ event: "contract.cancelled", external_contract_id: contract.id });
await notifyCrm({ event: "contract.expired", external_contract_id: contract.id });
```

> 送信は「ベストエフォート＋再送」。署名処理自体は止めず、`notifyCrm` の結果は
> ログに残す程度でよい（受け口が冪等なので二重送信も安全）。

## 4. テスト `lib/__tests__/crm-sync.test.ts`（vitest）

```ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { signBody } from "@/lib/crm-sync";

describe("signBody", () => {
  it("HMAC-SHA256(hex) を返し、受け口と一致する", () => {
    const body = JSON.stringify({ event: "contract.signed", external_contract_id: "x" });
    const sig = signBody(body, "secret");
    const expected = crypto.createHmac("sha256", "secret").update(body).digest("hex");
    expect(sig).toBe(expected);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });
});
```

## 5. ID のひも付け運用

- いちばん簡単なのは **`external_contract_id`（raw 側の契約ID）で照合**する運用。
  dcmini の契約台帳で「契約ID（電子契約側）」にこの値を入れておけば、以後の
  イベントは自動で同じ契約に反映される。
- dcmini 側の `contracts.id` を raw が保持できるなら `crm_contract_id` を付けると
  さらに確実（優先照合される）。フェーズ2でCRMから署名依頼を作る場合は、
  作成時に dcmini が採番した ID を raw に渡して保持しておくとよい。
