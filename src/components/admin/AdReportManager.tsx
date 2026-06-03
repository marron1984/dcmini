"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertAdReport, deleteAdReport } from "@/app/admin/actions";
import { formatDate, formatYen } from "@/lib/utils";
import type { AdReport } from "@/lib/data/admin";

function div(a: number | null, b: number | null): number | null {
  if (!a || !b) return null;
  return Math.round(a / b);
}
function pct(a: number | null, b: number | null): string {
  if (!a || !b) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
}

export function AdReportManager({ reports }: { reports: AdReport[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 集計（CPA・入居単価）
  const sum = reports.reduce(
    (acc, r) => ({
      cost: acc.cost + (r.cost ?? 0),
      clicks: acc.clicks + (r.clicks ?? 0),
      impressions: acc.impressions + (r.impressions ?? 0),
      conversions: acc.conversions + (r.conversions ?? 0),
      tours: acc.tours + (r.tours ?? 0),
      move_ins: acc.move_ins + (r.move_ins ?? 0),
    }),
    { cost: 0, clicks: 0, impressions: 0, conversions: 0, tours: 0, move_ins: 0 }
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertAdReport(fd);
      if (res.ok) {
        formRef.current?.reset();
        setOpen(false);
      } else setError(res.error ?? "登録に失敗しました");
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteAdReport(id);
    });
  }

  const summaryCards = [
    { label: "広告費", value: formatYen(sum.cost) },
    { label: "クリック数", value: sum.clicks.toLocaleString() },
    { label: "問い合わせ", value: sum.conversions.toLocaleString() },
    { label: "入居", value: sum.move_ins.toLocaleString() },
    { label: "CPA（問い合わせ単価）", value: formatYen(div(sum.cost, sum.conversions)) },
    { label: "入居単価", value: formatYen(div(sum.cost, sum.move_ins)) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-ink-muted">{c.label}</p>
            <p className="mt-1 text-lg font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant={open ? "outline" : "primary"} onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" />レポートを追加
        </Button>
      </div>

      {open && (
        <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Field label="日付" required><Input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="キャンペーン名"><Input name="campaign_name" /></Field>
            <Field label="広告グループ名"><Input name="ad_group_name" /></Field>
            <Field label="キーワード"><Input name="keyword" /></Field>
            <Field label="広告費（円）"><Input name="cost" inputMode="numeric" /></Field>
            <Field label="表示回数"><Input name="impressions" inputMode="numeric" /></Field>
            <Field label="クリック数"><Input name="clicks" inputMode="numeric" /></Field>
            <Field label="問い合わせ数"><Input name="conversions" inputMode="numeric" /></Field>
            <Field label="見学数"><Input name="tours" inputMode="numeric" /></Field>
            <Field label="入居数"><Input name="move_ins" inputMode="numeric" /></Field>
          </div>
          <div className="mt-3">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "登録中..." : "登録する"}
            </Button>
          </div>
        </form>
      )}

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-ink-muted">
          広告レポートがまだありません。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-ink-muted">
                <th className="px-3 py-3 font-semibold">日付</th>
                <th className="px-3 py-3 font-semibold">キャンペーン</th>
                <th className="px-3 py-3 font-semibold">KW</th>
                <th className="px-3 py-3 text-right font-semibold">費用</th>
                <th className="px-3 py-3 text-right font-semibold">表示</th>
                <th className="px-3 py-3 text-right font-semibold">CL</th>
                <th className="px-3 py-3 text-right font-semibold">CTR</th>
                <th className="px-3 py-3 text-right font-semibold">CPC</th>
                <th className="px-3 py-3 text-right font-semibold">CV</th>
                <th className="px-3 py-3 text-right font-semibold">CPA</th>
                <th className="px-3 py-3 text-right font-semibold">入居</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-3 py-2.5 whitespace-nowrap text-ink-soft">{formatDate(r.date)}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-ink">{r.campaign_name ?? "—"}</p>
                    {r.ad_group_name && <p className="text-xs text-ink-muted">{r.ad_group_name}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft">{r.keyword ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{formatYen(r.cost)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{r.impressions?.toLocaleString() ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{r.clicks?.toLocaleString() ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{pct(r.clicks, r.impressions)}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{formatYen(div(r.cost, r.clicks))}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{r.conversions ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-brand-700">{formatYen(div(r.cost, r.conversions))}</td>
                  <td className="px-3 py-2.5 text-right text-ink-soft">{r.move_ins ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onDelete(r.id)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
