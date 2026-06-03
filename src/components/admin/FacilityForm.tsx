"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CARE_LEVELS, MEDICAL_SUPPORT_OPTIONS } from "@/lib/constants";
import { upsertFacility } from "@/app/admin/actions";
import type { Facility } from "@/lib/types";

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-ink-soft">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
      {label}
    </label>
  );
}

export function FacilityForm({ facility }: { facility?: Facility }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertFacility(fd);
      if (res.ok) router.push("/admin/facilities");
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {facility && <input type="hidden" name="id" value={facility.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="施設名" required className="sm:col-span-2">
          <Input name="name" defaultValue={facility?.name ?? ""} required />
        </Field>
        <Field label="施設種別">
          <Input name="type" defaultValue={facility?.type ?? ""} placeholder="住宅型有料老人ホーム など" />
        </Field>
        <Field label="エリア">
          <Input name="area" defaultValue={facility?.area ?? ""} placeholder="大阪市西淀川区" />
        </Field>
        <Field label="所在地" className="sm:col-span-2">
          <Input name="address" defaultValue={facility?.address ?? ""} />
        </Field>
        <Field label="最寄駅">
          <Input name="nearest_station" defaultValue={facility?.nearest_station ?? ""} />
        </Field>
        <Field label="定員">
          <Input name="capacity" defaultValue={facility?.capacity?.toString() ?? ""} />
        </Field>
        <Field label="月額費用（円）">
          <Input name="monthly_fee" defaultValue={facility?.monthly_fee?.toString() ?? ""} />
        </Field>
        <Field label="初期費用（円）">
          <Input name="initial_fee" defaultValue={facility?.initial_fee?.toString() ?? ""} />
        </Field>
        <Field label="対応可能介護度">
          <Select name="max_care_level" defaultValue={facility?.max_care_level ?? ""}>
            <option value="">未設定</option>
            {CARE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">対応可否</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Check name="accepts_dementia" label="認知症対応" defaultChecked={facility?.accepts_dementia} />
          <Check name="accepts_welfare" label="生活保護対応" defaultChecked={facility?.accepts_welfare} />
          <Check name="end_of_life_care" label="看取り対応" defaultChecked={facility?.end_of_life_care} />
          <Check name="is_published" label="公開する" defaultChecked={facility?.is_published} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">医療対応項目</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MEDICAL_SUPPORT_OPTIONS.map((m) => (
            <label key={m} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="medical_support"
                value={m}
                defaultChecked={facility?.medical_support?.includes(m)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      <Field label="紹介文">
        <Textarea name="description" rows={3} defaultValue={facility?.description ?? ""} />
      </Field>
      <Field label="管理メモ">
        <Textarea name="note" rows={2} defaultValue={facility?.note ?? ""} />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : facility ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
