import Link from "next/link";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getPublishedArticles } from "@/lib/data/public";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = {
  alternates: { canonical: "/column" },
  title: "介護・施設探しのコラム",
  description: "介護施設探しや費用、認知症・生活保護などのお役立ち情報をお届けします。",
};

export default async function ColumnListPage() {
  const articles = await getPublishedArticles();
  return (
    <>
      <Breadcrumbs items={[{ name: "コラム", path: "/column" }]} />
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-4">
      <div className="text-center">
        <p className="section-eyebrow">お役立ちコラム</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">介護・施設探しのコラム</h1>
        <p className="mt-3 text-ink-soft">
          費用・認知症・生活保護・退院後の住まい探しなど、知っておきたい情報をまとめています。
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          記事は準備中です。
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/column/${a.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                {a.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cover_image_url} alt={a.title} width={400} height={144} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-brand-400">{a.category ?? "コラム"}</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                {a.category && (
                  <Badge className="w-fit border-brand-100 bg-brand-50 text-brand-700">{a.category}</Badge>
                )}
                <h2 className="font-bold leading-snug text-ink">{a.title}</h2>
                {a.excerpt && <p className="line-clamp-3 text-sm text-ink-soft">{a.excerpt}</p>}
                <p className="mt-auto pt-2 text-xs text-ink-muted">{formatDate(a.published_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
