"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createResidentFromLead } from "@/app/admin/actions";

// 入居が決まった案件を、入居者台帳に登録（または既存の入居者編集へ遷移）するボタン。
export function ResidentFromLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await createResidentFromLead(leadId);
      if (res.ok && res.id) router.push(`/admin/residents/${res.id}`);
      else setError(res.error ?? "登録に失敗しました");
    });
  }

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={isPending}>
        <BedDouble className="h-4 w-4" />
        {isPending ? "処理中..." : "入居者として登録"}
      </Button>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
