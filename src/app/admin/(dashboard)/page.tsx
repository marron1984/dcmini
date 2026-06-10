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
import { CountUp } from "@/components/ui/count-up";
import { LeadStatusBadge } from "@/components/admin/StatusBadge";
import { getDashboardStats, getReferrersWithStats } from "@/lib/data/admin";
import { LEAD_STATUSES } from "@/lib/constants";
import { formatDateTime, relativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const [stats, referrers] = await Promise.all([
    getDashboardStats(),
    getReferrersWithStats(),
  ]);
  const referrerRanking = [...referrers]
    .filter((r) => r.lead_count > 0)
    .sort((a, b) => b.lead_count - a.lead_count)
    .slice(0, 5);
  const occupancy =
    stats.totalRooms > 0
      ? Math.round(((stats.totalRooms - stats.vacantRooms) / stats.totalRooms) * 100)
      : 0;

  const kpis = [
    { label: "今月の新規相談", value: stats.newThisMonth, suffix: "", icon: Inbox, color: "from-brand-500 to-brand-700" },
    { label: "今月の見学", value: stats.toursThisMonth, suffix: "", icon: CalendarCheck, color: "from-amber-400 to-orange-500" },
    { label: "今月の入居", value: stats.movedInThisMonth, suffix: "", icon: Home, color: "from-emerald-500 to-teal-600" },
    { label: "今月の失注", value: stats.lostThisMonth, suffix: "", icon: XCircle, color: "from-slate-400 to-slate-500" },
    { label: "空室数", value: stats.vacantRooms, suffix: "", icon: DoorOpen, color: "from-green-500 to-emerald-600" },
    { label: "稼働率", value: occupancy, suffix: "%", icon: TrendingUp, color: "from-brand-500 to-accent-500" },
  ];

  return (
    <>
      <PageHeader title="ダッシュボード" description="入居相談の状況サマリー" />

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
            <CardContent className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${k.color} text-white shadow-soft`}>
                <k.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-ink-muted">{k.label}</p>
                <p className="text-2xl font-bold tracking-tight text-ink">
                  <CountUp value={k.value} suffix={k.suffix} />
                </p>
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
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all"
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

      {/* 担当者別成績・紹介元ランキング */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>担当者別成績</CardTitle></CardHeader>
          <CardContent>
            {stats.staffPerformance.length === 0 ? (
              <p className="text-sm text-ink-muted">データがありません。</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.staffPerformance.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5">
                    <span className="font-semibold text-ink">{s.name}</span>
                    <span className="text-sm text-ink-soft">
                      担当 {s.total}件 / 入居 <span className="font-semibold text-emerald-600">{s.movedIn}</span>件
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>紹介元ランキング</CardTitle></CardHeader>
          <CardContent>
            {referrerRanking.length === 0 ? (
              <p className="text-sm text-ink-muted">紹介実績がありません。</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {referrerRanking.map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-ink">{r.name}</span>
                    </span>
                    <span className="text-sm text-ink-soft">
                      紹介 {r.lead_count}件 / 成約率 <span className="font-semibold text-brand-700">{r.conversion_rate}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
