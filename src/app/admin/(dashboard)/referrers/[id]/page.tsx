import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ReferrerForm } from "@/components/admin/ReferrerForm";
import { getReferrer } from "@/lib/data/admin";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function ReferrerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { ok } = await checkSectionAccess("referrers");
  if (!ok) return <ForbiddenCard />;

  const referrer = await getReferrer(params.id);
  if (!referrer) notFound();

  return (
    <>
      <Link href="/admin/referrers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 紹介元一覧へ戻る
      </Link>
      <PageHeader title={referrer.name} description="紹介元情報の編集" />
      <Card>
        <CardContent>
          <ReferrerForm referrer={referrer} />
        </CardContent>
      </Card>
    </>
  );
}
