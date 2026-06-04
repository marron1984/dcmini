import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNotifications } from "@/lib/data/admin";
import { NOTIFICATION_CATEGORIES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  info: "border-l-slate-300",
};

export default async function NotificationsPage() {
  const { ok } = await checkSectionAccess("notifications");
  if (!ok) return <ForbiddenCard />;

  const notifications = await getNotifications();

  // カテゴリ別に件数集計
  const byCategory = notifications.reduce<Record<string, number>>((acc, n) => {
    acc[n.category] = (acc[n.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="通知"
        description="対応が必要な案件・予定をまとめて確認できます"
      />

      {/* カテゴリ別サマリー */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(NOTIFICATION_CATEGORIES).map(([key, meta]) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-ink">{byCategory[key] ?? 0}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">{meta.label}</p>
          </div>
        ))}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-ink-muted">
            <Bell className="mb-3 h-8 w-8 text-slate-300" />
            対応が必要な通知はありません。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = NOTIFICATION_CATEGORIES[n.category];
            const isDateTime = n.category === "tour_tomorrow";
            return (
              <Link
                key={n.id}
                href={n.href}
                className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 border-l-4 bg-white px-4 py-3 hover:bg-slate-50 ${SEVERITY_BORDER[n.severity]}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={`border-transparent ${meta?.color ?? ""}`}>
                      {meta?.label ?? n.category}
                    </Badge>
                    <span className="font-semibold text-ink">{n.title}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-soft">{n.detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-muted">
                    {isDateTime ? formatDateTime(n.date) : formatDate(n.date)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
