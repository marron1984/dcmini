import Link from "next/link";
import { Plus, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getReferrersWithStats } from "@/lib/data/admin";
import { REFERRER_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const TYPE_LABEL = Object.fromEntries(REFERRER_TYPES.map((t) => [t.value, t.label]));

export default async function ReferrersPage() {
  const referrers = await getReferrersWithStats();

  return (
    <>
      <PageHeader
        title="紹介元管理"
        description={`${referrers.length}件の紹介元`}
        action={
          <Link href="/admin/referrers/new">
            <Button size="sm"><Plus className="h-4 w-4" />紹介元を追加</Button>
          </Link>
        }
      />

      {referrers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          紹介元がまだ登録されていません。
        </div>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">紹介元</th>
                    <th className="px-4 py-3 font-semibold">種別</th>
                    <th className="px-4 py-3 font-semibold">連絡先</th>
                    <th className="px-4 py-3 text-right font-semibold">紹介</th>
                    <th className="px-4 py-3 text-right font-semibold">見学</th>
                    <th className="px-4 py-3 text-right font-semibold">成約</th>
                    <th className="px-4 py-3 text-right font-semibold">成約率</th>
                    <th className="px-4 py-3 font-semibold">最終接触</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/referrers/${r.id}`} className="font-semibold text-brand-700 hover:underline">
                          {r.name}
                        </Link>
                        {r.contact_person && (
                          <p className="text-xs text-ink-muted">{r.contact_person}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="border-slate-200 bg-slate-100 text-slate-600">
                          {TYPE_LABEL[r.type] ?? r.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {r.phone && (
                          <p className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{r.phone}</p>
                        )}
                        {r.email && (
                          <p className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{r.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{r.lead_count}</td>
                      <td className="px-4 py-3 text-right text-ink-soft">{r.tour_count}</td>
                      <td className="px-4 py-3 text-right text-ink-soft">{r.contract_count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-700">{r.conversion_rate}%</td>
                      <td className="px-4 py-3 text-ink-muted">{r.last_contacted_at ? formatDate(r.last_contacted_at) : "—"}</td>
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
