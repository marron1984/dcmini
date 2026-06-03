"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "相談は本当に無料ですか？",
    a: "はい、ご相談・施設のご提案・見学の調整まで、すべて無料でご利用いただけます。",
  },
  {
    q: "認知症や生活保護でも入居できる施設はありますか？",
    a: "対応可能な施設をご紹介できます。状況をお伺いし、条件に合う住まいをご提案します。",
  },
  {
    q: "退院が近く、急いで探しています。対応できますか？",
    a: "お急ぎの場合もご相談ください。退院後の住まい探しを多数サポートしてきました。",
  },
  {
    q: "身寄りがなく、保証人がいなくても大丈夫ですか？",
    a: "身元保証のご事情も含めてご相談いただけます。対応可能な施設をお探しします。",
  },
  {
    q: "医療的なケアが必要ですが相談できますか？",
    a: "インスリン・在宅酸素・たん吸引などの医療対応が可能な施設もご紹介可能です。",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-bold text-ink">{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-brand-500 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <p className="border-t border-slate-100 px-5 py-4 text-ink-soft">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
