import { createClient } from "@/lib/supabase/server";
import type {
  Lead,
  LeadActivity,
  Facility,
  Room,
  Tour,
  AppUser,
  Referrer,
  LpPage,
  Article,
  AuditLog,
} from "@/lib/types";

// 検索語のサニタイズ。PostgRESTのor()フィルタ構文文字（, ( ) . :）と
// LIKEワイルドカード（% _）、バックスラッシュを除去してフィルタ注入を防ぐ。
function sanitizeSearch(input: string): string {
  return input.replace(/[,().:%_\\*]/g, " ").trim().slice(0, 100);
}

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
    if (filters.area) query = query.ilike("desired_area", `%${sanitizeSearch(filters.area)}%`);
    if (filters.source) query = query.eq("utm_source", filters.source);
    if (filters.q) {
      const q = sanitizeSearch(filters.q);
      query = query.or(
        `consultant_name.ilike.%${q}%,resident_name.ilike.%${q}%,consultant_phone.ilike.%${q}%`
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
    const startMs = startOfMonth.getTime();
    // 日時文字列を安全に数値化（フォーマット/TZ差異に依存しない比較のため）
    const ts = (v?: string | null) => (v ? new Date(v).getTime() : 0);

    const [leadsRes, roomsRes, toursRes] = await Promise.all([
      supabase.from("leads").select("id, status, created_at, updated_at, status_changed_at, consultant_name, resident_name, assigned_user:assigned_user_id(id, name)"),
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

    // ステータス遷移時刻（専用列。未設定の既存行は updated_at で近似）
    const statusChangedMs = (l: Lead) => ts(l.status_changed_at ?? l.updated_at);

    return {
      total: leads.length,
      byStatus,
      newThisMonth: leads.filter((l) => ts(l.created_at) >= startMs).length,
      movedInThisMonth: leads.filter(
        (l) => l.status === "moved_in" && statusChangedMs(l) >= startMs
      ).length,
      lostThisMonth: leads.filter(
        (l) => l.status === "lost" && statusChangedMs(l) >= startMs
      ).length,
      toursThisMonth: tours.filter(
        (t) => t.scheduled_at && ts(t.scheduled_at) >= startMs
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
      const tourCount = tours.filter(
        (t) => leadToRef.get(t.lead_id) === r.id
      ).length;
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

// =============================================================
// 第2フェーズ: ランディングページ（LP CMS）
// =============================================================

export async function getLpPages(): Promise<LpPage[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("lp_pages")
      .select("*")
      .order("updated_at", { ascending: false });
    return (data as LpPage[]) ?? [];
  }, []);
}

export async function getLpPage(id: string): Promise<LpPage | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("lp_pages").select("*").eq("id", id).single();
    return (data as LpPage) ?? null;
  }, null);
}

// =============================================================
// 22. 通知要件: 管理画面のアラート集計
// =============================================================

export type NotificationCategory =
  | "new_inquiry"        // 新規問い合わせ（未対応）
  | "no_first_contact"   // 初回連絡未対応
  | "tour_tomorrow"      // 見学前日
  | "next_action_due"    // 次回アクション期限
  | "stalled"            // 長期放置案件
  | "reapproach";        // 失注リスク（再アプローチ予定日到来）

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  detail: string;
  href: string;
  date: string | null;
  severity: "high" | "medium" | "info";
}

const CLOSED_STATUSES = ["moved_in", "lost"];

export async function getNotifications(): Promise<NotificationItem[]> {
  return safe(async () => {
    const supabase = createClient();
    const [leadsRes, toursRes, actsRes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, status, consultant_name, created_at, updated_at, reapproach_date, lost_reason"),
      supabase
        .from("tours")
        .select("id, scheduled_at, lead:lead_id(id, consultant_name), facility:facility_id(id, name)"),
      supabase
        .from("lead_activities")
        .select("id, lead_id, content, next_action_date, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const leads = (leadsRes.data as unknown as {
      id: string; status: string; consultant_name: string;
      created_at: string; updated_at: string;
      reapproach_date: string | null; lost_reason: string | null;
    }[]) ?? [];
    const tours = (toursRes.data as unknown as {
      id: string; scheduled_at: string | null;
      lead: { id: string; consultant_name: string } | null;
      facility: { id: string; name: string } | null;
    }[]) ?? [];
    const acts = (actsRes.data as unknown as {
      id: string; lead_id: string; content: string;
      next_action_date: string | null; created_at: string;
    }[]) ?? [];

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const ms = (d: number) => d * 24 * 60 * 60 * 1000;

    // 各案件の最終活動日時
    const lastActivity = new Map<string, string>();
    for (const a of acts) {
      if (!lastActivity.has(a.lead_id)) lastActivity.set(a.lead_id, a.created_at);
    }

    const items: NotificationItem[] = [];

    for (const l of leads) {
      const created = new Date(l.created_at).getTime();
      const age = now.getTime() - created;

      // 新規問い合わせ（24時間以内・status new）
      if (l.status === "new" && age <= ms(1)) {
        items.push({
          id: `new-${l.id}`,
          category: "new_inquiry",
          title: "新規問い合わせ",
          detail: `${l.consultant_name} 様からの新しいご相談`,
          href: `/admin/leads/${l.id}`,
          date: l.created_at,
          severity: "high",
        });
      }

      // 初回連絡未対応（new / awaiting_contact が24時間超）
      // ※ new_inquiry(24時間以内) と区間を連続させ、隙間・重複を防ぐ
      if (["new", "awaiting_contact"].includes(l.status) && age > ms(1)) {
        items.push({
          id: `nofc-${l.id}`,
          category: "no_first_contact",
          title: "初回連絡未対応",
          detail: `${l.consultant_name} 様（登録から${Math.floor(age / ms(1))}日経過）`,
          href: `/admin/leads/${l.id}`,
          date: l.created_at,
          severity: "high",
        });
      }

      // 長期放置（未クローズで最終活動が14日以上前）
      if (!CLOSED_STATUSES.includes(l.status)) {
        const last = lastActivity.get(l.id) ?? l.created_at;
        if (now.getTime() - new Date(last).getTime() > ms(14)) {
          items.push({
            id: `stale-${l.id}`,
            category: "stalled",
            title: "長期放置案件",
            detail: `${l.consultant_name} 様（14日以上動きなし）`,
            href: `/admin/leads/${l.id}`,
            date: last,
            severity: "medium",
          });
        }
      }

      // 失注リスク（再アプローチ予定日が到来）。日付部分のみで比較（時刻付きでも安全）
      if (l.status === "lost" && l.reapproach_date && l.reapproach_date.slice(0, 10) <= today) {
        items.push({
          id: `reapp-${l.id}`,
          category: "reapproach",
          title: "再アプローチ予定",
          detail: `${l.consultant_name} 様（${l.lost_reason ?? "失注"}）`,
          href: `/admin/leads/${l.id}`,
          date: l.reapproach_date,
          severity: "medium",
        });
      }
    }

    // 見学前日（24〜48時間以内）
    for (const t of tours) {
      if (!t.scheduled_at) continue;
      const diff = new Date(t.scheduled_at).getTime() - now.getTime();
      if (diff > 0 && diff <= ms(2)) {
        items.push({
          id: `tour-${t.id}`,
          category: "tour_tomorrow",
          title: "まもなく見学",
          detail: `${t.lead?.consultant_name ?? "—"} 様 / ${t.facility?.name ?? "施設未定"}`,
          href: t.lead ? `/admin/leads/${t.lead.id}` : "/admin/tours",
          date: t.scheduled_at,
          severity: "high",
        });
      }
    }

    // 次回アクション期限（期日が今日以前・案件が未クローズ）
    const leadStatus = new Map(leads.map((l) => [l.id, l.status]));
    const seenAction = new Set<string>();
    for (const a of acts) {
      if (!a.next_action_date || a.next_action_date.slice(0, 10) > today) continue;
      if (seenAction.has(a.lead_id)) continue; // 案件ごとに最新1件
      const st = leadStatus.get(a.lead_id);
      if (!st || CLOSED_STATUSES.includes(st)) continue;
      seenAction.add(a.lead_id);
      const lead = leads.find((l) => l.id === a.lead_id);
      items.push({
        id: `act-${a.id}`,
        category: "next_action_due",
        title: "次回アクション期限",
        detail: `${lead?.consultant_name ?? "案件"}：${a.content.slice(0, 30)}`,
        href: `/admin/leads/${a.lead_id}`,
        date: a.next_action_date,
        severity: "medium",
      });
    }

    // 重要度・日付順
    const sev = { high: 0, medium: 1, info: 2 };
    items.sort((a, b) => sev[a.severity] - sev[b.severity]);
    return items;
  }, []);
}

// =============================================================
// 第2フェーズ: SEO記事CMS / 操作ログ
// =============================================================

export async function getArticles(): Promise<Article[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("updated_at", { ascending: false });
    return (data as Article[]) ?? [];
  }, []);
}

export async function getArticleById(id: string): Promise<Article | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("articles").select("*").eq("id", id).single();
    return (data as Article) ?? null;
  }, null);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    return (data as AuditLog[]) ?? [];
  }, []);
}

// ユーザー管理（21）: 無効含む全ユーザーを取得
export async function getAllUsers(): Promise<AppUser[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true });
    return (data as AppUser[]) ?? [];
  }, []);
}
