import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { getSiteSettings } from "@/lib/auth";
import { SITE_URL, organizationLd, websiteLd, localBusinessLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 介護施設・高齢者住宅の無料入居相談【大阪】`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "老人ホーム 大阪",
    "介護施設 相談",
    "老人ホーム紹介 無料",
    "サ高住 大阪",
    "認知症 老人ホーム",
    "生活保護 老人ホーム",
    "身寄りなし 老人ホーム",
    "退院後 施設探し",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <html lang="ja">
      <body>
        {/* 全ページ共通の構造化データ（運営者・サイト・地域ビジネス） */}
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
        <JsonLd
          data={localBusinessLd({
            phone: settings.phone_number,
            businessHours: settings.business_hours,
          })}
        />
        {children}
        <Analytics
          gaId={settings.ga_id}
          gtmId={settings.gtm_id}
          adsId={settings.google_ads_id}
        />
      </body>
    </html>
  );
}
