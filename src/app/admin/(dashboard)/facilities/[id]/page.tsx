import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { FacilityForm } from "@/components/admin/FacilityForm";
import { RoomManager } from "@/components/admin/RoomManager";
import { getFacility } from "@/lib/data/admin";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function FacilityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { ok, user } = await checkSectionAccess("facilities");
  if (!ok) return <ForbiddenCard />;
  const canEdit = user != null && ["admin", "consultant"].includes(user.role);

  const facility = await getFacility(params.id);
  if (!facility) notFound();

  return (
    <>
      <Link href="/admin/facilities" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 施設一覧へ戻る
      </Link>
      <PageHeader title={facility.name} description={facility.type ?? undefined} />

      <Card>
        <CardContent>
          <Tabs
            tabs={[
              {
                id: "rooms",
                label: `部屋・空室 (${facility.rooms?.length ?? 0})`,
                content: <RoomManager facilityId={facility.id} rooms={facility.rooms ?? []} canEdit={canEdit} />,
              },
              {
                id: "edit",
                label: "施設情報の編集",
                content: canEdit ? (
                  <FacilityForm facility={facility} />
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-ink-muted">
                    編集権限がありません（閲覧のみ）。
                  </p>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </>
  );
}
