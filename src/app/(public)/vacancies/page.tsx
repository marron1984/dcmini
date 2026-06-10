import Link from "next/link";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { getPublishedFacilities } from "@/lib/data/public";
import { getSiteSettings } from "@/lib/auth";
import { FacilityCard } from "@/components/public/FacilityCard";
import { Phone } from "lucide-react";

export const metadata = {
  alternates: { canonical: "/vacancies" },
  title: "空室・施設情報",
  description: "ご紹介可能な介護施設・高齢者住宅の空室情報をご覧いただけます。",
};

export default async function VacanciesPage() {
  const [facilities, settings] = await Promise.all([
    getPublishedFacilities(),
    getSiteSettings(),
  ]);
  const tel = settings.phone_number.replace(/[^0-9]/g, "");
  return (
    <>
      <Breadcrumbs items={[{ name: "空室・施設情報", path: "/vacancies" }]} />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-4">
      <div className="text-center">
        <p className="section-eyebrow">空室・施設情報</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          ご紹介できる施設・空室一覧
        </h1>
        <p className="mt-3 text-ink-soft">
          気になる施設がございましたら、お気軽にお問い合わせください。
        </p>
      </div>

      {facilities.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-ink-muted">
          現在公開中の施設情報はありません。お電話でお気軽にご相談ください。
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <FacilityCard key={f.id} facility={f} />
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-brand-50 p-8 text-center">
        <p className="text-lg font-bold text-ink">
          条件に合う施設をお探しします
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/#contact" className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">
            無料で相談する
          </Link>
          <a href={`tel:${tel}`} data-cv="phone" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-6 font-bold text-brand-700 hover:bg-brand-50">
            <Phone className="h-5 w-5" />{settings.phone_number}
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
