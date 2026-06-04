import { ShieldAlert, Plug } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getCurrentUser, getSiteSettings } from "@/lib/auth";
import { isAiEnabled } from "@/lib/ai";

export default async function SettingsPage() {
  const me = await getCurrentUser();

  // 設定変更は管理者のみ
  if (me?.role !== "admin") {
    return (
      <>
        <PageHeader title="連携設定" />
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-ink-muted">
            <ShieldAlert className="mb-3 h-8 w-8 text-slate-300" />
            設定の変更は管理者のみ可能です。
          </CardContent>
        </Card>
      </>
    );
  }

  const settings = await getSiteSettings();
  const aiEnabled = isAiEnabled();

  return (
    <>
      <PageHeader
        title="連携設定"
        description="電話番号・LINE・計測タグなど、外部サービス連携を管理します"
      />

      <Card>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>

      {/* 今後の連携（要・認証情報） */}
      <Card className="mt-6">
        <CardContent>
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <Plug className="h-5 w-5 text-brand-500" />
            今後の外部連携（準備中）
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            以下はAPIキー・アカウント連携が必要です。認証情報は環境変数で設定します。
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {[
              { label: "AI（相談要約・施設選定・家族/ケアマネ向け文面生成）", connected: aiEnabled },
              { label: "LINE公式アカウント（自動応答・追客・見学リマインド）", connected: false },
              { label: "Google広告 API（広告レポート自動取込）", connected: false },
              { label: "LINE WORKS 通知", connected: false },
            ].map((t) => (
              <li key={t.label} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${t.connected ? "bg-emerald-500" : "bg-slate-300"}`} />
                {t.label}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    t.connected
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {t.connected ? "接続済み" : "未接続"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
