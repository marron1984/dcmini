import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <>
      <Link href="/admin/articles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 記事一覧へ戻る
      </Link>
      <PageHeader title="記事を作成" />
      <Card>
        <CardContent>
          <ArticleForm />
        </CardContent>
      </Card>
    </>
  );
}
