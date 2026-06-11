import Link from "next/link";
import { CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/auth";

export const metadata = {
  title: "ご相談ありがとうございます",
  robots: { index: false, follow: false },
};

export default async function ThanksPage() {
  const settings = await getSiteSettings();
  const tel = settings.phone_number.replace(/[^0-9]/g, "");
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center animate-fade-up">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          ご相談ありがとうございます
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          内容を確認のうえ、専門スタッフより折り返しご連絡いたします。
          <br className="hidden sm:block" />
          お急ぎの場合は、お電話・LINEでもご相談いただけます。
        </p>

        <div className="mt-8 w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-7">
          <p className="text-sm font-bold text-brand-600">お急ぎの方はこちら</p>
          <a
            href={`tel:${tel}`}
            data-cv="phone"
            className="mt-1 block text-3xl font-bold tracking-tight text-ink transition-colors hover:text-brand-700"
          >
            {settings.phone_number}
          </a>
          <p className="mt-1 text-sm text-ink-muted">受付時間 {settings.business_hours}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={`tel:${tel}`}
              data-cv="phone"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-6 py-3 text-base font-bold text-brand-700 shadow-soft transition-all hover:bg-brand-50 active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              電話で相談
            </a>
            <a
              href={settings.line_url}
              target="_blank"
              rel="noopener noreferrer"
              data-cv="line"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-6 py-3 text-base font-bold text-white shadow-soft transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              LINEで相談
            </a>
          </div>
        </div>

        <Link href="/" className="mt-8 text-sm font-semibold text-brand-600 hover:underline">
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
