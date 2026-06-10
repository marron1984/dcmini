import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { getPublishedArticle, getPublishedArticleSlugs } from "@/lib/data/public";
import { getSiteSettings } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { articleLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getPublishedArticle(params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `/column/${params.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getPublishedArticle(params.slug);
  if (!article) notFound();

  const settings = await getSiteSettings();
  const tel = settings.phone_number.replace(/[^0-9]/g, "");
  const paragraphs = (article.body ?? "").split(/\n{2,}/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 pb-12">
      <JsonLd
        data={articleLd({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          image: article.cover_image_url,
          publishedAt: article.published_at ?? article.created_at,
          updatedAt: article.updated_at,
        })}
      />
      <Breadcrumbs
        className="-mx-0 pb-6 pt-6 text-xs text-ink-muted"
        items={[
          { name: "コラム", path: "/column" },
          { name: article.title, path: `/column/${article.slug}` },
        ]}
      />
      <Link href="/column" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> コラム一覧へ戻る
      </Link>

      {article.category && (
        <Badge className="border-brand-100 bg-brand-50 text-brand-700">{article.category}</Badge>
      )}
      <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
        {article.title}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{formatDate(article.published_at)}</p>

      {article.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.cover_image_url} alt={article.title} className="mt-6 w-full rounded-2xl object-cover" />
      )}

      <div className="mt-8 space-y-4 leading-relaxed text-ink-soft">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">{p}</p>
          ))
        ) : (
          <p className="text-ink-muted">本文は準備中です。</p>
        )}
      </div>

      {/* 記事末のCTA */}
      <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-brand-50 p-8 text-center">
        <p className="text-lg font-bold text-ink">介護施設探しでお困りですか？</p>
        <p className="text-sm text-ink-soft">専門スタッフが無料でご相談をお受けします。</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/#contact" className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">
            無料で相談する
          </Link>
          <a href={`tel:${tel}`} data-cv="phone" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-6 font-bold text-brand-700 hover:bg-brand-50">
            <Phone className="h-5 w-5" />{settings.phone_number}
          </a>
          <a href={settings.line_url} target="_blank" rel="noopener noreferrer" data-cv="line" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#06C755] px-6 font-bold text-white hover:opacity-90">
            <MessageCircle className="h-5 w-5" />LINE相談
          </a>
        </div>
      </div>
    </article>
  );
}
