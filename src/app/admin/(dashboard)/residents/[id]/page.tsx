import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResidentForm } from "@/components/admin/ResidentForm";
import { DeleteResidentButton } from "@/components/admin/DeleteResidentButton";
import { getResident, getFacilities, getRooms } from "@/lib/data/admin";
import { RESIDENT_STATUS_MAP } from "@/lib/constants";
import { formatDate, formatYen, cn } from "@/lib/utils";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="shrink-0 text-sm text-ink-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value || "—"}</span>
    </div>
  );
}

export default async function ResidentDetailPage({ params }: { params: { id: string } }) {
  const { ok, user } = await checkSectionAccess("residents");
  if (!ok) return <ForbiddenCard />;

  const resident = await getResident(params.id);
  if (!resident) notFound();

  const canEdit = user != null && ["admin", "consultant"].includes(user.role);
  const status = RESIDENT_STATUS_MAP[resident.status];

  const [facilities, rooms] = await Promise.all([getFacilities(), getRooms()]);
  const facilityOptions = facilities.map((f) => ({ id: f.id, name: f.name }));
  const roomOptions = rooms.map((r) => ({ id: r.id, room_number: r.room_number, facility_id: r.facility_id }));

  return (
    <>
      <Link href="/admin/residents" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 入居者一覧へ戻る
      </Link>

      <PageHeader
        title={resident.name}
        description={resident.name_kana ?? undefined}
        action={
          <span className={cn("inline-block rounded-full border px-3 py-1 text-sm font-semibold", status?.color)}>
            {status?.label ?? resident.status}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左: サマリー */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-500" />入居者情報</CardTitle></CardHeader>
            <CardContent>
              <Row label="お名前" value={resident.name} />
              <Row label="フリガナ" value={resident.name_kana} />
              <Row label="年齢" value={resident.age != null ? `${resident.age}歳` : null} />
              <Row label="性別" value={resident.gender} />
              <Row label="要介護度" value={resident.care_level} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand-500" />入居先・契約</CardTitle></CardHeader>
            <CardContent>
              <Row label="施設" value={resident.facility?.name} />
              <Row label="部屋" value={resident.room?.room_number} />
              <Row label="契約日" value={resident.contract_date ? formatDate(resident.contract_date) : null} />
              <Row label="入居日" value={resident.admission_date ? formatDate(resident.admission_date) : null} />
              <Row label="退去日" value={resident.move_out_date ? formatDate(resident.move_out_date) : null} />
              <Row label="月額費用" value={resident.monthly_fee != null ? formatYen(resident.monthly_fee) : null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>保証人・連絡先</CardTitle></CardHeader>
            <CardContent>
              <Row label="身元保証人" value={resident.guarantor} />
              <Row label="緊急連絡先" value={resident.emergency_contact} />
              {resident.lead_id && (
                <Row
                  label="由来の案件"
                  value={
                    <Link href={`/admin/leads/${resident.lead_id}`} className="text-brand-700 hover:underline">
                      案件を開く
                    </Link>
                  }
                />
              )}
              {resident.note && (
                <div className="border-t border-slate-100 py-2">
                  <p className="text-sm text-ink-muted">メモ</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{resident.note}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右: 編集 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>情報を編集</CardTitle>
              {canEdit && <DeleteResidentButton id={resident.id} redirectTo="/admin/residents" />}
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <ResidentForm resident={resident} facilities={facilityOptions} rooms={roomOptions} />
              ) : (
                <p className="text-sm text-ink-muted">編集権限がありません（閲覧のみ）。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
