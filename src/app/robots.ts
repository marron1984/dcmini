import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// 32. 管理画面は外部から検索されないこと / 公開ページはSEO対応
// ベースURLは seo.ts の SITE_URL に一元化（env未設定時のフォールバック含め一致させる）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/thanks"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
