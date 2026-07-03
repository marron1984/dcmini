import { createClient } from "@/lib/supabase/server";
import type {
  Lead,
  LeadActivity,
  Facility,
  Room,
  Tour,
  AppUser,
  Referrer,
  Resident,
  Contract,
  LpPage,
  Article,
  AuditLog,
  LeadChannel,
} from "@/lib/types";
import { LEAD_CHANNELS } from "@/lib/constants";
import { jstToday, jstStartOfMonth } from "@/lib/utils";

// 検索語のサニタイズ。PostgRESTのor()フィルタ構文文字（, ( ) . :）と
// LIKEワイルドカード（% _）、バックスラッシュを除去してフィルタ注入を防ぐ。
function sanitizeSearch(input: string): string {
  return input.replace(/[,().:%_\\*]/g, " ").trim().slice(0, 100);
}

// 共通: クエリ失敗時は空にフォールバック（Supabase未設定でもUIが表示される）
// 失敗はログに残す（本番で「0件」に化けた障害を検知できるように）
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[data/admin] query failed, returning fallback:", e);
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
  channel?: string;
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
    if (filters.channel) query = query.eq("channel", filters.channel);
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
      .order("created_at", { ascending: false })
      .limit(300);
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
      .order("updated_at", { ascending: false })
      .limit(2000);
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
      .order("scheduled_at", { ascending: false })
      .limit(500);
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

// 集計の純粋関数（取得済みデータを受け取りKPIを算出。テスト容易化のためnow注入可）
export function computeDashboardStats(
  leads: Lead[],
  rooms: { id: string; status: string }[],
  tours: Tour[],
  now: Date = new Date()
): DashboardStats {
  // 月初は日本時間基準（サーバーがUTCでも日本の業務月と一致させる）
  const startMs = jstStartOfMonth(now).getTime();
  const nowMs = now.getTime();
  // 日時文字列を安全に数値化（フォーマット/TZ差異に依存しない比較のため）
  const ts = (v?: string | null) => (v ? new Date(v).getTime() : 0);

  const byStatus: Record<string, number> = {};
  for (const l of leads) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;

  const overdueLeads = leads
    .filter(
      (l) =>
        ["new", "awaiting_contact"].includes(l.status) &&
        nowMs - ts(l.created_at) > 2 * 24 * 60 * 60 * 1000
    )
    .slice(0, 8);

  const upcomingTours = tours
    .filter((t) => t.scheduled_at && ts(t.scheduled_at) >= nowMs)
    .sort((a, b) => ts(a.scheduled_at) - ts(b.scheduled_at))
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
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return safe(async () => {
    const supabase = createClient();
    // 見学は集計に必要な「今月以降」だけに絞る（全件取得を避ける）
    const startOfMonthISO = jstStartOfMonth().toISOString();
    const [leadsRes, roomsRes, toursRes] = await Promise.all([
      supabase.from("leads").select("id, status, created_at, updated_at, status_changed_at, consultant_name, resident_name, assigned_user:assigned_user_id(id, name)"),
      supabase.from("rooms").select("id, status"),
      supabase
        .from("tours")
        .select("id, scheduled_at, lead:lead_id(id, consultant_name, resident_name), facility:facility_id(id, name)")
        .gte("scheduled_at", startOfMonthISO),
    ]);

    const leads = (leadsRes.data as unknown as Lead[]) ?? [];
    const rooms = (roomsRes.data as { id: string; status: string }[]) ?? [];
    const tours = (toursRes.data as unknown as Tour[]) ?? [];

    return computeDashboardStats(leads, rooms, tours);
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

    // 単一パスで紹介元ごとに集計（紹介元×案件の総当たりを避ける）
    const leadToRef = new Map(leads.map((l) => [l.id, l.referrer_id]));
    const leadAgg = new Map<string, { leads: number; moved: number }>();
    for (const l of leads) {
      if (!l.referrer_id) continue;
      const e = leadAgg.get(l.referrer_id) ?? { leads: 0, moved: 0 };
      e.leads += 1;
      if (l.status === "moved_in") e.moved += 1;
      leadAgg.set(l.referrer_id, e);
    }
    const tourAgg = new Map<string, number>();
    for (const t of tours) {
      const ref = leadToRef.get(t.lead_id);
      if (ref) tourAgg.set(ref, (tourAgg.get(ref) ?? 0) + 1);
    }

    return referrers.map((r) => {
      const agg = leadAgg.get(r.id) ?? { leads: 0, moved: 0 };
      return {
        ...r,
        lead_count: agg.leads,
        tour_count: tourAgg.get(r.id) ?? 0,
        contract_count: agg.moved,
        conversion_rate:
          agg.leads > 0 ? Math.round((agg.moved / agg.leads) * 100) : 0,
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
      .order("name")
      .limit(1000);
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

// =============================================================
// 流入チャネル別の集計（WEB集客 / 地域連携 / ケアマネ紹介 など）
// =============================================================

export interface ChannelStat {
  channel: LeadChannel | "unknown";
  label: string;
  color: string;
  lead_count: number;
  tour_count: number;
  moved_in_count: number;
  conversion_rate: number; // 入居完了 / 相談数(%)
}

// 取得済みデータからチャネル別ファネルを算出（純粋関数・テスト容易化）
export function computeChannelStats(
  leads: Pick<Lead, "id" | "channel" | "status">[],
  tours: { lead_id: string }[]
): ChannelStat[] {
  const leadChannel = new Map(leads.map((l) => [l.id, l.channel ?? "unknown"]));
  const meta = new Map<string, { label: string; color: string }>(
    LEAD_CHANNELS.map((c) => [c.value, { label: c.label, color: c.color }])
  );
  meta.set("unknown", { label: "未分類", color: "bg-slate-100 text-slate-500 border-slate-200" });

  // 表示順は定義順 + 末尾に未分類
  const order: (LeadChannel | "unknown")[] = [...LEAD_CHANNELS.map((c) => c.value), "unknown"];

  return order
    .map((channel) => {
      const chLeads = leads.filter((l) => (l.channel ?? "unknown") === channel);
      const movedIn = chLeads.filter((l) => l.status === "moved_in").length;
      const tourCount = tours.filter((t) => leadChannel.get(t.lead_id) === channel).length;
      const m = meta.get(channel)!;
      return {
        channel,
        label: m.label,
        color: m.color,
        lead_count: chLeads.length,
        tour_count: tourCount,
        moved_in_count: movedIn,
        conversion_rate:
          chLeads.length > 0 ? Math.round((movedIn / chLeads.length) * 100) : 0,
      };
    })
    .filter((s) => s.lead_count > 0);
}

export async function getChannelStats(): Promise<ChannelStat[]> {
  return safe(async () => {
    const supabase = createClient();
    const [leadRes, tourRes] = await Promise.all([
      supabase.from("leads").select("id, channel, status"),
      supabase.from("tours").select("lead_id"),
    ]);
    const leads = (leadRes.data as Pick<Lead, "id" | "channel" | "status">[]) ?? [];
    const tours = (tourRes.data as { lead_id: string }[]) ?? [];
    return computeChannelStats(leads, tours);
  }, []);
}

// =============================================================
// 入居者管理（入居が決まった方の情報）
// =============================================================

export interface ResidentFilters {
  q?: string;
  status?: string;
  facility?: string;
}

export async function getResidents(filters: ResidentFilters = {}): Promise<Resident[]> {
  return safe(async () => {
    const supabase = createClient();
    let query = supabase
      .from("residents")
      .select("*, facility:facility_id(id, name), room:room_id(id, room_number)")
      .order("admission_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.facility) query = query.eq("facility_id", filters.facility);
    if (filters.q) {
      const q = sanitizeSearch(filters.q);
      query = query.or(`name.ilike.%${q}%,name_kana.ilike.%${q}%`);
    }

    const { data } = await query.limit(500);
    return (data as Resident[]) ?? [];
  }, []);
}

export async function getResident(id: string): Promise<Resident | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("residents")
      .select("*, facility:facility_id(id, name), room:room_id(id, room_number)")
      .eq("id", id)
      .single();
    return (data as Resident) ?? null;
  }, null);
}

export interface ResidentStats {
  total: number;
  residing: number;
  scheduled: number;
  movedOut: number;
  monthlyRevenue: number; // 入居中の月額合計
}

export function computeResidentStats(residents: Pick<Resident, "status" | "monthly_fee">[]): ResidentStats {
  const residing = residents.filter((r) => r.status === "residing");
  return {
    total: residents.length,
    residing: residing.length,
    scheduled: residents.filter((r) => r.status === "scheduled").length,
    movedOut: residents.filter((r) => r.status === "moved_out").length,
    monthlyRevenue: residing.reduce((sum, r) => sum + (r.monthly_fee ?? 0), 0),
  };
}

// =============================================================
// 契約管理台帳（メタデータ＋世代管理。原本は電子契約側を正とする）
// =============================================================

export async function getResidentContracts(residentId: string): Promise<Contract[]> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("contracts")
      .select("*")
      .eq("resident_id", residentId)
      .order("generation", { ascending: false })
      .order("created_at", { ascending: false });
    return (data as Contract[]) ?? [];
  }, []);
}

export async function getContract(id: string): Promise<Contract | null> {
  return safe(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("contracts").select("*").eq("id", id).single();
    return (data as Contract) ?? null;
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
      .order("updated_at", { ascending: false })
      .limit(300);
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
  | "reapproach"         // 失注リスク（再アプローチ予定日到来）
  | "contract_renewal";  // 契約更新期限（満了日が近い締結済契約）

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
    const now = new Date();
    // 期日比較はJSTの「今日」を基準にする（UTC日付だと朝9時まで前日扱いになる）
    const today = jstToday(now);
    const ms = (d: number) => d * 24 * 60 * 60 * 1000;
    const nowISO = now.toISOString();
    const soonISO = new Date(now.getTime() + ms(2)).toISOString();
    // 契約更新は30日先まで先読み
    const renewalHorizon = jstToday(new Date(now.getTime() + ms(30)));

    // 全管理ページのレイアウトで呼ばれるため、DB側で対象行を絞って取得する。
    const [leadsRes, toursRes, actsRes, contractsRes] = await Promise.all([
      // 完了案件(moved_in)は通知対象外。残りのみ取得。
      supabase
        .from("leads")
        .select("id, status, consultant_name, created_at, status_changed_at, reapproach_date, lost_reason")
        .neq("status", "moved_in")
        .limit(1000),
      // 今後48時間以内の見学のみ
      supabase
        .from("tours")
        .select("id, scheduled_at, lead:lead_id(id, consultant_name), facility:facility_id(id, name)")
        .gte("scheduled_at", nowISO)
        .lte("scheduled_at", soonISO),
      // 期日が到来した次回アクションのみ
      supabase
        .from("lead_activities")
        .select("id, lead_id, content, next_action_date, created_at")
        .not("next_action_date", "is", null)
        .lte("next_action_date", today)
        .order("created_at", { ascending: false })
        .limit(500),
      // 満了が30日以内に迫った締結済契約（更新検討用）
      supabase
        .from("contracts")
        .select("id, resident_id, contract_type, effective_to, status, resident:resident_id(id, name)")
        .eq("status", "signed")
        .not("effective_to", "is", null)
        .lte("effective_to", renewalHorizon)
        .order("effective_to", { ascending: true })
        .limit(200),
    ]);

    const leads = (leadsRes.data as unknown as {
      id: string; status: string; consultant_name: string;
      created_at: string; status_changed_at: string | null;
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
    const contracts = (contractsRes.data as unknown as {
      id: string; resident_id: string; contract_type: string;
      effective_to: string | null; status: string;
      resident: { id: string; name: string } | null;
    }[]) ?? [];

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

      // 長期放置（未クローズで、同一ステータスのまま14日以上経過）
      if (!CLOSED_STATUSES.includes(l.status)) {
        const since = l.status_changed_at ?? l.created_at;
        if (now.getTime() - new Date(since).getTime() > ms(14)) {
          items.push({
            id: `stale-${l.id}`,
            category: "stalled",
            title: "長期放置案件",
            detail: `${l.consultant_name} 様（14日以上ステータス変化なし）`,
            href: `/admin/leads/${l.id}`,
            date: since,
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

    // 契約更新期限（満了日が30日以内・締結済）。満了済みは高、未到来は中。
    for (const c of contracts) {
      if (!c.effective_to) continue;
      const overdue = c.effective_to.slice(0, 10) < today;
      items.push({
        id: `contract-${c.id}`,
        category: "contract_renewal",
        title: overdue ? "契約満了（要更新）" : "契約更新が近づいています",
        detail: `${c.resident?.name ?? "入居者"} 様（満了 ${c.effective_to}）`,
        href: c.resident ? `/admin/residents/${c.resident.id}` : "/admin/residents",
        date: c.effective_to,
        severity: overdue ? "high" : "medium",
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
      .order("updated_at", { ascending: false })
      .limit(300);
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
