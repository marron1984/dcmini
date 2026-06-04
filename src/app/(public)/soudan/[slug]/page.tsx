import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Check } from "lucide-react";
import { CONCERN_CATEGORIES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/auth";
import { ContactForm } from "@/components/public/ContactForm";

// 悩み別の個別LP（7. 各カテゴリは個別LP化できる構造）
// MVPではカテゴリごとの定型コンテンツを保持。第2フェーズでlp_pagesテーブル化を想定。
const LP_CONTENT: Record<
  string,
  { catch: string; audience: string[]; solutions: string[] }
> = {
  dementia: {
    catch: "認知症が進み、自宅での介護が難しくなった方へ",
    audience: ["認知症の診断を受けている", "徘徊・昼夜逆転がある", "介護拒否で対応が難しい"],
    solutions: ["認知症対応可の施設をご紹介", "症状に合うケア体制をご提案", "ご家族の負担軽減をサポート"],
  },
  welfare: {
    catch: "生活保護を受けている方の入居相談",
    audience: ["生活保護を受給している", "費用面で施設を諦めていた", "受け入れ先が見つからない"],
    solutions: ["生活保護対応の施設をご紹介", "予算内で入れる住まいを提案", "手続き面もサポート"],
  },
  "no-family": {
    catch: "身寄りがない・保証人がいない方の入居相談",
    audience: ["身元保証人がいない", "頼れる家族が近くにいない", "おひとり様で不安"],
    solutions: ["保証会社対応の施設をご紹介", "身元保証のご事情に配慮", "入居手続きを丁寧にサポート"],
  },
  "post-discharge": {
    catch: "退院後すぐの住まい探しはお任せください",
    audience: ["退院日が迫っている", "自宅に戻るのが難しい", "急いで施設を探したい"],
    solutions: ["退院日に合わせて迅速対応", "医療連携のある施設を提案", "見学・入居までスピード調整"],
  },
  medical: {
    catch: "医療対応が必要な方の施設探し",
    audience: ["インスリン・在宅酸素が必要", "たん吸引・胃ろうがある", "看護体制を重視したい"],
    solutions: ["医療対応可の施設をご紹介", "必要なケアに合う体制を確認", "看取り対応施設もご提案"],
  },
  "low-cost": {
    catch: "介護費用を抑えたい方の住まい探し",
    audience: ["月額費用を抑えたい", "年金の範囲で入りたい", "初期費用が心配"],
    solutions: ["予算に合う施設をご紹介", "費用の内訳を分かりやすく説明", "無理のないプランをご提案"],
  },
  "high-care": {
    catch: "要介護度が高い方も安心の施設探し",
    audience: ["要介護4・5である", "手厚い介護が必要", "今の施設で対応が難しい"],
    solutions: ["重度対応可の施設をご紹介", "介護体制を事前に確認", "状態に合う住まいをご提案"],
  },
  mental: {
    catch: "精神疾患がある方の入居相談",
    audience: ["精神科に通院している", "受け入れ先が限られている", "対応可能な施設を探したい"],
    solutions: ["精神疾患に理解のある施設を紹介", "通院体制を含めて確認", "ご本人に合う環境をご提案"],
  },
};

export function generateStaticParams() {
  return CONCERN_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = CONCERN_CATEGORIES.find((c) => c.slug === params.slug);
  if (!cat) return {};
  return { title: cat.label };
}

export default async function SoudanLpPage({
  params,
}: {
  params: { slug: string };
}) {
  const cat = CONCERN_CATEGORIES.find((c) => c.slug === params.slug);
  const content = LP_CONTENT[params.slug];
  if (!cat || !content) notFound();

  const settings = await getSiteSettings();
  const tel = settings.phone_number.replace(/[^0-9]/g, "");

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white px-4 py-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-hero-grid [background-size:24px_24px] opacity-50" />
        <div className="relative mx-auto max-w-3xl text-center animate-fade-up">
          <p className="inline-block rounded-full border border-brand-100 bg-white/80 px-4 py-1.5 text-sm font-bold text-brand-700 shadow-soft backdrop-blur">
            {cat.label}
          </p>
          <h1 className="mt-5 text-2xl font-bold leading-[1.25] tracking-tight text-ink sm:text-4xl">
            {content.catch}
          </h1>
          <p className="mt-4 text-ink-soft">
            専門スタッフが無料でご相談をお受けします。お気軽にお問い合わせください。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#contact" className="inline-flex h-14 items-center justify-center rounded-xl bg-brand-600 px-7 text-lg font-bold text-white shadow-lift transition-all hover:bg-brand-700 hover:-translate-y-0.5 active:scale-[0.98]">
              無料で相談する
            </a>
            <a href={`tel:${tel}`} data-cv="phone" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-7 text-lg font-bold text-brand-700 shadow-soft backdrop-blur transition-all hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.98]">
              <Phone className="h-5 w-5" /> 電話で相談
            </a>
            <a href={settings.line_url} target="_blank" rel="noopener noreferrer" data-cv="line" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-7 text-lg font-bold text-white shadow-soft transition-all hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.98]">
              <MessageCircle className="h-5 w-5" /> LINE相談
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-ink">こんな方へ</h2>
            <ul className="mt-4 space-y-3">
              {content.audience.map((a) => (
                <li key={a} className="flex items-start gap-2 text-ink-soft">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-accent-50/50 p-6 shadow-soft">
            <h2 className="text-lg font-bold text-ink">解決できること</h2>
            <ul className="mt-4 space-y-3">
              {content.solutions.map((s) => (
                <li key={s} className="flex items-start gap-2 text-ink-soft">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="section-eyebrow">無料相談フォーム</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              この内容でご相談する
            </h2>
          </div>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ContactForm />
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
