"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

// モバイル専用: ヒーローを過ぎたら下からスライドインする固定CTAバー。
// 電話・LINE・相談フォームへの導線を常時表示し、CVを取りこぼさない。
export function MobileCtaBar({
  phone,
  lineUrl,
}: {
  phone: string;
  lineUrl: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tel = phone.replace(/[^0-9]/g, "");

  return (
    <>
      {/* 固定バーがフッター末尾を覆わないためのスペーサー */}
      <div aria-hidden="true" className="h-20 lg:hidden" />

      <div
        aria-hidden={!visible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur transition-transform duration-300 lg:hidden",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(16,24,40,0.08)]",
          visible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`tel:${tel}`}
            data-cv="phone"
            tabIndex={visible ? 0 : -1}
            className="flex h-12 flex-col items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-700 active:scale-[0.97]"
          >
            <Phone className="h-4 w-4" />
            <span className="text-[11px] font-bold">電話で相談</span>
          </a>
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cv="line"
            tabIndex={visible ? 0 : -1}
            className="flex h-12 flex-col items-center justify-center rounded-xl bg-[#06C755] text-white active:scale-[0.97]"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[11px] font-bold">LINE相談</span>
          </a>
          <Link
            href="/#contact"
            tabIndex={visible ? 0 : -1}
            className="flex h-12 flex-col items-center justify-center rounded-xl bg-brand-600 text-white active:scale-[0.97]"
          >
            <PenLine className="h-4 w-4" />
            <span className="text-[11px] font-bold">フォーム</span>
          </Link>
        </div>
      </div>
    </>
  );
}
