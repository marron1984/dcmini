#!/usr/bin/env node
/* eslint-disable */
// =============================================================
// 契約Webhook 受け口の疎通テスト（ローカルから本番/プレビューへ送る）
//  HMAC-SHA256 署名を付けて POST し、ステータスとレスポンスを表示する。
//
// 使い方:
//   CONTRACTS_WEBHOOK_SECRET=xxxx node scripts/test-contract-webhook.mjs \
//     --url https://dcmini-jstb.vercel.app/api/contracts/webhook \
//     --event contract.signed --id TEST-001 --doc https://example.com/signed.pdf
//
// 主なオプション:
//   --url   受け口URL（既定: 環境変数 CRM_WEBHOOK_URL）
//   --event contract.sent|signed|cancelled|expired（既定: contract.signed）
//   --id    external_contract_id（電子契約側の契約ID）
//   --crm   crm_contract_id（dcmini の contracts.id。あれば優先照合）
//   --doc   document_url（原本リンク。signed時に付与）
//   --signed-at  YYYY-MM-DD（締結日）
//   --no-sig     署名を付けずに送る（401になることの確認用）
// =============================================================
import crypto from "node:crypto";

const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const has = (flag) => args.includes(flag);

const url = get("--url", process.env.CRM_WEBHOOK_URL);
const secret = process.env.CONTRACTS_WEBHOOK_SECRET;
const event = get("--event", "contract.signed");
const externalId = get("--id", "TEST-001");
const crmId = get("--crm", null);
const doc = get("--doc", null);
const signedAt = get("--signed-at", null);

if (!url) {
  console.error("✗ --url または環境変数 CRM_WEBHOOK_URL が必要です");
  process.exit(2);
}
if (!secret && !has("--no-sig")) {
  console.error("✗ 環境変数 CONTRACTS_WEBHOOK_SECRET が必要です（--no-sig 指定時は不要）");
  process.exit(2);
}

const payload = { event, external_contract_id: externalId };
if (crmId) payload.crm_contract_id = crmId;
if (doc) payload.document_url = doc;
if (signedAt) payload.signed_at = signedAt;

const body = JSON.stringify(payload);
const headers = { "Content-Type": "application/json" };
if (!has("--no-sig")) {
  const sig = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
  headers["X-Signature"] = `sha256=${sig}`;
}

console.log("→ POST", url);
console.log("  payload:", body);
console.log("  signed :", !has("--no-sig"));

const res = await fetch(url, { method: "POST", headers, body });
const text = await res.text();
console.log(`\n← HTTP ${res.status}`);
console.log(text);

// 期待値の早見表
const hint = {
  401: "署名不正（--no-sig や シークレット不一致）",
  503: "受け口が無効（本番に CONTRACTS_WEBHOOK_SECRET が未設定）",
  404: "署名はOK。ただし該当契約が無い（external_contract_id を台帳に登録して再実行）",
  422: "event未対応 or 識別子なし",
  200: "成功。契約台帳が更新されました 🎉",
}[res.status];
if (hint) console.log(`\n※ ${hint}`);
process.exit(res.ok ? 0 : 1);
