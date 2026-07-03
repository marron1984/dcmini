import { describe, it, expect } from "vitest";
import {
  abs,
  parseHours,
  localBusinessLd,
  breadcrumbLd,
  faqLd,
  articleLd,
  serviceLd,
  SITE_URL,
} from "@/lib/seo";

describe("abs", () => {
  it("相対パスを絶対URLに変換する", () => {
    expect(abs("/column")).toBe(`${SITE_URL}/column`);
    expect(abs("/")).toBe(SITE_URL);
  });
  it("絶対URLはそのまま返す", () => {
    expect(abs("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("parseHours", () => {
  it("『9:00〜18:00』を opens/closes に分解しゼロ埋めする", () => {
    expect(parseHours("9:00〜18:00")).toEqual({ opens: "09:00", closes: "18:00" });
  });
  it("不正な文字列は null", () => {
    expect(parseHours("年中無休")).toBeNull();
    expect(parseHours(null)).toBeNull();
  });
});

describe("localBusinessLd", () => {
  it("LocalBusiness 型・電話・無料相談・対応エリアを含む", () => {
    const ld = localBusinessLd({ phone: "0120-000-000", businessHours: "9:00〜18:00" });
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.telephone).toBe("0120-000-000");
    expect(ld.priceRange).toBe("¥0");
    expect(Array.isArray(ld.areaServed)).toBe(true);
    expect(ld.openingHoursSpecification).toBeTruthy();
  });
  it("営業時間が不正なら openingHoursSpecification を出さない", () => {
    const ld = localBusinessLd({ phone: "0120", businessHours: "不明" });
    expect("openingHoursSpecification" in ld).toBe(false);
  });
});

describe("breadcrumbLd", () => {
  it("position を1始まりで採番し item を絶対URL化する", () => {
    const ld = breadcrumbLd([
      { name: "ホーム", path: "/" },
      { name: "コラム", path: "/column" },
    ]);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[1].item).toBe(`${SITE_URL}/column`);
  });
});

describe("faqLd / serviceLd / articleLd", () => {
  it("faqLd は Question/Answer 構造になる", () => {
    const ld = faqLd([{ q: "無料ですか？", a: "はい無料です" }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity[0].acceptedAnswer.text).toBe("はい無料です");
  });
  it("serviceLd は無料(price 0)のOfferを持つ", () => {
    const ld = serviceLd();
    expect(ld.offers.price).toBe("0");
    expect(ld.offers.priceCurrency).toBe("JPY");
  });
  it("articleLd は mainEntityOfPage に記事URLを設定する", () => {
    const ld = articleLd({ title: "費用の話", slug: "cost", publishedAt: "2026-06-01" });
    expect(ld["@type"]).toBe("BlogPosting");
    expect((ld.mainEntityOfPage as { "@id": string })["@id"]).toBe(
      `${SITE_URL}/column/cost`
    );
  });
});
