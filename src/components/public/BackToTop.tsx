"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// 長いページ用の「上へ戻る」フローティングボタン。
// モバイルでは固定CTAバーと重ならないよう少し高めに配置する。
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="ページ上部へ戻る"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-ink-soft shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-700 hover:shadow-lift",
        "bottom-24 lg:bottom-6",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
