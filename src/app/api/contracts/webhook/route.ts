import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================
// 電子契約（自社サインシステム）からの締結イベント受け口（片方向同期）
//  - 契約システムが署名状況の変化を JSON で POST してくる。
//  - HMAC-SHA256 署名で検証（共有シークレット必須・未設定なら一切受け付けない）。
//  - 一致した contracts 行のステータス・原本リンク・締結日を更新する（冪等）。
// 認証セッションを持たない外部呼び出しのため、RLSをバイパスする admin client を使う。
// =============================================================

export const runtime = "nodejs";

// イベント → 反映するステータス
const EVENT_STATUS: Record<string, "sent" | "signed" | "cancelled" | "expired"> = {
  "contract.sent": "sent",
  "contract.signed": "signed",
  "contract.cancelled": "cancelled",
  "contract.expired": "expired",
};

// タイミング安全な署名比較
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // 受理形式: "sha256=<hex>" もしくは "<hex>"
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CONTRACTS_WEBHOOK_SECRET;
  // fail-closed: シークレット未設定なら機能を無効化（誤って素通りさせない）
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook disabled" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: {
    event?: string;
    external_contract_id?: string;
    crm_contract_id?: string;
    document_url?: string;
    signed_at?: string;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const nextStatus = EVENT_STATUS[event];
  if (!nextStatus) {
    return NextResponse.json({ ok: false, error: `unsupported event: ${event}` }, { status: 422 });
  }
  if (!payload.crm_contract_id && !payload.external_contract_id) {
    return NextResponse.json(
      { ok: false, error: "crm_contract_id or external_contract_id is required" },
      { status: 422 }
    );
  }

  // crm_contract_id は UUID 形式のみ受理（不正値でのDBエラー→500を防ぐ）
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (payload.crm_contract_id && !UUID_RE.test(payload.crm_contract_id)) {
    return NextResponse.json({ ok: false, error: "invalid crm_contract_id" }, { status: 422 });
  }

  const supabase = createAdminClient();

  // 対象契約を特定（CRM側IDを優先、無ければ電子契約側ID）
  const query = supabase.from("contracts").select("id, resident_id, external_contract_id, status");
  const { data: found, error: findErr } = payload.crm_contract_id
    ? await query.eq("id", payload.crm_contract_id).maybeSingle()
    : await query.eq("external_contract_id", payload.external_contract_id!).maybeSingle();

  if (findErr) {
    console.error("contracts webhook find error", findErr);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
  if (!found) {
    return NextResponse.json({ ok: false, error: "contract not found" }, { status: 404 });
  }

  // 状態の巻き戻りを防ぐ（再送・順序入れ替わり対策）:
  // 締結済(signed)を draft/sent へ戻すイベントは無視して成功を返す（冪等）
  const RANK: Record<string, number> = { draft: 0, sent: 1, signed: 2, expired: 3, cancelled: 3 };
  if (found.status === "signed" && RANK[nextStatus] < RANK.signed) {
    return NextResponse.json({ ok: true, id: found.id, status: found.status, skipped: true });
  }

  // 反映内容（冪等：同じイベントを再送されても結果は同じ）
  const update: Record<string, unknown> = { status: nextStatus };
  if (payload.document_url) update.document_url = payload.document_url;
  // CRM側IDで照合したが電子契約IDが未登録なら補完する
  if (payload.external_contract_id && !found.external_contract_id) {
    update.external_contract_id = payload.external_contract_id;
  }
  if (nextStatus === "signed") {
    update.signed_at = (payload.signed_at || new Date().toISOString().slice(0, 10)).slice(0, 10);
  }

  const { error: updErr } = await supabase.from("contracts").update(update).eq("id", found.id);
  if (updErr) {
    console.error("contracts webhook update error", updErr);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }

  // 監査ログ（自動同期の証跡。Webhookはセッションが無いため admin client で直接記録）
  await supabase.from("audit_logs").insert({
    user_id: null,
    user_name: "Webhook(契約システム)",
    action: "contract.webhook_sync",
    entity: "contract",
    entity_id: found.id,
    detail: { event, status: nextStatus },
  });
  if (found.resident_id) revalidatePath(`/admin/residents/${found.resident_id}`);

  return NextResponse.json({ ok: true, id: found.id, status: nextStatus });
}
