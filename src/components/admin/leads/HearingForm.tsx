"use client";

import { useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HEARING_SECTIONS } from "@/lib/constants";
import { updateLeadHearing } from "@/app/admin/actions";

// 12. ヒアリング項目をセクションごとに入力。値は jsonb で保持。
export function HearingForm({
  leadId,
  initial,
}: {
  leadId: string;
  initial: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial ?? {});
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = (key: string, v: unknown) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateLeadHearing(leadId, values);
      setMsg(res.ok ? "ヒアリング内容を保存しました" : res.error ?? "保存に失敗しました");
    });
  }

  return (
    <div className="space-y-6">
      {HEARING_SECTIONS.map((section) => (
        <div key={section.key}>
          <h4 className="mb-3 text-sm font-bold text-brand-700">{section.title}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <label key={item.key} className="block">
                <span className="mb-1 block text-xs font-semibold text-ink-soft">
                  {item.label}
                </span>
                {item.type === "bool" ? (
                  <Select
                    value={(values[item.key] as string) ?? ""}
                    onChange={(e) => set(item.key, e.target.value)}
                  >
                    <option value="">未確認</option>
                    <option value="yes">あり</option>
                    <option value="no">なし</option>
                  </Select>
                ) : (
                  <Input
                    value={(values[item.key] as string) ?? ""}
                    onChange={(e) => set(item.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? "保存中..." : "ヒアリング内容を保存"}
        </Button>
        {msg && <span className="text-sm font-semibold text-emerald-600">{msg}</span>}
      </div>
    </div>
  );
}
