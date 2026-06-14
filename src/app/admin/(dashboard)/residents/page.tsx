import Link from "next/link";
import { Plus, Search, Building2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  getResidents,
  getFacilities,
  computeResidentStats,
  type ResidentFilters,
} from "@/lib/data/admin";
import { RESIDENT_STATUSES, RESIDENT_STATUS_MAP } from "@/lib/constants";
import { formatDate, formatYen, cn } from "@/lib/utils";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { ok } = await checkSectionAccess("residents");
  if (!ok) return <ForbiddenCard />;

  const filters: ResidentFilters = {
    q: searchParams.q,
    status: searchParams.status,
    facility: searchParams.facility,
  };

  const [residents, facilities] = await Promise.all([getResidents(filters), getFacilities()]);
  const stats = computeResidentStats(residents);

  const kpis = [
    { label: "入居中", value: stats.residing, color: "text-emerald-700" },
    { label: "入居予定", value: stats.scheduled, color: "text-amber-700" },
    { label: "退去", value: stats.movedOut, color: "text-slate-500" },
    { label: "入居中の月額合計", value: formatYen(stats.monthlyRevenue), color: "text-brand-700" },
  ];

  return (
    <>
      <PageHeader
        title="入居者管理"
        description={`${residents.length}件の入居者`}
        action={
          <Link href="/admin/residents/new">
            <Button size="sm"><Plus className="h-4 w-4" />入居者を追加</Button>
          </Link>
        }
      />

      {/* KPI */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-ink-muted">{k.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* フィルタ */}
      <form method="get" className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={searchParams.q ?? ""} placeholder="氏名・フリガナで検索" className="pl-9" />
          </div>
        </div>
        <Select name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">ステータス（全て）</option>
          {RESIDENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Select name="facility" defaultValue={searchParams.facility ?? ""}>
          <option value="">施設（全て）</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <div className="col-span-2 flex gap-2 sm:col-span-4">
          <Button type="submit" size="sm">絞り込む</Button>
          <Link href="/admin/residents">
            <Button type="button" variant="outline" size="sm">クリア</Button>
          </Link>
        </div>
      </form>

      {residents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          該当する入居者がいません。入居が決まった案件から登録できます。
        </div>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">入居者</th>
                    <th className="px-4 py-3 font-semibold">ステータス</th>
                    <th className="px-4 py-3 font-semibold">入居先</th>
                    <th className="px-4 py-3 font-semibold">入居日</th>
                    <th className="px-4 py-3 text-right font-semibold">月額</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/residents/${r.id}`} className="font-semibold text-brand-700 hover:underline">
                          {r.name}
                        </Link>
                        <p className="text-xs text-ink-muted">
                          {[r.care_level, r.age != null ? `${r.age}歳` : null].filter(Boolean).join(" / ") || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-block rounded-full border px-2 py-0.5 text-xs font-semibold", RESIDENT_STATUS_MAP[r.status]?.color)}>
                          {RESIDENT_STATUS_MAP[r.status]?.label ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {r.facility ? (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-brand-500" />
                            {r.facility.name}
                            {r.room && <span className="text-xs text-ink-muted">／{r.room.room_number}</span>}
                          </span>
                        ) : (
                          <span className="text-ink-muted">未設定</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{r.admission_date ? formatDate(r.admission_date) : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{r.monthly_fee != null ? formatYen(r.monthly_fee) : "—"}</td>
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
