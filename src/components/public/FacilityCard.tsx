import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MapPin, Train } from "lucide-react";
import type { Facility } from "@/lib/types";
import { formatYen } from "@/lib/utils";

export function FacilityCard({ facility }: { facility: Facility }) {
  const vacant =
    facility.rooms?.filter((r) => r.status === "vacant").length ?? null;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-accent-50/60">
        {facility.photo_urls?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={facility.photo_urls[0]}
            alt={facility.name}
            width={400}
            height={240}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // 写真未登録時は施設の受付イメージを表示
          <Image
            src="/images/facility-reception.png"
            alt={`${facility.name}のイメージ`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-bold text-ink">{facility.name}</h3>
          {facility.type && (
            <p className="text-sm text-ink-muted">{facility.type}</p>
          )}
        </div>
        <div className="space-y-1 text-sm text-ink-soft">
          {facility.area && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-500" />
              {facility.area}
            </p>
          )}
          {facility.nearest_station && (
            <p className="flex items-center gap-1.5">
              <Train className="h-4 w-4 text-brand-500" />
              {facility.nearest_station}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {facility.accepts_dementia && (
            <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
              認知症対応
            </Badge>
          )}
          {facility.accepts_welfare && (
            <Badge className="border-teal-200 bg-teal-50 text-teal-700">
              生活保護対応
            </Badge>
          )}
          {facility.end_of_life_care && (
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">
              看取り対応
            </Badge>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-xs text-ink-muted">月額費用</p>
            <p className="text-lg font-bold text-brand-700">
              {formatYen(facility.monthly_fee)}〜
            </p>
          </div>
          {vacant !== null && (
            <Badge
              className={
                vacant > 0
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }
            >
              空室 {vacant}室
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
