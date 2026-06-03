import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { getArticleById } from "@/lib/data/admin";

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const article = await getArticleById(params.id);
  if (!article) notFound();

  return (
    <>
      <Link href="/admin/articles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 記事一覧へ戻る
      </Link>
      <PageHeader
        title={article.title}
        description={`/column/${article.slug}`}
        action={
          article.status === "published" ? (
            <a href={`/column/${article.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
              <ExternalLink className="h-4 w-4" />公開ページを開く
            </a>
          ) : undefined
        }
      />
      <Card>
        <CardContent>
          <ArticleForm article={article} />
        </CardContent>
      </Card>
    </>
  );
}
