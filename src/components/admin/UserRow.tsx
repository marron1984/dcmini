"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { USER_ROLES } from "@/lib/constants";
import { updateUserRole, toggleUserActive } from "@/app/admin/actions";
import type { AppUser } from "@/lib/types";

export function UserRow({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.is_active);
  const [msg, setMsg] = useState<string | null>(null);

  function onRole(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setMsg(null);
    startTransition(async () => {
      const res = await updateUserRole(user.id, next);
      if (res.ok) setRole(next as AppUser["role"]);
      else setMsg(res.error ?? "更新に失敗しました");
    });
  }

  function onToggle() {
    setMsg(null);
    startTransition(async () => {
      const res = await toggleUserActive(user.id, !active);
      if (res.ok) setActive(!active);
      else setMsg(res.error ?? "更新に失敗しました");
    });
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3">
        <p className="font-semibold text-ink">
          {user.name}
          {isSelf && <span className="ml-1 text-xs text-brand-600">(自分)</span>}
        </p>
        <p className="text-xs text-ink-muted">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <Select value={role} onChange={onRole} disabled={isPending} className="h-9 w-36">
          {USER_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </td>
      <td className="px-4 py-3">
        {active ? (
          <Badge className="border-green-200 bg-green-50 text-green-700">有効</Badge>
        ) : (
          <Badge className="border-slate-200 bg-slate-100 text-slate-500">無効</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onToggle}
          disabled={isPending || (isSelf && active)}
          className="text-sm font-semibold text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
        >
          {active ? "無効化" : "有効化"}
        </button>
        {msg && <p className="text-xs text-red-600">{msg}</p>}
      </td>
    </tr>
  );
}
