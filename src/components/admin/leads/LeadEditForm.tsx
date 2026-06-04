"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CARE_LEVELS } from "@/lib/constants";
import { updateLeadFields } from "@/app/admin/actions";
import type { Lead } from "@/lib/types";

function boolToStr(v: boolean | null): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "";
}

function YesNo({ name, label, value }: { name: string; label: string; value: boolean | null }) {
  return (
    <Field label={label}>
      <Select name={name} defaultValue={boolToStr(value)}>
        <option value="">未選択</option>
        <option value="yes">あり</option>
        <option value="no">なし</option>
      </Select>
    </Field>
  );
}

export function LeadEditForm({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateLeadFields(lead.id, fd);
      setMsg(res.ok ? "保存しました" : res.error ?? "保存に失敗しました");
      // サマリーや施設マッチングのスコアを最新化
      if (res.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-bold text-brand-700">相談者情報</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="お名前"><Input name="consultant_name" defaultValue={lead.consultant_name} /></Field>
          <Field label="フリガナ"><Input name="consultant_name_kana" defaultValue={lead.consultant_name_kana ?? ""} /></Field>
          <Field label="電話番号"><Input name="consultant_phone" defaultValue={lead.consultant_phone ?? ""} /></Field>
          <Field label="メール"><Input name="consultant_email" defaultValue={lead.consultant_email ?? ""} /></Field>
          <Field label="続柄"><Input name="relationship" defaultValue={lead.relationship ?? ""} /></Field>
          <Field label="相談地域"><Input name="consultant_area" defaultValue={lead.consultant_area ?? ""} /></Field>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-brand-700">入居予定者情報</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="お名前"><Input name="resident_name" defaultValue={lead.resident_name ?? ""} /></Field>
          <Field label="年齢"><Input name="resident_age" defaultValue={lead.resident_age?.toString() ?? ""} /></Field>
          <Field label="性別">
            <Select name="resident_gender" defaultValue={lead.resident_gender ?? ""}>
              <option value="">未選択</option>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
            </Select>
          </Field>
          <Field label="現在の居住地"><Input name="resident_current_area" defaultValue={lead.resident_current_area ?? ""} /></Field>
          <Field label="要介護度">
            <Select name="care_level" defaultValue={lead.care_level ?? ""}>
              <option value="">未選択</option>
              {CARE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="希望入居時期"><Input name="desired_move_in_date" defaultValue={lead.desired_move_in_date ?? ""} /></Field>
          <YesNo name="dementia_status" label="認知症" value={lead.dementia_status} />
          <YesNo name="welfare_status" label="生活保護" value={lead.welfare_status} />
          <YesNo name="medical_needs" label="医療行為" value={lead.medical_needs} />
          <YesNo name="mental_illness" label="精神疾患" value={lead.mental_illness} />
          <YesNo name="has_guarantor" label="身元保証人" value={lead.has_guarantor} />
          <Field label="月額予算（円）"><Input name="budget" defaultValue={lead.budget?.toString() ?? ""} /></Field>
          <Field label="希望地域" className="sm:col-span-2"><Input name="desired_area" defaultValue={lead.desired_area ?? ""} /></Field>
        </div>
      </div>

      <Field label="相談内容・メモ">
        <Textarea name="note" rows={4} defaultValue={lead.note ?? ""} />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "保存中..." : "保存する"}</Button>
        {msg && <span className="text-sm font-semibold text-emerald-600">{msg}</span>}
      </div>
    </form>
  );
}
