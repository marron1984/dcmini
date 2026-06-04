import { ShieldAlert, Plug } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getCurrentUser, getSiteSettings } from "@/lib/auth";

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
            以下はAPIキー・アカウント連携が必要なため、認証情報の登録後に有効化します。
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {[
              "LINE公式アカウント（自動応答・追客・見学リマインド）",
              "Google広告 API（広告レポート自動取込）",
              "AIヒアリング要約・施設マッチング（LLM連携）",
              "LINE WORKS 通知",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                {t}
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  未接続
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
