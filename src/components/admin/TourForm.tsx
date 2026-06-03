"use client";

import { useRef, useState, useTransition } from "react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TOUR_RESULTS } from "@/lib/constants";
import { upsertTour } from "@/app/admin/actions";
import type { AppUser, Facility, Lead, Tour } from "@/lib/types";

// 15. 見学管理。lead固定（案件詳細）/ lead選択（見学一覧）両対応。
export function TourForm({
  fixedLeadId,
  leads,
  facilities,
  staff,
  tour,
  onDone,
}: {
  fixedLeadId?: string;
  leads?: Pick<Lead, "id" | "consultant_name" | "resident_name">[];
  facilities: Pick<Facility, "id" | "name">[];
  staff: AppUser[];
  tour?: Tour;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toLocal = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertTour(fd);
      if (res.ok) {
        formRef.current?.reset();
        onDone?.();
      } else setError(res.error ?? "登録に失敗しました");
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {tour && <input type="hidden" name="id" value={tour.id} />}

      {fixedLeadId ? (
        <input type="hidden" name="lead_id" value={fixedLeadId} />
      ) : (
        <Field label="案件" required>
          <Select name="lead_id" defaultValue={tour?.lead_id ?? ""} required>
            <option value="">案件を選択</option>
            {leads?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.consultant_name}
                {l.resident_name ? `（${l.resident_name}）` : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="施設">
          <Select name="facility_id" defaultValue={tour?.facility_id ?? ""}>
            <option value="">未定</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="見学日時">
          <Input type="datetime-local" name="scheduled_at" defaultValue={toLocal(tour?.scheduled_at)} />
        </Field>
        <Field label="担当者">
          <Select name="staff_id" defaultValue={tour?.staff_id ?? ""}>
            <option value="">未割当</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="参加者">
          <Input name="participants" defaultValue={tour?.participants ?? ""} placeholder="ご本人・長男 など" />
        </Field>
        <Field label="集合場所">
          <Input name="meeting_place" defaultValue={tour?.meeting_place ?? ""} />
        </Field>
        <Field label="結果・感触">
          <Select name="result" defaultValue={tour?.result ?? "pending"}>
            {TOUR_RESULTS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="次回アクション">
        <Input name="next_action" defaultValue={tour?.next_action ?? ""} />
      </Field>
      <Field label="見学後メモ">
        <Textarea name="note" rows={2} defaultValue={tour?.note ?? ""} />
      </Field>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "保存中..." : tour ? "見学を更新" : "見学を登録"}
      </Button>
    </form>
  );
}
