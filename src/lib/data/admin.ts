import { createClient } from "@/lib/supabase/server";
import type {
  Lead,
  LeadActivity,
  Facility,
  Room,
  Tour,
  AppUser,
  Referrer,
} from "@/lib/types";

// 共通: クエリ失敗時は空にフォールバック（Supabase未設定でもUIが表示される）
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export interface LeadFilters {
  q?: string;
  status?: string;
  assigned?: string;
  care_level?: string;
  welfare?: string;
  dementia?: string;
  area?: string;
  source?: string;
}

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  return safe(async () => {
    const supabase = createClient();
    let query = supabase
      .from("leads")
      .select("*, assigned_user:assigned_user_id(id, name)")
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.assigned) query = query.eq("assigned_user_id", filters.assigned);
    if (filters.care_level) query = query.eq("care_level", filters.care_level);
    if (filters.welfare === "yes") query = query.eq("welfare_status", true);
    if (filters.dementia === "yes") query = query.eq("dementia_status", true);
    if (filters.area) query = query.ilike("desired_area", `%${filters.area}%`);
    if (filters.source) query = query.eq("utm_source", filters.source);
    if (filters.q) {
      query = query.or(
        `consultant_name.ilike.%${filters.q}%,resident_name.ilike.%${filters.q}%,consultant_phone.ilike.%${filters.q}%`
      );
    }

    const { data } = await query.limit(500);
    return (data as Lead[]) ?? [];
  }, []);
}

export async function getLead(id: string): Promise<Lead | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("leads")
      .select("*, assigned_user:assigned_user_id(id, name)")
      .eq("id", id)
      .single();
    return (data as Lead) ?? null;
  }, null);
}

export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("lead_activities")
      .select("*, user:user_id(id, name)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    return (data as LeadActivity[]) ?? [];
  }, []);
}

export interface ProposalRow {
  id: string;
  note: string | null;
  created_at: string;
  facility: Pick<Facility, "id" | "name" | "monthly_fee" | "area"> | null;
}

export async function getLeadProposals(leadId: string): Promise<ProposalRow[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("lead_facility_proposals")
      .select("id, note, created_at, facility:facility_id(id, name, monthly_fee, area)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    return (data as unknown as ProposalRow[]) ?? [];
  }, []);
}

export async function getLeadTours(leadId: string): Promise<Tour[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tours")
      .select("*, facility:facility_id(id, name), staff:staff_id(id, name)")
      .eq("lead_id", leadId)
      .order("scheduled_at", { ascending: false });
    return (data as Tour[]) ?? [];
  }, []);
}

export async function getStaffUsers(): Promise<AppUser[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("is_active", true)
      .order("name");
    return (data as AppUser[]) ?? [];
  }, []);
}

export async function getFacilities(): Promise<Facility[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("facilities")
      .select("*, rooms(*)")
      .order("created_at", { ascending: false });
    return (data as Facility[]) ?? [];
  }, []);
}

export async function getFacility(id: string): Promise<Facility | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("facilities")
      .select("*, rooms(*)")
      .eq("id", id)
      .single();
    return (data as Facility) ?? null;
  }, null);
}

export async function getRooms(): Promise<Room[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("rooms")
      .select("*, facility:facility_id(id, name)")
      .order("updated_at", { ascending: false });
    return (data as Room[]) ?? [];
  }, []);
}

export async function getTours(): Promise<Tour[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("tours")
      .select(
        "*, lead:lead_id(id, consultant_name, resident_name), facility:facility_id(id, name), staff:staff_id(id, name)"
      )
      .order("scheduled_at", { ascending: false });
    return (data as Tour[]) ?? [];
  }, []);
}

// ダッシュボード集計（18. KPI）
export interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  newThisMonth: number;
  movedInThisMonth: number;
  lostThisMonth: number;
  toursThisMonth: number;
  vacantRooms: number;
  totalRooms: number;
  upcomingTours: Tour[];
  overdueLeads: Lead[];
  staffPerformance: { id: string; name: string; total: number; movedIn: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return safe(async () => {
    const supabase = createClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const iso = startOfMonth.toISOString();

    const [leadsRes, roomsRes, toursRes] = await Promise.all([
      supabase.from("leads").select("id, status, created_at, updated_at, consultant_name, resident_name, assigned_user:assigned_user_id(id, name)"),
      supabase.from("rooms").select("id, status"),
      supabase.from("tours").select("*, lead:lead_id(id, consultant_name, resident_name), facility:facility_id(id, name)"),
    ]);

    const leads = (leadsRes.data as unknown as Lead[]) ?? [];
    const rooms = (roomsRes.data as { id: string; status: string }[]) ?? [];
    const tours = (toursRes.data as Tour[]) ?? [];

    const byStatus: Record<string, number> = {};
    for (const l of leads) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;

    const now = Date.now();
    const overdueLeads = leads
      .filter(
        (l) =>
          ["new", "awaiting_contact"].includes(l.status) &&
          now - new Date(l.created_at).getTime() > 2 * 24 * 60 * 60 * 1000
      )
      .slice(0, 8);

    const upcomingTours = tours
      .filter((t) => t.scheduled_at && new Date(t.scheduled_at).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
      )
      .slice(0, 6);

    // 担当者別成績
    const perfMap = new Map<string, { id: string; name: string; total: number; movedIn: number }>();
    for (const l of leads) {
      if (!l.assigned_user) continue;
      const key = l.assigned_user.id;
      const entry =
        perfMap.get(key) ?? { id: key, name: l.assigned_user.name, total: 0, movedIn: 0 };
      entry.total += 1;
      if (l.status === "moved_in") entry.movedIn += 1;
      perfMap.set(key, entry);
    }
    const staffPerformance = Array.from(perfMap.values()).sort((a, b) => b.total - a.total);

    return {
      total: leads.length,
      byStatus,
      newThisMonth: leads.filter((l) => l.created_at >= iso).length,
      movedInThisMonth: leads.filter(
        (l) => l.status === "moved_in" && l.updated_at >= iso
      ).length,
      lostThisMonth: leads.filter(
        (l) => l.status === "lost" && l.updated_at >= iso
      ).length,
      toursThisMonth: tours.filter(
        (t) => t.scheduled_at && t.scheduled_at >= iso
      ).length,
      vacantRooms: rooms.filter((r) => r.status === "vacant").length,
      totalRooms: rooms.length,
      upcomingTours,
      overdueLeads,
      staffPerformance,
    };
  }, {
    total: 0,
    byStatus: {},
    newThisMonth: 0,
    movedInThisMonth: 0,
    lostThisMonth: 0,
    toursThisMonth: 0,
    vacantRooms: 0,
    totalRooms: 0,
    upcomingTours: [],
    overdueLeads: [],
    staffPerformance: [],
  });
}

// =============================================================
// 第2フェーズ: 紹介元 / 広告レポート
// =============================================================

export interface ReferrerWithStats extends Referrer {
  lead_count: number;
  tour_count: number;
  contract_count: number; // 入居完了
  conversion_rate: number; // 成約率(%)
}

// 16. 紹介元管理（紹介件数・見学件数・成約件数・成約率を集計）
export async function getReferrersWithStats(): Promise<ReferrerWithStats[]> {
  return safe(async () => {
    const supabase = createClient();
    const [refRes, leadRes, tourRes] = await Promise.all([
      supabase.from("referrers").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, referrer_id, status"),
      supabase.from("tours").select("id, lead_id"),
    ]);

    const referrers = (refRes.data as Referrer[]) ?? [];
    const leads = (leadRes.data as Pick<Lead, "id" | "referrer_id" | "status">[]) ?? [];
    const tours = (tourRes.data as { id: string; lead_id: string }[]) ?? [];

    // lead_id → referrer_id の対応
    const leadToRef = new Map(leads.map((l) => [l.id, l.referrer_id]));

    return referrers.map((r) => {
      const refLeads = leads.filter((l) => l.referrer_id === r.id);
      const leadIds = new Set(refLeads.map((l) => l.id));
      const tourCount = tours.filter((t) => {
        return leadToRef.get(t.lead_id) === r.id || leadIds.has(t.lead_id);
      }).length;
      const contractCount = refLeads.filter((l) => l.status === "moved_in").length;
      return {
        ...r,
        lead_count: refLeads.length,
        tour_count: tourCount,
        contract_count: contractCount,
        conversion_rate:
          refLeads.length > 0
            ? Math.round((contractCount / refLeads.length) * 100)
            : 0,
      };
    });
  }, []);
}

export async function getReferrers(): Promise<Referrer[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("referrers")
      .select("*")
      .order("name");
    return (data as Referrer[]) ?? [];
  }, []);
}

export async function getReferrer(id: string): Promise<Referrer | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("referrers").select("*").eq("id", id).single();
    return (data as Referrer) ?? null;
  }, null);
}

export interface AdReport {
  id: string;
  date: string;
  campaign_name: string | null;
  ad_group_name: string | null;
  keyword: string | null;
  cost: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  tours: number | null;
  move_ins: number | null;
  created_at: string;
}

// 17. 広告管理（手入力）
export async function getAdReports(): Promise<AdReport[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("ad_reports")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);
    return (data as AdReport[]) ?? [];
  }, []);
}
