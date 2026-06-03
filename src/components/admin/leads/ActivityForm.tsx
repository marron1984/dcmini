"use client";

import { useRef, useState, useTransition } from "react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { addActivity } from "@/app/admin/actions";

export function ActivityForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addActivity(leadId, fd);
      if (res.ok) formRef.current?.reset();
      else setError(res.error ?? "登録に失敗しました");
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="種別">
          <Select name="activity_type" defaultValue="note">
            {ACTIVITY_TYPES.filter((a) => a.value !== "status_change").map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="次回アクション日">
          <Input type="date" name="next_action_date" />
        </Field>
      </div>
      <Field label="内容">
        <Textarea name="content" rows={3} placeholder="対応内容・通話メモなどを記録" required />
      </Field>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "登録中..." : "履歴を追加"}
      </Button>
    </form>
  );
}
