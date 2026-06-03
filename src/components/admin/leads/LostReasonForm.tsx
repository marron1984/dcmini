"use client";

import { useState, useTransition } from "react";
import { Input, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LOST_REASONS } from "@/lib/constants";
import { setLostReason } from "@/app/admin/actions";

// 31. 失注理由管理 + 再アプローチ予定日
export function LostReasonForm({
  leadId,
  currentReason,
  currentReapproach,
}: {
  leadId: string;
  currentReason: string | null;
  currentReapproach: string | null;
}) {
  const [reason, setReason] = useState(currentReason ?? "");
  const [date, setDate] = useState(currentReapproach ?? "");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit() {
    if (!reason) {
      setMsg("失注理由を選択してください");
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const res = await setLostReason(leadId, reason, date || null);
      setMsg(res.ok ? "失注として登録しました" : res.error ?? "登録に失敗しました");
    });
  }

  return (
    <div className="space-y-3">
      <Field label="失注理由">
        <Select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">選択してください</option>
          {LOST_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
      </Field>
      <Field label="再アプローチ予定日">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="button" variant="danger" size="sm" onClick={submit} disabled={isPending}>
          {isPending ? "登録中..." : "失注として登録"}
        </Button>
        {msg && <span className="text-sm font-semibold text-ink-soft">{msg}</span>}
      </div>
    </div>
  );
}
