import Link from "next/link";
import { Phone } from "lucide-react";
import { SITE_NAME, CONCERN_CATEGORIES } from "@/lib/constants";

export function SiteFooter({
  phone,
  businessHours = "9:00〜18:00",
}: {
  phone: string;
  businessHours?: string;
}) {
  const tel = phone.replace(/[^0-9]/g, "");
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* ブランド */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-soft">
                DC
              </span>
              <span className="text-base font-bold text-ink">{SITE_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              介護施設・高齢者住宅への入居を、専門スタッフが無料でサポートします。
            </p>
          </div>

          {/* 悩み別 */}
          <div>
            <p className="text-sm font-bold text-ink">お悩みから相談</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              {CONCERN_CATEGORIES.slice(0, 5).map((c) => (
                <li key={c.slug}>
                  <Link href={`/soudan/${c.slug}`} className="hover:text-brand-700">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* サイト内 */}
          <div>
            <p className="text-sm font-bold text-ink">サイト内</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              <li><Link href="/vacancies" className="hover:text-brand-700">空室・施設情報</Link></li>
              <li><Link href="/column" className="hover:text-brand-700">コラム</Link></li>
              <li><Link href="/about" className="hover:text-brand-700">運営者情報</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-700">プライバシーポリシー</Link></li>
            </ul>
          </div>

          {/* 連絡先 */}
          <div>
            <p className="text-sm font-bold text-ink">お電話でのご相談</p>
            <a href={`tel:${tel}`} data-cv="phone" className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-brand-700 hover:text-brand-800">
              <Phone className="h-5 w-5" />{phone}
            </a>
            <p className="mt-1 text-sm text-ink-muted">受付時間 {businessHours}</p>
            <Link href="/#contact" className="mt-3 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-soft transition-all hover:bg-brand-700 active:scale-[0.98]">
              無料で相談する
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-xs text-ink-muted">
          © {new Date().getFullYear()} {SITE_NAME}
        </div>
      </div>
    </footer>
  );
}
