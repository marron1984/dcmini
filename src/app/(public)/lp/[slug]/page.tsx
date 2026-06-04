import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Check } from "lucide-react";
import { getPublishedLp, getPublishedLpSlugs } from "@/lib/data/public";
import { getSiteSettings } from "@/lib/auth";
import { ContactForm } from "@/components/public/ContactForm";
import { JsonLd } from "@/components/JsonLd";

// 第2フェーズ: DB(lp_pages)から動的に生成するGoogle広告用LP
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedLpSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const lp = await getPublishedLp(params.slug);
  if (!lp) return {};
  return {
    title: lp.title,
    description: lp.hero_copy ?? undefined,
  };
}

function toLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default async function DynamicLpPage({
  params,
}: {
  params: { slug: string };
}) {
  const lp = await getPublishedLp(params.slug);
  if (!lp) notFound();

  const settings = await getSiteSettings();
  const tel = settings.phone_number.replace(/[^0-9]/g, "");
  const audience = toLines(lp.target_audience);
  const problems = toLines(lp.problems);

  const faqJsonLd =
    lp.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: lp.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <section className="bg-gradient-to-b from-brand-50 to-white px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          {lp.target_keyword && (
            <p className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-bold text-brand-700">
              {lp.target_keyword}
            </p>
          )}
          <h1 className="mt-5 text-2xl font-bold leading-tight text-ink sm:text-4xl">
            {lp.hero_copy || lp.title}
          </h1>
          <p className="mt-4 text-ink-soft">
            専門スタッフが無料でご相談をお受けします。お気軽にお問い合わせください。
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#contact" className="inline-flex h-14 items-center justify-center rounded-xl bg-brand-600 px-7 text-lg font-bold text-white hover:bg-brand-700">
              無料で相談する
            </a>
            <a href={`tel:${tel}`} data-cv="phone" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-7 text-lg font-bold text-brand-700 hover:bg-brand-50">
              <Phone className="h-5 w-5" /> 電話で相談
            </a>
            <a href={settings.line_url} target="_blank" rel="noopener noreferrer" data-cv="line" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-7 text-lg font-bold text-white hover:opacity-90">
              <MessageCircle className="h-5 w-5" /> LINE相談
            </a>
          </div>
        </div>
      </section>

      {(audience.length > 0 || problems.length > 0) && (
        <section className="mx-auto max-w-4xl px-4 py-14">
          <div className="grid gap-8 md:grid-cols-2">
            {audience.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-ink">こんな方へ</h2>
                <ul className="mt-4 space-y-3">
                  {audience.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-ink-soft">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {problems.length > 0 && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
                <h2 className="text-lg font-bold text-ink">解決できること</h2>
                <ul className="mt-4 space-y-3">
                  {problems.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-ink-soft">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {lp.body && (
        <section className="mx-auto max-w-3xl px-4 pb-4">
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-6 leading-relaxed text-ink-soft">
            {lp.body}
          </div>
        </section>
      )}

      {lp.faq.length > 0 && (
        <section className="bg-slate-50 px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-ink">よくある質問</h2>
            <div className="mt-8 space-y-3">
              {lp.faq.map((f, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-bold text-ink">{f.q}</p>
                  <p className="mt-2 text-ink-soft">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="section-eyebrow">無料相談フォーム</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">この内容でご相談する</h2>
          </div>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ContactForm lpName={lp.title} />
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm font-semibold text-brand-600 hover:underline">
              トップページへ戻る
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
