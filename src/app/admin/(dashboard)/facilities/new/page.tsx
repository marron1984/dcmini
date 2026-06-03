import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { FacilityForm } from "@/components/admin/FacilityForm";

export default function NewFacilityPage() {
  return (
    <>
      <Link href="/admin/facilities" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 施設一覧へ戻る
      </Link>
      <PageHeader title="施設を追加" />
      <Card>
        <CardContent>
          <FacilityForm />
        </CardContent>
      </Card>
    </>
  );
}
