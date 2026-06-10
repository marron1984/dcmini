"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, ShieldCheck, PhoneCall, ChevronDown } from "lucide-react";
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

      {/* 入力負荷を下げる安心メッセージ（CVR向上） */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-brand-50/70 px-4 py-3 text-xs font-semibold text-brand-800">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />入力は30秒・あとはお任せ</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />相談無料・勧誘なし</span>
        <span className="flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5" />最短当日にご連絡</span>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* 必須は最小限。詳細は任意（または電話で）に分離して離脱を防ぐ */}
      <fieldset className="space-y-4">
        <legend className="text-base font-bold text-ink">ご連絡先（これだけでOK）</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="お名前" required>
            <Input name="consultant_name" required placeholder="山田 太郎" />
          </Field>
          <Field label="電話番号">
            <Input
              name="consultant_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09012345678"
            />
          </Field>
          <Field label="メールアドレス" className="sm:col-span-2">
            <Input
              name="consultant_email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
            />
          </Field>
        </div>
        <p className="text-xs text-ink-muted">
          ※ 電話番号またはメールアドレスのいずれかをご入力ください。
        </p>
      </fieldset>

      <Field label="ご相談内容（任意）">
        <Textarea
          name="note"
          rows={4}
          placeholder="お困りごとやご希望を自由にご記入ください。空欄でも、こちらから丁寧にお伺いします。"
        />
      </Field>

      {/* 詳細は折りたたみ。開かなくても送信できる（任意） */}
      <details className="group rounded-2xl border border-slate-200 bg-slate-50/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-ink">
          <span className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-brand-500 transition-transform group-open:rotate-180" />
            入居予定者さまの詳細を入力する（任意）
          </span>
          <span className="text-xs font-normal text-ink-muted">わかる範囲でOK</span>
        </summary>
        <div className="space-y-4 border-t border-slate-200/70 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="フリガナ">
              <Input name="consultant_name_kana" placeholder="ヤマダ タロウ" />
            </Field>
            <Field label="ご本人との続柄">
              <Input name="relationship" placeholder="長男 / 配偶者 など" />
            </Field>
            <Field label="入居予定者のお名前">
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
        </div>
      </details>

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "送信中..." : "無料で相談する（かんたん30秒）"}
        </Button>
        <p className="flex items-center justify-center gap-1 text-center text-xs text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-500" />
          ご入力内容はご相談対応の目的にのみ利用します（
          <Link href="/privacy" className="underline hover:text-ink">プライバシーポリシー</Link>
          ）。
        </p>
      </div>
    </form>
  );
}
