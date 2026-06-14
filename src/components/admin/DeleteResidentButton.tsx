"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteResident } from "@/app/admin/actions";

export function DeleteResidentButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <button
          onClick={() =>
            startTransition(async () => {
              await deleteResident(id);
              if (redirectTo) router.push(redirectTo);
            })
          }
          disabled={isPending}
          className="font-semibold text-red-600 hover:underline"
        >
          {isPending ? "削除中..." : "削除する"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-ink-muted hover:underline">
          取消
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-red-600"
      aria-label="削除"
    >
      <Trash2 className="h-4 w-4" /> 削除
    </button>
  );
}
