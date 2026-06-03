"use client";

import { useState } from "react";
import { Plus, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TourForm } from "@/components/admin/TourForm";
import { TourResultBadge } from "@/components/admin/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import type { AppUser, Facility, Lead, Tour } from "@/lib/types";

export function ToursManager({
  tours,
  leads,
  facilities,
  staff,
}: {
  tours: Tour[];
  leads: Pick<Lead, "id" | "consultant_name" | "resident_name">[];
  facilities: Pick<Facility, "id" | "name">[];
  staff: AppUser[];
}) {
  const [open, setOpen] = useState(false);

  const now = Date.now();
  const upcoming = tours.filter(
    (t) => t.scheduled_at && new Date(t.scheduled_at).getTime() >= now
  );
  const past = tours.filter(
    (t) => !t.scheduled_at || new Date(t.scheduled_at).getTime() < now
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" variant={open ? "outline" : "primary"} onClick={() => setOpen(!open)}>
          <Plus className="h-4 w-4" />見学を登録
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent>
            <TourForm
              leads={leads}
              facilities={facilities}
              staff={staff}
              onDone={() => setOpen(false)}
            />
          </CardContent>
        </Card>
      )}

      <TourList title="今後の見学予定" tours={upcoming} empty="予定されている見学はありません。" />
      <TourList title="過去の見学" tours={past} empty="過去の見学はありません。" />
    </div>
  );
}

function TourList({
  title,
  tours,
  empty,
}: {
  title: string;
  tours: Tour[];
  empty: string;
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
        <CalendarCheck className="h-5 w-5 text-brand-500" />
        {title}
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-ink-soft">{tours.length}</span>
      </h2>
      {tours.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-ink-muted">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">
          {tours.map((t) => (
            <div key={t.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-ink">
                  {t.lead?.consultant_name ?? "—"}
                  {t.lead?.resident_name && (
                    <span className="ml-1 text-sm font-normal text-ink-muted">（{t.lead.resident_name}）</span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">
                  {t.facility?.name ?? "施設未定"} ・ {formatDateTime(t.scheduled_at)}
                </p>
                {t.note && <p className="mt-1 text-xs text-ink-muted">{t.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                {t.staff?.name && <span className="text-xs text-ink-muted">担当: {t.staff.name}</span>}
                <TourResultBadge result={t.result} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
