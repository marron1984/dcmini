"use client";

import { useState, useTransition } from "react";
import { Input, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addProposal } from "@/app/admin/actions";
import type { Facility } from "@/lib/types";

export function ProposalForm({
  leadId,
  facilities,
}: {
  leadId: string;
  facilities: Pick<Facility, "id" | "name">[];
}) {
  const [facilityId, setFacilityId] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!facilityId) {
      setError("施設を選択してください");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addProposal(leadId, facilityId, note);
      if (res.ok) {
        setFacilityId("");
        setNote("");
      } else setError(res.error ?? "登録に失敗しました");
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <Field label="施設">
        <Select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
          <option value="">施設を選択</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="提案メモ">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="提案理由など" />
      </Field>
      <Button type="button" size="sm" onClick={submit} disabled={isPending}>
        {isPending ? "追加中..." : "提案施設を追加"}
      </Button>
    </div>
  );
}
