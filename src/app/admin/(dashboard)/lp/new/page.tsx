import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { LpForm } from "@/components/admin/LpForm";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function NewLpPage() {
  const { ok } = await checkSectionAccess("lp");
  if (!ok) return <ForbiddenCard />;
  return (
    <>
      <Link href="/admin/lp" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> LP一覧へ戻る
      </Link>
      <PageHeader title="LPを作成" />
      <Card>
        <CardContent>
          <LpForm />
        </CardContent>
      </Card>
    </>
  );
}
