"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REFERRER_TYPES } from "@/lib/constants";
import { upsertReferrer } from "@/app/admin/actions";
import type { Referrer } from "@/lib/types";

export function ReferrerForm({ referrer }: { referrer?: Referrer }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertReferrer(fd);
      if (res.ok) router.push("/admin/referrers");
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {referrer && <input type="hidden" name="id" value={referrer.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="紹介元種別" required>
          <Select name="type" defaultValue={referrer?.type ?? "care_manager"}>
            {REFERRER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="紹介元名" required>
          <Input name="name" defaultValue={referrer?.name ?? ""} required placeholder="〇〇居宅介護支援事業所" />
        </Field>
        <Field label="担当者名">
          <Input name="contact_person" defaultValue={referrer?.contact_person ?? ""} />
        </Field>
        <Field label="電話番号">
          <Input name="phone" defaultValue={referrer?.phone ?? ""} />
        </Field>
        <Field label="メール">
          <Input name="email" defaultValue={referrer?.email ?? ""} />
        </Field>
        <Field label="最終接触日">
          <Input type="date" name="last_contacted_at" defaultValue={referrer?.last_contacted_at ?? ""} />
        </Field>
        <Field label="所在地" className="sm:col-span-2">
          <Input name="address" defaultValue={referrer?.address ?? ""} />
        </Field>
      </div>

      <Field label="営業メモ">
        <Textarea name="note" rows={3} defaultValue={referrer?.note ?? ""} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : referrer ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
