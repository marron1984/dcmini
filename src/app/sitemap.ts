import type { MetadataRoute } from "next";
import { CONCERN_CATEGORIES } from "@/lib/constants";
import { getPublishedLpSlugs, getPublishedArticleSlugs } from "@/lib/data/public";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/vacancies`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/column`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // 悩み別LP（集客の主要導線）
  for (const c of CONCERN_CATEGORIES) {
    routes.push({
      url: `${base}/soudan/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    });
  }

  // 公開中のLP（CMS）
  const lpSlugs = await getPublishedLpSlugs();
  for (const slug of lpSlugs) {
    routes.push({
      url: `${base}/lp/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // 公開中のコラム記事
  const articleSlugs = await getPublishedArticleSlugs();
  for (const slug of articleSlugs) {
    routes.push({
      url: `${base}/column/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return routes;
}
