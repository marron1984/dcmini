"use client";

import { useState, useTransition } from "react";
import { Check, X, AlertTriangle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addProposal } from "@/app/admin/actions";
import { formatYen, cn } from "@/lib/utils";

type ReasonLevel = "ok" | "partial" | "ng";

export interface MatchItem {
  facilityId: string;
  facilityName: string;
  type: string | null;
  area: string | null;
  monthlyFee: number | null;
  score: number;
  scoreColor: string;
  reasons: { label: string; level: ReasonLevel }[];
}

const REASON_STYLE: Record<ReasonLevel, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  ng: "bg-red-50 text-red-600",
};

export function MatchList({
  leadId,
  matches,
}: {
  leadId: string;
  matches: MatchItem[];
}) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        マッチング対象の施設がありません。施設を登録してください。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        相談者の条件（予算・エリア・要介護度・認知症・生活保護・医療対応・空室）をもとに適合度を算出しています。
      </p>
      {matches.map((m) => (
        <MatchCard key={m.facilityId} leadId={leadId} match={m} />
      ))}
    </div>
  );
}

function MatchCard({ leadId, match }: { leadId: string; match: MatchItem }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function propose() {
    startTransition(async () => {
      const res = await addProposal(leadId, match.facilityId, `適合度 ${match.score}%`);
      if (res.ok) setAdded(true);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{match.facilityName}</p>
          <p className="text-xs text-ink-muted">
            {match.type ?? "—"}
            {match.area ? ` / ${match.area}` : ""}
            {match.monthlyFee ? ` / ${formatYen(match.monthlyFee)}〜` : ""}
          </p>
        </div>
        <Badge className={cn("text-sm", match.scoreColor)}>適合度 {match.score}%</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {match.reasons.map((r, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              REASON_STYLE[r.level]
            )}
          >
            {r.level === "ok" ? (
              <Check className="h-3 w-3" />
            ) : r.level === "partial" ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {r.label}
          </span>
        ))}
      </div>

      <div className="mt-3">
        {added ? (
          <span className="text-sm font-semibold text-emerald-600">提案に追加しました</span>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={propose} disabled={isPending}>
            <Plus className="h-4 w-4" />提案に追加
          </Button>
        )}
      </div>
    </div>
  );
}
