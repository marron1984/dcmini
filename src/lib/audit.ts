import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// 操作ログを記録する（要件32: 操作ログ保存）。
// ベストエフォート: 失敗しても本処理を妨げない。
export async function logAction(
  action: string,
  opts: {
    entity?: string;
    entityId?: string | null;
    detail?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();
    await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      user_name: user?.name ?? null,
      action,
      entity: opts.entity ?? null,
      entity_id: opts.entityId ?? null,
      detail: opts.detail ?? {},
    });
  } catch {
    // ログ記録の失敗は握りつぶす
  }
}
