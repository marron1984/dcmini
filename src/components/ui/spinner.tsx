import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="読み込み中"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-brand-200 border-t-brand-600",
        className
      )}
    />
  );
}

// カード風のスケルトンプレースホルダ
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />
  );
}
