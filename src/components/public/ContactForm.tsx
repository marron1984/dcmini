"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CARE_LEVELS } from "@/lib/constants";
import { submitContact } from "@/app/(public)/actions";

function YesNo({ name, label }: { name: string; label: string }) {
  return (
    <Field label={label}>
      <Select name={name} defaultValue="">
        <option value="">未選択</option>
        <option value="yes">あり</option>
        <option value="no">なし</option>
      </Select>
    </Field>
  );
}

export function ContactForm({ lpName }: { lpName?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [utm, setUtm] = useState<Record<string, string>>({});

  // 流入情報（UTM / gclid）をURLから取得して hidden で送る
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const get = (k: string) => p.get(k) ?? "";
    setUtm({
      utm_source: get("utm_source"),
      utm_medium: get("utm_medium"),
      utm_campaign: get("utm_campaign"),
      utm_term: get("utm_term"),
      utm_content: get("utm_content"),
      gclid: get("gclid"),
      lp_name: get("lp") || lpName || "トップページ",
    });
  }, [lpName]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitContact(formData);
      if (res.ok) {
        // CV1 計測フック
        (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
          event: "contact_submit",
        });
        router.push("/thanks");
      } else {
        setError(res.error ?? "送信に失敗しました。");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* hidden 流入情報 */}
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {/* ハニーポット */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-base font-bold text-ink">
          ご相談者さまについて
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="お名前" required>
            <Input name="consultant_name" required placeholder="山田 太郎" />
          </Field>
          <Field label="フリガナ">
            <Input name="consultant_name_kana" placeholder="ヤマダ タロウ" />
          </Field>
          <Field label="電話番号">
            <Input
              name="consultant_phone"
              type="tel"
              inputMode="tel"
              placeholder="09012345678"
            />
          </Field>
          <Field label="メールアドレス">
            <Input
              name="consultant_email"
              type="email"
              placeholder="example@email.com"
            />
          </Field>
          <Field label="ご本人との続柄">
            <Input name="relationship" placeholder="長男 / 配偶者 など" />
          </Field>
          <Field label="お住まい・相談地域">
            <Input name="consultant_area" placeholder="大阪市西淀川区 など" />
          </Field>
        </div>
        <p className="text-xs text-ink-muted">
          ※ 電話番号またはメールアドレスのいずれかをご入力ください。
        </p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-bold text-ink">
          入居予定者さまについて
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="お名前">
            <Input name="resident_name" placeholder="山田 花子" />
          </Field>
          <Field label="年齢">
            <Input name="resident_age" inputMode="numeric" placeholder="85" />
          </Field>
          <Field label="性別">
            <Select name="resident_gender" defaultValue="">
              <option value="">未選択</option>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
            </Select>
          </Field>
          <Field label="現在の居住地">
            <Input name="resident_current_area" placeholder="自宅 / 病院 など" />
          </Field>
          <Field label="要介護度">
            <Select name="care_level" defaultValue="">
              <option value="">未選択</option>
              {CARE_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="希望入居時期">
            <Input
              name="desired_move_in_date"
              placeholder="できるだけ早く / 来月中 など"
            />
          </Field>
          <YesNo name="dementia_status" label="認知症の有無" />
          <YesNo name="welfare_status" label="生活保護の有無" />
          <YesNo name="medical_needs" label="医療行為の有無" />
          <YesNo name="mental_illness" label="精神疾患の有無" />
          <YesNo name="has_guarantor" label="身元保証人の有無" />
          <Field label="月額予算（円）">
            <Input name="budget" inputMode="numeric" placeholder="130000" />
          </Field>
          <Field label="希望地域" className="sm:col-span-2">
            <Input name="desired_area" placeholder="大阪市内 / 〇〇区周辺 など" />
          </Field>
        </div>
      </fieldset>

      <Field label="ご相談内容">
        <Textarea
          name="note"
          rows={5}
          placeholder="お困りごとやご希望を自由にご記入ください。"
        />
      </Field>

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "送信中..." : "この内容で無料相談する"}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          ご入力いただいた個人情報は、ご相談対応の目的にのみ利用します。
        </p>
      </div>
    </form>
  );
}
