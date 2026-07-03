import Link from "next/link";
import { Table, LayoutGrid, Phone, Search, Download } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { LeadStatusBadge } from "@/components/admin/StatusBadge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLeads, getStaffUsers, type LeadFilters } from "@/lib/data/admin";
import { LeadsKanban } from "@/components/admin/LeadsKanban";
import { LEAD_STATUSES, CARE_LEVELS, LEAD_CHANNELS, LEAD_CHANNEL_MAP } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { ok, user } = await checkSectionAccess("leads");
  if (!ok) return <ForbiddenCard />;
  // CSV出力・カンバン操作は admin / consultant のみ（viewerは閲覧のみ）
  const canEdit = user != null && ["admin", "consultant"].includes(user.role);

  const view = searchParams.view === "kanban" ? "kanban" : "table";
  const filters: LeadFilters = {
    q: searchParams.q,
    status: searchParams.status,
    assigned: searchParams.assigned,
    care_level: searchParams.care_level,
    welfare: searchParams.welfare,
    dementia: searchParams.dementia,
    area: searchParams.area,
    channel: searchParams.channel,
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
          <div className="flex items-center gap-2">
            {canEdit && (
              <a
                href={`/admin/leads/export?${new URLSearchParams(
                  Object.entries(searchParams).filter(([, v]) => v) as [string, string][]
                ).toString()}`}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-ink-soft hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> CSV
              </a>
            )}
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
        <Select name="channel" defaultValue={searchParams.channel ?? ""}>
          <option value="">流入チャネル（全て）</option>
          {LEAD_CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
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
        <LeadsKanban leads={leads} canEdit={canEdit} />
      )}
    </>
  );
}

function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3 font-semibold">相談者</th>
            <th className="px-4 py-3 font-semibold">入居予定者</th>
            <th className="px-4 py-3 font-semibold">状況</th>
            <th className="px-4 py-3 font-semibold">ステータス</th>
            <th className="px-4 py-3 font-semibold">流入</th>
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
              <td className="px-4 py-3">
                {l.channel ? (
                  <span className={cn("inline-block rounded-full border px-2 py-0.5 text-xs font-semibold", LEAD_CHANNEL_MAP[l.channel]?.color)}>
                    {LEAD_CHANNEL_MAP[l.channel]?.label ?? l.channel}
                  </span>
                ) : (
                  <span className="text-xs text-ink-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-ink-soft">{l.assigned_user?.name ?? "未割当"}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(l.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
