"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors",
              active === t.id ? "text-brand-700" : "text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
            )}
          </button>
        ))}
      </div>
      <div className="animate-fade-in">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
