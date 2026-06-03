import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { LpForm } from "@/components/admin/LpForm";
import { getLpPage } from "@/lib/data/admin";

export default async function LpDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lp = await getLpPage(params.id);
  if (!lp) notFound();

  return (
    <>
      <Link href="/admin/lp" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> LP一覧へ戻る
      </Link>
      <PageHeader
        title={lp.title}
        description={`/lp/${lp.slug}`}
        action={
          lp.status === "published" ? (
            <a
              href={`/lp/${lp.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />公開ページを開く
            </a>
          ) : undefined
        }
      />
      <Card>
        <CardContent>
          <LpForm lp={lp} />
        </CardContent>
      </Card>
    </>
  );
}
