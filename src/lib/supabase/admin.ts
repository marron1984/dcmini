import { createClient } from "@supabase/supabase-js";

// service_role を用いるサーバー専用クライアント。
// 公開フォームからの案件登録など、RLSをバイパスする必要がある処理に限定して使う。
// 絶対にクライアントへ渡さないこと。
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
