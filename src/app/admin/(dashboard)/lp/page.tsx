import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteLpButton } from "@/components/admin/DeleteLpButton";
import { getLpPages } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils";

export default async function LpListPage() {
  const pages = await getLpPages();

  return (
    <>
      <PageHeader
        title="LP管理"
        description={`${pages.length}件のランディングページ（Google広告用）`}
        action={
          <Link href="/admin/lp/new">
            <Button size="sm"><Plus className="h-4 w-4" />LPを作成</Button>
          </Link>
        }
      />

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          LPがまだありません。「LPを作成」から追加してください。
        </div>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">タイトル</th>
                    <th className="px-4 py-3 font-semibold">スラッグ</th>
                    <th className="px-4 py-3 font-semibold">キーワード</th>
                    <th className="px-4 py-3 font-semibold">状態</th>
                    <th className="px-4 py-3 font-semibold">更新日</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/lp/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        <span className="flex items-center gap-1">
                          /lp/{p.slug}
                          {p.status === "published" && (
                            <a href={`/lp/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-700">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{p.target_keyword ?? "—"}</td>
                      <td className="px-4 py-3">
                        {p.status === "published" ? (
                          <Badge className="border-green-200 bg-green-50 text-green-700">公開中</Badge>
                        ) : (
                          <Badge className="border-slate-200 bg-slate-100 text-slate-500">下書き</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{formatDate(p.updated_at)}</td>
                      <td className="px-4 py-3 text-right"><DeleteLpButton id={p.id} /></td>
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
