import Link from "next/link";
import { Home, Search } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-4 text-center">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />

      <div className="relative animate-fade-up">
        <p className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-xl font-bold text-ink sm:text-2xl">
          ページが見つかりませんでした
        </h1>
        <p className="mt-3 text-ink-soft">
          お探しのページは移動または削除された可能性があります。
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-bold text-white shadow-lift transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            <Home className="h-5 w-5" />
            トップへ戻る
          </Link>
          <Link
            href="/column"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-6 font-bold text-brand-700 shadow-soft transition-all hover:bg-brand-50 active:scale-[0.98]"
          >
            <Search className="h-5 w-5" />
            コラムを見る
          </Link>
        </div>
        <p className="mt-10 text-xs text-ink-muted">{SITE_NAME}</p>
      </div>
    </div>
  );
}
