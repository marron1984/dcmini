"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader({
  phone,
  lineUrl,
}: {
  phone: string;
  lineUrl: string;
}) {
  // スクロールに反応して影と背景の不透明度を強める
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300",
        scrolled
          ? "border-slate-200/70 bg-white/90 shadow-soft"
          : "border-transparent bg-white/70"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white shadow-soft transition-transform group-hover:scale-105">
            DC
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">{SITE_NAME}</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${phone.replace(/[^0-9]/g, "")}`}
            data-cv="phone"
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-brand-700 hover:bg-brand-50 sm:flex"
          >
            <Phone className="h-5 w-5" />
            <span className="font-bold tracking-tight">{phone}</span>
          </a>
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cv="line"
            className="flex items-center gap-1.5 rounded-xl bg-[#06C755] px-3.5 py-2 text-sm font-bold text-white shadow-soft hover:shadow-lift hover:brightness-105 active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            LINE相談
          </a>
          <a
            href="/#contact"
            className="hidden rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-brand-700 hover:shadow-lift active:scale-[0.98] sm:block"
          >
            無料で相談
          </a>
        </div>
      </div>
    </header>
  );
}
