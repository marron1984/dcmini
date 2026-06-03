import Link from "next/link";
import {
  Inbox,
  Home,
  XCircle,
  CalendarCheck,
  DoorOpen,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/admin/StatusBadge";
import { getDashboardStats } from "@/lib/data/admin";
import { LEAD_STATUSES } from "@/lib/constants";
import { formatDateTime, relativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const occupancy =
    stats.totalRooms > 0
      ? Math.round(((stats.totalRooms - stats.vacantRooms) / stats.totalRooms) * 100)
      : 0;

  const kpis = [
    { label: "今月の新規相談", value: stats.newThisMonth, icon: Inbox, color: "text-brand-600 bg-brand-50" },
    { label: "今月の見学", value: stats.toursThisMonth, icon: CalendarCheck, color: "text-amber-600 bg-amber-50" },
    { label: "今月の入居", value: stats.movedInThisMonth, icon: Home, color: "text-emerald-600 bg-emerald-50" },
    { label: "今月の失注", value: stats.lostThisMonth, icon: XCircle, color: "text-slate-600 bg-slate-100" },
    { label: "空室数", value: stats.vacantRooms, icon: DoorOpen, color: "text-green-600 bg-green-50" },
    { label: "稼働率", value: `${occupancy}%`, icon: TrendingUp, color: "text-brand-600 bg-brand-50" },
  ];

  return (
    <>
      <PageHeader title="ダッシュボード" description="入居相談の状況サマリー" />

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${k.color}`}>
                <k.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-ink-muted">{k.label}</p>
                <p className="text-2xl font-bold text-ink">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ステータス別件数 */}
        <Card>
          <CardHeader>
            <CardTitle>ステータス別件数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {LEAD_STATUSES.map((s) => {
              const count = stats.byStatus[s.value] ?? 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={s.value} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-ink-soft">{s.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-ink">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 要対応案件 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                要対応の案件
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.overdueLeads.length === 0 ? (
                <p className="text-sm text-ink-muted">対応待ちの放置案件はありません。</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.overdueLeads.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="flex items-center justify-between gap-2 py-2.5 hover:opacity-70"
                      >
                        <span className="font-semibold text-ink">{l.consultant_name}</span>
                        <span className="flex items-center gap-2">
                          <LeadStatusBadge status={l.status} />
                          <span className="text-xs text-ink-muted">
                            {relativeTime(l.created_at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 直近の見学 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-brand-500" />
                直近の見学予定
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.upcomingTours.length === 0 ? (
                <p className="text-sm text-ink-muted">予定されている見学はありません。</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.upcomingTours.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-semibold text-ink">
                          {t.lead?.consultant_name ?? "—"}
                        </p>
                        <p className="text-xs text-ink-muted">{t.facility?.name ?? "施設未定"}</p>
                      </div>
                      <span className="text-sm text-ink-soft">
                        {formatDateTime(t.scheduled_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
