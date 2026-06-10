import Link from "next/link";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Phone, MessageCircle, ShieldCheck, HeartHandshake, Wallet } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { getSiteSettings } from "@/lib/auth";

export const metadata = {
  alternates: { canonical: "/about" },
  title: "運営者情報",
  description: `${SITE_NAME}の運営者情報・サービス概要です。`,
};

// ※ 実際の運営者情報に置き換えてください（管理者が編集）。
const COMPANY_ROWS: { label: string; value: string }[] = [
  { label: "サービス名", value: SITE_NAME },
  { label: "運営会社", value: "（運営会社名を記載してください）" },
  { label: "所在地", value: "（所在地を記載してください）" },
  { label: "代表者", value: "（代表者名を記載してください）" },
  { label: "事業内容", value: "介護施設・高齢者住宅への入居相談、紹介支援" },
  { label: "対応エリア", value: "大阪市内およびその周辺" },
];

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const tel = settings.phone_number.replace(/[^0-9]/g, "");
  return (
    <>
      <Breadcrumbs items={[{ name: "運営者情報", path: "/about" }]} />
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <div className="text-center">
        <p className="section-eyebrow justify-center">運営者情報</p>
        <h1 className="heading-underline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {SITE_NAME}について
        </h1>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-soft">
          私たちは、介護施設探しでお困りのご本人・ご家族が、安心して相談できる窓口を目指しています。
          紹介会社まかせにせず、ご事情に寄り添った住まい探しを無料でサポートします。
        </p>
      </div>

      {/* 強み */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Wallet, t: "相談はすべて無料", d: "ご提案から見学調整まで費用は不要です。" },
          { icon: HeartHandshake, t: "難しいケースも対応", d: "認知症・生活保護・医療対応もご相談可。" },
          { icon: ShieldCheck, t: "無理な勧誘なし", d: "ご希望を尊重し、丁寧にご提案します。" },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-bold text-ink">{f.t}</h3>
            <p className="mt-1 text-sm text-ink-soft">{f.d}</p>
          </div>
        ))}
      </div>

      {/* 会社概要 */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-ink">サービス概要</h2>
        </div>
        <dl className="divide-y divide-slate-100">
          {COMPANY_ROWS.map((r) => (
            <div key={r.label} className="flex flex-col gap-1 px-6 py-3.5 sm:flex-row sm:gap-6">
              <dt className="w-32 shrink-0 text-sm font-semibold text-ink-muted">{r.label}</dt>
              <dd className="text-sm text-ink">{r.value}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-1 px-6 py-3.5 sm:flex-row sm:gap-6">
            <dt className="w-32 shrink-0 text-sm font-semibold text-ink-muted">お問い合わせ</dt>
            <dd className="text-sm text-ink">
              <a href={`tel:${tel}`} data-cv="phone" className="font-bold text-brand-700 hover:underline">
                {settings.phone_number}
              </a>
              <span className="ml-2 text-ink-muted">（受付 {settings.business_hours}）</span>
            </dd>
          </div>
        </dl>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-50 to-accent-50/60 p-8 text-center">
        <p className="text-lg font-bold text-ink">まずはお気軽にご相談ください</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/#contact" className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-6 font-bold text-white shadow-soft transition-all hover:bg-brand-700 active:scale-[0.98]">
            無料で相談する
          </Link>
          <a href={`tel:${tel}`} data-cv="phone" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-6 font-bold text-brand-700 shadow-soft transition-all hover:bg-brand-50 active:scale-[0.98]">
            <Phone className="h-5 w-5" />電話で相談
          </a>
          <a href={settings.line_url} target="_blank" rel="noopener noreferrer" data-cv="line" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-6 font-bold text-white shadow-soft transition-all hover:brightness-105 active:scale-[0.98]">
            <MessageCircle className="h-5 w-5" />LINE相談
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
