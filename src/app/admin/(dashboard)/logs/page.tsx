import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/utils";

// アクション名 → 日本語ラベル
const ACTION_LABELS: Record<string, string> = {
  "lead.status_change": "案件ステータス変更",
  "lead.lost": "案件 失注登録",
  "facility.create": "施設 作成",
  "facility.update": "施設 更新",
  "room.create": "部屋 作成",
  "room.update": "部屋 更新",
  "room.status_change": "部屋状況 変更",
  "tour.create": "見学 登録",
  "tour.update": "見学 更新",
  "referrer.create": "紹介元 作成",
  "referrer.update": "紹介元 更新",
  "lp.create": "LP 作成",
  "lp.update": "LP 更新",
  "ad_report.create": "広告レポート 作成",
  "ad_report.update": "広告レポート 更新",
  "article.create": "記事 作成",
  "article.update": "記事 更新",
  "article.delete": "記事 削除",
};

export default async function LogsPage() {
  const user = await getCurrentUser();

  // 操作ログは管理者のみ閲覧可（要件32: 個人情報保護）
  if (user?.role !== "admin") {
    return (
      <>
        <PageHeader title="操作ログ" />
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-ink-muted">
            <ShieldAlert className="mb-3 h-8 w-8 text-slate-300" />
            操作ログは管理者のみ閲覧できます。
          </CardContent>
        </Card>
      </>
    );
  }

  const logs = await getAuditLogs();

  return (
    <>
      <PageHeader title="操作ログ" description="管理画面での操作履歴（直近300件）" />

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          操作ログはまだありません。
        </div>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">日時</th>
                    <th className="px-4 py-3 font-semibold">操作者</th>
                    <th className="px-4 py-3 font-semibold">操作</th>
                    <th className="px-4 py-3 font-semibold">対象</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{log.user_name ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-ink-muted">
                        {log.entity ?? "—"}
                        {log.entity_id && <span className="ml-1 text-xs">#{log.entity_id.slice(0, 8)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
