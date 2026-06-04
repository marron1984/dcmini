import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { RoomStatusSelect } from "@/components/admin/RoomStatusSelect";
import { getRooms } from "@/lib/data/admin";
import { ROOM_STATUSES } from "@/lib/constants";
import { formatYen } from "@/lib/utils";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function RoomsPage() {
  const { ok } = await checkSectionAccess("rooms");
  if (!ok) return <ForbiddenCard />;

  const rooms = await getRooms();

  const counts = ROOM_STATUSES.map((s) => ({
    ...s,
    count: rooms.filter((r) => r.status === s.value).length,
  }));

  return (
    <>
      <PageHeader title="部屋・空室管理" description={`全${rooms.length}室`} />

      {/* 状況サマリー */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {counts.map((c) => (
          <div key={c.value} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-ink">{c.count}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {rooms.length === 0 ? (
            <div className="py-16 text-center text-ink-muted">
              <DoorOpen className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              部屋が登録されていません。施設管理から登録してください。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">施設</th>
                    <th className="px-4 py-3 font-semibold">部屋</th>
                    <th className="px-4 py-3 font-semibold">階</th>
                    <th className="px-4 py-3 font-semibold">家賃</th>
                    <th className="px-4 py-3 font-semibold">状況</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/facilities/${r.facility_id}`} className="font-semibold text-brand-700 hover:underline">
                          {r.facility?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{r.room_number}</td>
                      <td className="px-4 py-3 text-ink-soft">{r.floor ? `${r.floor}F` : "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">{formatYen(r.rent)}</td>
                      <td className="px-4 py-3"><RoomStatusSelect roomId={r.id} status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
