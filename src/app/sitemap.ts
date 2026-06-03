import type { MetadataRoute } from "next";
import { CONCERN_CATEGORIES } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1 },
  ];
  for (const c of CONCERN_CATEGORIES) {
    routes.push({
      url: `${base}/soudan/${c.slug}`,
      lastModified: now,
      priority: 0.8,
    });
  }
  return routes;
}
