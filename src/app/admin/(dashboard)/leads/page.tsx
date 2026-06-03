import Link from "next/link";
import { Table, LayoutGrid, Phone, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { LeadStatusBadge } from "@/components/admin/StatusBadge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLeads, getStaffUsers, type LeadFilters } from "@/lib/data/admin";
import {
  LEAD_STATUSES,
  KANBAN_STATUSES,
  LEAD_STATUS_MAP,
  CARE_LEVELS,
} from "@/lib/constants";
import { formatDate, relativeTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const view = searchParams.view === "kanban" ? "kanban" : "table";
  const filters: LeadFilters = {
    q: searchParams.q,
    status: searchParams.status,
    assigned: searchParams.assigned,
    care_level: searchParams.care_level,
    welfare: searchParams.welfare,
    dementia: searchParams.dementia,
    area: searchParams.area,
  };

  const [leads, staff] = await Promise.all([getLeads(filters), getStaffUsers()]);

  const buildHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    Object.entries({ ...searchParams, ...overrides }).forEach(([k, v]) => {
      if (v) p.set(k, v as string);
    });
    return `/admin/leads?${p.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="案件管理"
        description={`${leads.length}件の入居相談`}
        action={
          <div className="flex rounded-xl border border-slate-300 bg-white p-1">
            <Link
              href={buildHref({ view: "table" })}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold",
                view === "table" ? "bg-brand-600 text-white" : "text-ink-soft"
              )}
            >
              <Table className="h-4 w-4" /> 一覧
            </Link>
            <Link
              href={buildHref({ view: "kanban" })}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold",
                view === "kanban" ? "bg-brand-600 text-white" : "text-ink-soft"
              )}
            >
              <LayoutGrid className="h-4 w-4" /> カンバン
            </Link>
          </div>
        }
      />

      {/* 検索フィルタ */}
      <form
        method="get"
        className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        <input type="hidden" name="view" value={view} />
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="氏名・電話番号で検索"
              className="pl-9"
            />
          </div>
        </div>
        <Select name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">ステータス（全て）</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Select name="assigned" defaultValue={searchParams.assigned ?? ""}>
          <option value="">担当者（全て）</option>
          {staff.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
        <Select name="care_level" defaultValue={searchParams.care_level ?? ""}>
          <option value="">要介護度（全て）</option>
          {CARE_LEVELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Select name="welfare" defaultValue={searchParams.welfare ?? ""} className="flex-1">
            <option value="">生保</option>
            <option value="yes">生保あり</option>
          </Select>
          <Select name="dementia" defaultValue={searchParams.dementia ?? ""} className="flex-1">
            <option value="">認知</option>
            <option value="yes">認知症あり</option>
          </Select>
        </div>
        <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
          <Button type="submit" size="sm">絞り込む</Button>
          <Link href="/admin/leads">
            <Button type="button" variant="outline" size="sm">クリア</Button>
          </Link>
        </div>
      </form>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          該当する案件がありません。
        </div>
      ) : view === "table" ? (
        <LeadsTable leads={leads} />
      ) : (
        <LeadsKanban leads={leads} />
      )}
    </>
  );
}

function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-ink-muted">
            <th className="px-4 py-3 font-semibold">相談者</th>
            <th className="px-4 py-3 font-semibold">入居予定者</th>
            <th className="px-4 py-3 font-semibold">状況</th>
            <th className="px-4 py-3 font-semibold">ステータス</th>
            <th className="px-4 py-3 font-semibold">担当</th>
            <th className="px-4 py-3 font-semibold">登録日</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={`/admin/leads/${l.id}`} className="font-semibold text-brand-700 hover:underline">
                  {l.consultant_name}
                </Link>
                {l.consultant_phone && (
                  <p className="flex items-center gap-1 text-xs text-ink-muted">
                    <Phone className="h-3 w-3" /> {l.consultant_phone}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-ink-soft">
                {l.resident_name ?? "—"}
                {l.care_level && (
                  <span className="ml-1 text-xs text-ink-muted">/ {l.care_level}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {l.dementia_status && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-700">認知症</span>}
                  {l.welfare_status && <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700">生保</span>}
                  {l.medical_needs && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700">医療</span>}
                </div>
              </td>
              <td className="px-4 py-3"><LeadStatusBadge status={l.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{l.assigned_user?.name ?? "未割当"}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(l.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadsKanban({ leads }: { leads: Lead[] }) {
  const columns = [...KANBAN_STATUSES, "lost", "on_hold"] as const;
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((status) => {
        const items = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="w-72 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-bold text-ink">
                {LEAD_STATUS_MAP[status].label}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-ink-soft">
                {items.length}
              </span>
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-100 p-2">
              {items.map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/leads/${l.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm"
                >
                  <p className="font-semibold text-ink">{l.consultant_name}</p>
                  {l.resident_name && (
                    <p className="text-xs text-ink-muted">入居予定: {l.resident_name}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {l.care_level && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink-soft">{l.care_level}</span>
                    )}
                    {l.dementia_status && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-700">認知症</span>}
                    {l.welfare_status && <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700">生保</span>}
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">{relativeTime(l.created_at)}</p>
                </Link>
              ))}
              {items.length === 0 && (
                <p className="px-2 py-3 text-center text-xs text-ink-muted">なし</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
