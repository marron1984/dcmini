"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/input";
import { setLeadChannel } from "@/app/admin/actions";
import { LEAD_CHANNELS } from "@/lib/constants";
import type { LeadChannel } from "@/lib/types";

// 案件の流入チャネル（WEB集客 / 地域連携 / ケアマネ紹介 など）を設定。
// チャネル別の集客・成約KPIの集計根拠になる。
export function ChannelSelect({
  leadId,
  channel,
}: {
  leadId: string;
  channel: LeadChannel | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = (e.target.value || null) as LeadChannel | null;
    startTransition(async () => {
      const res = await setLeadChannel(leadId, value);
      setMsg(res.ok ? "更新しました" : res.error ?? "更新に失敗しました");
    });
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink-soft">流入チャネル</span>
        <Select defaultValue={channel ?? ""} onChange={onChange} disabled={isPending}>
          <option value="">未分類</option>
          {LEAD_CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </label>
      {msg && <p role="status" className="mt-1 text-xs font-semibold text-emerald-600">{msg}</p>}
    </div>
  );
}
