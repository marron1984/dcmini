import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd } from "@/lib/seo";

// パンくず: 視覚的ナビ＋BreadcrumbList構造化データ。
// items は { name, path } の配列。先頭にホームを自動付与する。
export function Breadcrumbs({
  items,
  className,
}: {
  items: { name: string; path: string }[];
  className?: string;
}) {
  const all = [{ name: "ホーム", path: "/" }, ...items];
  return (
    <nav
      aria-label="パンくずリスト"
      className={
        className ?? "mx-auto max-w-6xl px-4 pt-6 text-xs text-ink-muted"
      }
    >
      <JsonLd data={breadcrumbLd(all)} />
      <ol className="flex flex-wrap items-center gap-1">
        {all.map((it, i) => {
          const last = i === all.length - 1;
          return (
            <li key={it.path} className="flex items-center gap-1">
              {last ? (
                <span className="font-semibold text-ink-soft" aria-current="page">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path} className="hover:text-brand-700">
                  {it.name}
                </Link>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
