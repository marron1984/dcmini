import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { getSiteSettings } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      {/* キーボード利用者向けスキップリンク */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:font-bold focus:text-white focus:shadow-lift"
      >
        本文へスキップ
      </a>
      <SiteHeader phone={settings.phone_number} lineUrl={settings.line_url} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter phone={settings.phone_number} businessHours={settings.business_hours} />
    </div>
  );
}
