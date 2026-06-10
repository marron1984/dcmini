// =============================================================
// SEO: 構造化データ(JSON-LD)とURLのビルダー（純粋関数・テスト可能）
// 最新のリッチリザルト要件に対応（LocalBusiness / Service / Breadcrumb /
// FAQPage / BlogPosting / Organization / WebSite）。
// =============================================================

import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ORG_ID = `${SITE_URL}/#organization`;
const BUSINESS_ID = `${SITE_URL}/#business`;
const LOGO = `${SITE_URL}/icon.svg`;

// パス → 絶対URL
export function abs(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

// 「9:00〜18:00」等から営業時間を抽出（不正なら null）
export function parseHours(
  text: string | null | undefined
): { opens: string; closes: string } | null {
  if (!text) return null;
  const m = text.match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const pad = (s: string) => s.padStart(2, "0");
  return { opens: `${pad(m[1])}:${m[2]}`, closes: `${pad(m[3])}:${m[4]}` };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: LOGO,
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ja-JP",
    publisher: { "@id": ORG_ID },
  };
}

// 地域ビジネス（ローカルSEOの中核）。無料相談・対応エリア・営業時間を明示。
export function localBusinessLd(opts: {
  phone: string;
  businessHours?: string;
  areas?: string[];
}) {
  const hours = parseHours(opts.businessHours);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": BUSINESS_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: LOGO,
    telephone: opts.phone,
    priceRange: "無料相談",
    address: {
      "@type": "PostalAddress",
      addressRegion: "大阪府",
      addressCountry: "JP",
    },
    areaServed: (opts.areas ?? ["大阪市", "大阪府"]).map((name) => ({
      "@type": "City",
      name,
    })),
    ...(hours
      ? {
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
            opens: hours.opens,
            closes: hours.closes,
          },
        }
      : {}),
  };
}

// 提供サービス（無料の入居相談）
export function serviceLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "介護施設・高齢者住宅の入居相談",
    serviceType: "入居相談・施設紹介",
    description:
      "認知症・生活保護・身寄りなし・退院後の住まい探しに対応した、無料の入居相談サービス。",
    provider: { "@id": BUSINESS_ID },
    areaServed: "大阪府",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
      description: "ご相談・施設提案・見学調整まで無料",
    },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// パンくず（位置・名称・URLを付与）
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function articleLd(a: {
  title: string;
  slug: string;
  excerpt?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.excerpt ?? undefined,
    image: a.image ?? undefined,
    datePublished: a.publishedAt ?? undefined,
    dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
    inLanguage: "ja-JP",
    author: { "@id": ORG_ID, "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: LOGO },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": abs(`/column/${a.slug}`),
    },
  };
}
