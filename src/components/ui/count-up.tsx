"use client";

import { useEffect, useState } from "react";

// 数値が0から目標値までカウントアップする表示。
// SSRでは最終値を描画し（SEO/非JS環境で値が見える）、マウント後にアニメーションする。
// prefers-reduced-motion の場合はアニメーションしない。
export function CountUp({
  value,
  suffix = "",
  duration = 700,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <>
      {display.toLocaleString("ja-JP")}
      {suffix}
    </>
  );
}
