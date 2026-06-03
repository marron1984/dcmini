import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_MAP, ROOM_STATUS_MAP, TOUR_RESULT_MAP } from "@/lib/constants";
import type { LeadStatus, RoomStatus, TourResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const s = LEAD_STATUS_MAP[status];
  return <Badge className={cn(s.color)}>{s.label}</Badge>;
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const s = ROOM_STATUS_MAP[status];
  return <Badge className={cn("border-transparent", s.color)}>{s.label}</Badge>;
}

export function TourResultBadge({ result }: { result: TourResult }) {
  const s = TOUR_RESULT_MAP[result];
  return <Badge className={cn("border-transparent", s.color)}>{s.label}</Badge>;
}
