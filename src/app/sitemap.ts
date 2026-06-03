import type { MetadataRoute } from "next";
import { CONCERN_CATEGORIES } from "@/lib/constants";
import { getPublishedLpSlugs } from "@/lib/data/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/vacancies`, lastModified: now, priority: 0.7 },
  ];
  for (const c of CONCERN_CATEGORIES) {
    routes.push({
      url: `${base}/soudan/${c.slug}`,
      lastModified: now,
      priority: 0.8,
    });
  }
  // 公開中のLP（CMS）
  const lpSlugs = await getPublishedLpSlugs();
  for (const slug of lpSlugs) {
    routes.push({ url: `${base}/lp/${slug}`, lastModified: now, priority: 0.8 });
  }
  return routes;
}
