"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/input";
import { assignReferrer } from "@/app/admin/actions";
import type { Referrer } from "@/lib/types";

// 案件に紹介元を紐づける（紹介元別の成績集計に利用）
export function ReferrerSelect({
  leadId,
  referrerId,
  referrers,
}: {
  leadId: string;
  referrerId: string | null;
  referrers: Pick<Referrer, "id" | "name">[];
}) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    startTransition(async () => {
      const res = await assignReferrer(leadId, value);
      setMsg(res.ok ? "更新しました" : res.error ?? "更新に失敗しました");
    });
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink-soft">紹介元</label>
      <Select defaultValue={referrerId ?? ""} onChange={onChange} disabled={isPending}>
        <option value="">未設定</option>
        {referrers.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </Select>
      {msg && <p className="mt-1 text-xs font-semibold text-emerald-600">{msg}</p>}
    </div>
  );
}
