import type { MetadataRoute } from "next";

// 32. 管理画面は外部から検索されないこと / 公開ページはSEO対応
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/thanks"],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
