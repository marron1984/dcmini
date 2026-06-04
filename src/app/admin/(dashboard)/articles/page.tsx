import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { getArticles } from "@/lib/data/admin";
import { formatDate } from "@/lib/utils";

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <>
      <PageHeader
        title="記事CMS（コラム）"
        description={`${articles.length}件のSEOコラム記事`}
        action={
          <Link href="/admin/articles/new">
            <Button size="sm"><Plus className="h-4 w-4" />記事を作成</Button>
          </Link>
        }
      />

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          記事がまだありません。「記事を作成」から追加してください。
        </div>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">タイトル</th>
                    <th className="px-4 py-3 font-semibold">カテゴリ</th>
                    <th className="px-4 py-3 font-semibold">状態</th>
                    <th className="px-4 py-3 font-semibold">更新日</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/articles/${a.id}`} className="font-semibold text-brand-700 hover:underline">
                          {a.title}
                        </Link>
                        <p className="flex items-center gap-1 text-xs text-ink-muted">
                          /column/{a.slug}
                          {a.status === "published" && (
                            <a href={`/column/${a.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-700">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{a.category ?? "—"}</td>
                      <td className="px-4 py-3">
                        {a.status === "published" ? (
                          <Badge className="border-green-200 bg-green-50 text-green-700">公開中</Badge>
                        ) : (
                          <Badge className="border-slate-200 bg-slate-100 text-slate-500">下書き</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{formatDate(a.updated_at)}</td>
                      <td className="px-4 py-3 text-right"><DeleteArticleButton id={a.id} /></td>
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
