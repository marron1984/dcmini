"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RESIDENT_STATUSES, CARE_LEVELS } from "@/lib/constants";
import { upsertResident } from "@/app/admin/actions";
import type { Resident, Facility, Room } from "@/lib/types";

type RoomOption = Pick<Room, "id" | "room_number" | "facility_id">;

export function ResidentForm({
  resident,
  facilities,
  rooms,
}: {
  resident?: Resident;
  facilities: Pick<Facility, "id" | "name">[];
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string>(resident?.facility_id ?? "");

  // 選択中の施設に属する部屋のみ表示
  const roomOptions = rooms.filter((r) => r.facility_id === facilityId);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertResident(fd);
      if (res.ok) router.push("/admin/residents");
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {resident && <input type="hidden" name="id" value={resident.id} />}
      {resident?.lead_id && <input type="hidden" name="lead_id" value={resident.lead_id} />}

      {/* 基本情報 */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">入居者情報</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="お名前" required>
            <Input name="name" defaultValue={resident?.name ?? ""} required placeholder="山田 太郎" />
          </Field>
          <Field label="フリガナ">
            <Input name="name_kana" defaultValue={resident?.name_kana ?? ""} placeholder="ヤマダ タロウ" />
          </Field>
          <Field label="年齢">
            <Input name="age" defaultValue={resident?.age != null ? String(resident.age) : ""} inputMode="numeric" />
          </Field>
          <Field label="性別">
            <Select name="gender" defaultValue={resident?.gender ?? ""}>
              <option value="">未選択</option>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
            </Select>
          </Field>
          <Field label="要介護度">
            <Select name="care_level" defaultValue={resident?.care_level ?? ""}>
              <option value="">未選択</option>
              {CARE_LEVELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="ステータス" required>
            <Select name="status" defaultValue={resident?.status ?? "scheduled"}>
              {RESIDENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {/* 入居先 */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">入居先</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="施設">
            <Select
              name="facility_id"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
            >
              <option value="">未選択</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="部屋">
            {/* key で施設変更時にリセット（別施設の部屋IDが残るのを防ぐ） */}
            <Select key={facilityId} name="room_id" defaultValue={resident?.room_id ?? ""} disabled={!facilityId}>
              <option value="">未選択</option>
              {roomOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.room_number}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {/* 入退去・費用 */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">入退去・費用</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="契約日">
            <Input type="date" name="contract_date" defaultValue={resident?.contract_date ?? ""} />
          </Field>
          <Field label="入居日">
            <Input type="date" name="admission_date" defaultValue={resident?.admission_date ?? ""} />
          </Field>
          <Field label="退去日">
            <Input type="date" name="move_out_date" defaultValue={resident?.move_out_date ?? ""} />
          </Field>
          <Field label="月額費用（円）">
            <Input name="monthly_fee" defaultValue={resident?.monthly_fee != null ? String(resident.monthly_fee) : ""} inputMode="numeric" placeholder="150000" />
          </Field>
        </div>
      </div>

      {/* 連絡先 */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-ink">保証人・連絡先</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="身元保証人">
            <Input name="guarantor" defaultValue={resident?.guarantor ?? ""} placeholder="山田 花子（長女）" />
          </Field>
          <Field label="緊急連絡先">
            <Input name="emergency_contact" defaultValue={resident?.emergency_contact ?? ""} placeholder="090-0000-0000" />
          </Field>
        </div>
      </div>

      <Field label="メモ">
        <Textarea name="note" rows={3} defaultValue={resident?.note ?? ""} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : resident ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
