import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter({ phone }: { phone: string }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                DC
              </span>
              <span className="text-base font-bold text-ink">{SITE_NAME}</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-ink-muted">
              介護施設・高齢者住宅・サポート付き住宅への入居を、専門スタッフが無料でサポートします。
            </p>
          </div>
          <div className="text-sm text-ink-soft">
            <p className="font-bold">お電話でのご相談</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">{phone}</p>
            <p className="mt-1 text-ink-muted">受付時間 9:00〜18:00</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE_NAME}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/vacancies" className="hover:text-ink">空室・施設情報</Link>
            <Link href="/column" className="hover:text-ink">コラム</Link>
            <Link href="/#faq" className="hover:text-ink">よくある質問</Link>
            <Link href="/#contact" className="hover:text-ink">相談フォーム</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
