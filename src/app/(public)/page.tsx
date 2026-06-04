import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Brain,
  HandCoins,
  UserRound,
  BedDouble,
  Stethoscope,
  PiggyBank,
  Accessibility,
  HeartPulse,
  ClipboardList,
  Search,
  CalendarCheck,
  Home,
  ShieldCheck,
  HeartHandshake,
  Wallet,
} from "lucide-react";
import { CONCERN_CATEGORIES, SITE_NAME, HOME_FAQ } from "@/lib/constants";
import { getSiteSettings } from "@/lib/auth";
import { getPublishedFacilities } from "@/lib/data/public";
import { ContactForm } from "@/components/public/ContactForm";
import { FacilityCard } from "@/components/public/FacilityCard";
import { Faq } from "@/components/public/Faq";
import { JsonLd } from "@/components/JsonLd";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  HandCoins,
  UserRound,
  BedDouble,
  Stethoscope,
  PiggyBank,
  Accessibility,
  HeartPulse,
};

export default async function HomePage() {
  const settings = await getSiteSettings();
  const facilities = await getPublishedFacilities();
  const tel = settings.phone_number.replace(/[^0-9]/g, "");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      {/* 1. ファーストビュー */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        {/* 装飾: 背景のグラデーションブロブとドットグリッド */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:24px_24px] opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-4 py-1.5 text-sm font-bold text-brand-700 shadow-soft backdrop-blur">
              <HeartHandshake className="h-4 w-4" />
              介護施設探しの無料相談窓口
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-[1.2] tracking-tight text-ink sm:text-4xl lg:text-[3.25rem]">
              介護施設探しで
              <br />
              <span className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">
                お困りではありませんか？
              </span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              認知症・生活保護・身寄りなし・退院後の住まい探しまで、
              専門スタッフが<strong className="text-brand-700">無料</strong>でご相談をお受けします。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#contact"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-lg font-bold text-white shadow-lift transition-all hover:bg-brand-700 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                無料で相談する
              </Link>
              <a
                href={`tel:${tel}`}
                data-cv="phone"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-7 text-lg font-bold text-brand-700 shadow-soft backdrop-blur transition-all hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Phone className="h-5 w-5" />
                電話で相談する
              </a>
              <a
                href={settings.line_url}
                target="_blank"
                rel="noopener noreferrer"
                data-cv="line"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-7 text-lg font-bold text-white shadow-soft transition-all hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                LINEで相談する
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-ink-soft">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent-500" /> 相談無料
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent-500" /> 強引な勧誘なし
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent-500" /> 専門スタッフ対応
              </span>
            </div>
          </div>
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/50 to-accent-200/40 blur-2xl" />
            <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lift backdrop-blur">
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-600">
                <Phone className="h-4 w-4" />お電話でのご相談
              </p>
              <a
                href={`tel:${tel}`}
                data-cv="phone"
                className="mt-2 block text-4xl font-bold tracking-tight text-ink transition-colors hover:text-brand-700"
              >
                {settings.phone_number}
              </a>
              <p className="mt-1 text-sm text-ink-muted">受付時間 {settings.business_hours}</p>
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm text-ink-soft">
                {[
                  "ご希望やご事情をお伺いします",
                  "条件に合う施設をご提案します",
                  "見学のご調整までサポートします",
                ].map((t, i) => (
                  <p key={i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-soft">
                      {i + 1}
                    </span>
                    {t}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 悩み別相談導線 */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="section-eyebrow">お悩みから相談する</p>
          <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
            こんなお悩みはありませんか？
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CONCERN_CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon] ?? HeartPulse;
            return (
              <Link
                key={c.slug}
                href={`/soudan/${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 ring-1 ring-brand-100 transition-all group-hover:from-brand-500 group-hover:to-brand-700 group-hover:text-white group-hover:ring-brand-300">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold leading-snug text-ink">
                  {c.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. 特徴 */}
      <section className="bg-brand-50/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="section-eyebrow">{SITE_NAME}の特徴</p>
            <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
              安心してご相談いただける3つの理由
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: "ご相談はすべて無料",
                desc: "ヒアリングから施設提案、見学調整まで、費用は一切いただきません。",
              },
              {
                icon: HeartHandshake,
                title: "難しいケースもご相談可",
                desc: "認知症・生活保護・医療対応・身寄りなしなど、幅広い状況に対応します。",
              },
              {
                icon: ShieldCheck,
                title: "ご事情に寄り添う提案",
                desc: "ご本人とご家族の希望を丁寧にお伺いし、無理のないご提案をします。",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft transition-transform group-hover:scale-105">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 対応できる相談内容 */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="section-eyebrow">対応できる相談内容</p>
          <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
            こんなご相談に対応しています
          </h2>
        </div>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {[
            "どんな施設が合うのか分からない",
            "費用をできるだけ抑えたい",
            "認知症が進んで自宅介護が難しい",
            "生活保護でも入れる施設を知りたい",
            "退院日までに住まいを決めたい",
            "医療対応ができる施設を探している",
            "身元保証人がいなくて困っている",
            "遠方に住む親の施設を探したい",
          ].map((t) => (
            <p
              key={t}
              className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink-soft"
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              {t}
            </p>
          ))}
        </div>
      </section>

      {/* 5. 入居までの流れ */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="section-eyebrow">ご相談から入居まで</p>
            <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
              入居までの流れ
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ClipboardList, t: "①ご相談", d: "フォーム・電話・LINEでお気軽に。" },
              { icon: Search, t: "②ヒアリング・提案", d: "ご希望に合う施設をご提案。" },
              { icon: CalendarCheck, t: "③見学", d: "見学日程をスタッフが調整。" },
              { icon: Home, t: "④申込・入居", d: "契約・入居までサポート。" },
            ].map((s, i, arr) => (
              <div key={s.t} className="relative rounded-2xl border border-slate-200/70 bg-white p-6 text-center shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-card">
                {/* PCで横のコネクタ */}
                {i < arr.length - 1 && (
                  <span className="pointer-events-none absolute right-0 top-12 hidden h-px w-6 translate-x-full bg-gradient-to-r from-brand-300 to-transparent lg:block" />
                )}
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-brand-600 ring-1 ring-brand-100">
                  <s.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-bold text-ink">{s.t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 施設・住宅一覧 */}
      {facilities.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <p className="section-eyebrow">施設・住宅一覧</p>
            <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
              ご紹介できる施設の一例
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <FacilityCard key={f.id} facility={f} />
            ))}
          </div>
        </section>
      )}

      {/* 7. よくある質問 */}
      <section id="faq" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="section-eyebrow">よくある質問</p>
            <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
              よくいただくご質問
            </h2>
          </div>
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      {/* 8. 相談フォーム */}
      <section id="contact" className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <p className="section-eyebrow">無料相談フォーム</p>
            <h2 className="heading-underline text-2xl font-bold text-ink sm:text-3xl">
              まずはお気軽にご相談ください
            </h2>
            <p className="mt-3 text-ink-soft">
              分かる範囲でご記入ください。専門スタッフが折り返しご連絡します。
            </p>
          </div>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* 9. LINE相談導線 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            LINEでも気軽にご相談いただけます
          </h2>
          <p className="text-brand-100">
            メッセージを送るだけ。スタッフがチャットでお答えします。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={settings.line_url}
              target="_blank"
              rel="noopener noreferrer"
              data-cv="line"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-8 text-lg font-bold text-white shadow-lift transition-all hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <MessageCircle className="h-5 w-5" />
              LINEで相談する
            </a>
            <a
              href={`tel:${tel}`}
              data-cv="phone"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-8 text-lg font-bold text-brand-700 shadow-lift transition-all hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              {settings.phone_number}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
