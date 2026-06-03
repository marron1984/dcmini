import Link from "next/link";
import { Plus, MapPin, Building2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFacilities } from "@/lib/data/admin";
import { formatYen } from "@/lib/utils";

export default async function FacilitiesPage() {
  const facilities = await getFacilities();

  return (
    <>
      <PageHeader
        title="施設管理"
        description={`${facilities.length}件の施設`}
        action={
          <Link href="/admin/facilities/new">
            <Button size="sm"><Plus className="h-4 w-4" />施設を追加</Button>
          </Link>
        }
      />

      {facilities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          施設がまだ登録されていません。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => {
            const vacant = f.rooms?.filter((r) => r.status === "vacant").length ?? 0;
            const total = f.rooms?.length ?? 0;
            return (
              <Link
                key={f.id}
                href={`/admin/facilities/${f.id}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-ink">{f.name}</h3>
                      <p className="text-xs text-ink-muted">{f.type ?? "—"}</p>
                    </div>
                  </div>
                  {!f.is_published && (
                    <Badge className="border-slate-200 bg-slate-100 text-slate-500">非公開</Badge>
                  )}
                </div>
                {f.area && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
                    <MapPin className="h-4 w-4 text-brand-500" />{f.area}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.accepts_dementia && <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">認知症</Badge>}
                  {f.accepts_welfare && <Badge className="border-teal-200 bg-teal-50 text-teal-700">生保</Badge>}
                  {f.end_of_life_care && <Badge className="border-rose-200 bg-rose-50 text-rose-700">看取り</Badge>}
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-xs text-ink-muted">月額</p>
                    <p className="font-bold text-brand-700">{formatYen(f.monthly_fee)}〜</p>
                  </div>
                  <Badge className={vacant > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                    空室 {vacant}/{total}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
