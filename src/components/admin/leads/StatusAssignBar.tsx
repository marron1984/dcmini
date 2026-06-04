"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/constants";
import { updateLeadStatus, assignLead } from "@/app/admin/actions";
import type { AppUser, LeadStatus } from "@/lib/types";

export function StatusAssignBar({
  leadId,
  status,
  assignedUserId,
  staff,
}: {
  leadId: string;
  status: LeadStatus;
  assignedUserId: string | null;
  staff: AppUser[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as LeadStatus;
    startTransition(async () => {
      const res = await updateLeadStatus(leadId, value);
      setMsg(res.ok ? "ステータスを更新しました" : res.error ?? "更新に失敗しました");
      if (res.ok) router.refresh();
    });
  }

  function onAssign(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    startTransition(async () => {
      const res = await assignLead(leadId, value);
      setMsg(res.ok ? "担当者を更新しました" : res.error ?? "更新に失敗しました");
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="mb-1.5 block text-sm font-semibold text-ink-soft">ステータス</span>
        <Select defaultValue={status} onChange={onStatus} disabled={isPending}>
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </label>
      <label className="flex-1">
        <span className="mb-1.5 block text-sm font-semibold text-ink-soft">担当者</span>
        <Select defaultValue={assignedUserId ?? ""} onChange={onAssign} disabled={isPending}>
          <option value="">未割当</option>
          {staff.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </label>
      {msg && (
        <p role="status" className="pb-2.5 text-xs font-semibold text-emerald-600">{msg}</p>
      )}
    </div>
  );
}
