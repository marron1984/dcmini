import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export function SiteHeader({
  phone,
  lineUrl,
}: {
  phone: string;
  lineUrl: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
            DC
          </span>
          <span className="text-lg font-bold text-ink">{SITE_NAME}</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${phone.replace(/[^0-9]/g, "")}`}
            data-cv="phone"
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-brand-700 hover:bg-brand-50 sm:flex"
          >
            <Phone className="h-5 w-5" />
            <span className="font-bold">{phone}</span>
          </a>
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cv="line"
            className="flex items-center gap-1.5 rounded-xl bg-[#06C755] px-3 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            LINE相談
          </a>
          <a
            href="#contact"
            className="hidden rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 sm:block"
          >
            無料で相談
          </a>
        </div>
      </div>
    </header>
  );
}
