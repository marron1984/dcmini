"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoomStatusSelect } from "@/components/admin/RoomStatusSelect";
import { ROOM_STATUSES, ROOM_STATUS_MAP } from "@/lib/constants";
import { upsertRoom } from "@/app/admin/actions";
import { formatYen } from "@/lib/utils";
import type { Room } from "@/lib/types";

export function RoomManager({
  facilityId,
  rooms,
  canEdit = true,
}: {
  facilityId: string;
  rooms: Room[];
  canEdit?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertRoom(fd);
      if (res.ok) {
        formRef.current?.reset();
        setOpen(false);
      } else setError(res.error ?? "登録に失敗しました");
    });
  }

  const sorted = [...rooms].sort((a, b) =>
    a.room_number.localeCompare(b.room_number, "ja", { numeric: true })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          全{rooms.length}室 / 空室 {rooms.filter((r) => r.status === "vacant").length}室
        </p>
        {canEdit && (
          <Button size="sm" variant={open ? "outline" : "primary"} onClick={() => setOpen(!open)}>
            <Plus className="h-4 w-4" />部屋を追加
          </Button>
        )}
      </div>

      {open && (
        <form ref={formRef} onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
          <input type="hidden" name="facility_id" value={facilityId} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="部屋番号" required><Input name="room_number" required /></Field>
            <Field label="階数"><Input name="floor" /></Field>
            <Field label="状況">
              <Select name="status" defaultValue="vacant">
                {ROOM_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
            <Field label="家賃（円）"><Input name="rent" /></Field>
            <Field label="共益費（円）"><Input name="common_fee" /></Field>
            <Field label="食費（円）"><Input name="meal_fee" /></Field>
            <Field label="管理費（円）"><Input name="management_fee" /></Field>
            <Field label="メモ" className="sm:col-span-2"><Input name="note" /></Field>
          </div>
          <div className="mt-3">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "登録中..." : "登録する"}
            </Button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">部屋が登録されていません。</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5 font-semibold">部屋番号</th>
                <th className="px-4 py-2.5 font-semibold">階</th>
                <th className="px-4 py-2.5 font-semibold">家賃</th>
                <th className="px-4 py-2.5 font-semibold">状況</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-ink">{r.room_number}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{r.floor ? `${r.floor}F` : "—"}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{formatYen(r.rent)}</td>
                  <td className="px-4 py-2.5">
                    {canEdit ? (
                      <RoomStatusSelect roomId={r.id} status={r.status} />
                    ) : (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ROOM_STATUS_MAP[r.status]?.color ?? ""}`}>
                        {ROOM_STATUS_MAP[r.status]?.label ?? r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
