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
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      <h1 className="mt-6 text-2xl font-bold text-ink sm:text-3xl">
        ご相談ありがとうございます
      </h1>
      <p className="mt-4 text-ink-soft">
        内容を確認のうえ、専門スタッフより折り返しご連絡いたします。
        <br />
        お急ぎの場合は、お電話・LINEでもご相談いただけます。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={`tel:${tel}`}
          data-cv="phone"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-7 text-lg font-bold text-brand-700 hover:bg-brand-50"
        >
          <Phone className="h-5 w-5" />
          {settings.phone_number}
        </a>
        <a
          href={settings.line_url}
          target="_blank"
          rel="noopener noreferrer"
          data-cv="line"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-7 text-lg font-bold text-white hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          LINEで相談する
        </a>
      </div>
      <Link href="/" className="mt-8 text-sm font-semibold text-brand-600 hover:underline">
        トップページへ戻る
      </Link>
    </div>
  );
}
