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
      <SiteHeader phone={settings.phone_number} lineUrl={settings.line_url} />
      <main className="flex-1">{children}</main>
      <SiteFooter phone={settings.phone_number} businessHours={settings.business_hours} />
    </div>
  );
}
