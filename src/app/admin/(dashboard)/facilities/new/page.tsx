import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { FacilityForm } from "@/components/admin/FacilityForm";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function NewFacilityPage() {
  const { ok, user } = await checkSectionAccess("facilities");
  // 閲覧者は作成不可
  if (!ok || !user || !["admin", "consultant"].includes(user.role)) {
    return <ForbiddenCard />;
  }
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
