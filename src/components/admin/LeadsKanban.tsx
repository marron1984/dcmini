"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { KANBAN_STATUSES, LEAD_STATUS_MAP } from "@/lib/constants";
import { updateLeadStatus } from "@/app/admin/actions";
import { cn, relativeTime } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/types";

const COLUMNS: LeadStatus[] = [...KANBAN_STATUSES, "lost", "on_hold"];

// ドラッグ&ドロップでステータスを変更できるカンバン。
// 楽観更新で即座に移動し、サーバー側で失敗したら元の列に戻す。
export function LeadsKanban({ leads, canEdit = true }: { leads: Lead[]; canEdit?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // 楽観更新の上書きステータス（lead.id → status）
  const [overrides, setOverrides] = useState<Record<string, LeadStatus>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<LeadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusOf = (l: Lead): LeadStatus => overrides[l.id] ?? l.status;

  function handleDrop(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDropCol(null);
    setDragId(null);
    if (!id) return;

    const lead = leads.find((l) => l.id === id);
    if (!lead || statusOf(lead) === status) return;

    const prev = statusOf(lead);
    setError(null);
    setOverrides((o) => ({ ...o, [id]: status }));

    startTransition(async () => {
      try {
        const res = await updateLeadStatus(id, status);
        if (res.ok) {
          router.refresh();
          return;
        }
        setOverrides((o) => ({ ...o, [id]: prev }));
        setError(res.error ?? "ステータスの更新に失敗しました");
      } catch {
        // 権限なし等でアクションが例外を投げた場合も元の列へロールバック
        setOverrides((o) => ({ ...o, [id]: prev }));
        setError("ステータスを変更する権限がありません");
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-ink-muted">
          {canEdit
            ? "カードをドラッグすると、ステータスを変更できます。"
            : "閲覧のみ（ステータス変更の権限がありません）。"}
        </p>
        {error && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => {
          const items = leads.filter((l) => statusOf(l) === status);
          const isTarget = dropCol === status;
          return (
            <div key={status} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-bold text-ink">
                  {LEAD_STATUS_MAP[status].label}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-ink-soft">
                  {items.length}
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dropCol !== status) setDropCol(status);
                }}
                onDragLeave={(e) => {
                  // 子要素間の移動では発火させない
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropCol(null);
                  }
                }}
                onDrop={(e) => canEdit && handleDrop(e, status)}
                className={cn(
                  "min-h-[120px] space-y-2 rounded-2xl p-2 transition-colors duration-150",
                  isTarget
                    ? "bg-brand-50 ring-2 ring-inset ring-brand-400"
                    : "bg-slate-100"
                )}
              >
                {items.map((l) => (
                  <Link
                    key={l.id}
                    href={`/admin/leads/${l.id}`}
                    draggable={canEdit}
                    onDragStart={(e) => {
                      if (!canEdit) return;
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", l.id);
                      setDragId(l.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropCol(null);
                    }}
                    className={cn(
                      "group block cursor-grab rounded-xl border border-slate-200 bg-white p-3 transition-all hover:shadow-card active:cursor-grabbing",
                      dragId === l.id && "rotate-1 opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-ink">{l.consultant_name}</p>
                      <GripVertical className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
                    </div>
                    {l.resident_name && (
                      <p className="text-xs text-ink-muted">入居予定: {l.resident_name}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.care_level && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink-soft">{l.care_level}</span>
                      )}
                      {l.dementia_status && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-700">認知症</span>}
                      {l.welfare_status && <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700">生保</span>}
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">{relativeTime(l.created_at)}</p>
                  </Link>
                ))}
                {items.length === 0 && !isTarget && (
                  <p className="px-2 py-3 text-center text-xs text-ink-muted">なし</p>
                )}
                {items.length === 0 && isTarget && (
                  <p className="px-2 py-3 text-center text-xs font-semibold text-brand-600">
                    ここにドロップ
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
