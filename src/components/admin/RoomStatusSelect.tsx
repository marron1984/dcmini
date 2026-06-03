"use client";

import { useTransition } from "react";
import { ROOM_STATUSES, ROOM_STATUS_MAP } from "@/lib/constants";
import { updateRoomStatus } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/types";

// 14. 空室更新は管理画面から即時反映
export function RoomStatusSelect({
  roomId,
  status,
}: {
  roomId: string;
  status: RoomStatus;
}) {
  const [isPending, startTransition] = useTransition();
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as RoomStatus;
    startTransition(async () => {
      await updateRoomStatus(roomId, next);
    });
  }
  return (
    <select
      defaultValue={status}
      onChange={onChange}
      disabled={isPending}
      className={cn(
        "rounded-full border-transparent px-2.5 py-1 text-xs font-semibold focus:outline-none",
        ROOM_STATUS_MAP[status].color
      )}
    >
      {ROOM_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
