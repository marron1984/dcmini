import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ResidentForm } from "@/components/admin/ResidentForm";
import { getFacilities, getRooms } from "@/lib/data/admin";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function NewResidentPage() {
  const { ok, user } = await checkSectionAccess("residents");
  if (!ok) return <ForbiddenCard />;
  // 閲覧者は編集不可
  if (user && user.role === "viewer") return <ForbiddenCard />;

  const [facilities, rooms] = await Promise.all([getFacilities(), getRooms()]);
  const facilityOptions = facilities.map((f) => ({ id: f.id, name: f.name }));
  const roomOptions = rooms.map((r) => ({ id: r.id, room_number: r.room_number, facility_id: r.facility_id }));

  return (
    <>
      <Link href="/admin/residents" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 入居者一覧へ戻る
      </Link>
      <PageHeader title="入居者を追加" />
      <Card>
        <CardContent>
          <ResidentForm facilities={facilityOptions} rooms={roomOptions} />
        </CardContent>
      </Card>
    </>
  );
}
