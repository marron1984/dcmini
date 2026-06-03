import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ReferrerForm } from "@/components/admin/ReferrerForm";

export default function NewReferrerPage() {
  return (
    <>
      <Link href="/admin/referrers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 紹介元一覧へ戻る
      </Link>
      <PageHeader title="紹介元を追加" />
      <Card>
        <CardContent>
          <ReferrerForm />
        </CardContent>
      </Card>
    </>
  );
}
