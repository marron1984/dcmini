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
      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                selected ? "text-brand-700" : "text-ink-muted hover:text-ink"
              )}
            >
              {t.label}
              {selected && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-400" />
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="animate-fade-in"
      >
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
