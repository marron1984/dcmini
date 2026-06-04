"use client";

import { useState, useTransition } from "react";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSiteSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/auth";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSiteSettings(fd);
      if (res.ok) setMsg("設定を保存しました");
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {(msg || error) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? msg}
        </div>
      )}

      {/* 基本情報 / 連絡先 */}
      <section>
        <h2 className="mb-1 text-base font-bold text-ink">基本・連絡先</h2>
        <p className="mb-4 text-sm text-ink-muted">
          公開サイトのファーストビューやフッター、各CTAに反映されます。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="電話番号">
            <Input name="phone_number" defaultValue={settings.phone_number} placeholder="0120-000-000" />
          </Field>
          <Field label="受付時間">
            <Input name="business_hours" defaultValue={settings.business_hours} placeholder="9:00〜18:00" />
          </Field>
          <Field label="LINE 友だち追加URL" className="sm:col-span-2">
            <Input name="line_url" defaultValue={settings.line_url} placeholder="https://line.me/R/ti/p/@xxxx" />
          </Field>
        </div>
      </section>

      {/* 計測タグ */}
      <section>
        <h2 className="mb-1 text-base font-bold text-ink">計測・広告タグ連携</h2>
        <p className="mb-4 text-sm text-ink-muted">
          設定すると公開サイトにタグが自動で出力されます（空欄で無効）。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Google Analytics 測定ID">
            <Input name="ga_id" defaultValue={settings.ga_id} placeholder="G-XXXXXXXXXX" />
          </Field>
          <Field label="Google Tag Manager ID">
            <Input name="gtm_id" defaultValue={settings.gtm_id} placeholder="GTM-XXXXXXX" />
          </Field>
          <Field label="Google広告 コンバージョンID" className="sm:col-span-2">
            <Input name="google_ads_id" defaultValue={settings.google_ads_id} placeholder="AW-XXXXXXXXXX" />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "設定を保存"}
        </Button>
        {msg && <span className="text-sm font-semibold text-emerald-600">{msg}</span>}
      </div>
    </form>
  );
}
