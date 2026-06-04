import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { getSiteSettings } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | 介護施設・高齢者住宅の無料入居相談`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
  },
  robots: { index: true, follow: true },
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
