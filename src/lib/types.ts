// =============================================================
// ドメイン型定義（DBスキーマと対応）
// =============================================================

export type UserRole = "admin" | "consultant" | "viewer" | "ad_manager";

export type LeadStatus =
  | "new"
  | "awaiting_contact"
  | "hearing"
  | "proposing"
  | "tour_adjusting"
  | "tour_booked"
  | "toured"
  | "considering"
  | "applied"
  | "contract_prep"
  | "move_in_scheduled"
  | "moved_in"
  | "lost"
  | "on_hold";

export type RoomStatus =
  | "occupied"
  | "reserved"
  | "vacant"
  | "cleaning"
  | "repair"
  | "applied";

export type ActivityType = "note" | "call" | "line" | "email" | "status_change";

export type ReferrerType =
  | "care_manager"
  | "home_care_office"
  | "hospital"
  | "msw"
  | "community_center"
  | "agency"
  | "web"
  | "google_ads"
  | "line"
  | "existing_referral";

export type TourResult = "pending" | "positive" | "neutral" | "negative";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  status: LeadStatus;
  assigned_user_id: string | null;
  referrer_id: string | null;

  consultant_name: string;
  consultant_name_kana: string | null;
  consultant_phone: string | null;
  consultant_email: string | null;
  relationship: string | null;
  consultant_area: string | null;

  resident_name: string | null;
  resident_age: number | null;
  resident_gender: string | null;
  resident_current_area: string | null;
  care_level: string | null;
  dementia_status: boolean | null;
  welfare_status: boolean | null;
  medical_needs: boolean | null;
  mental_illness: boolean | null;
  has_guarantor: boolean | null;
  desired_move_in_date: string | null;
  budget: number | null;
  desired_area: string | null;
  note: string | null;

  hearing: Record<string, unknown>;

  lost_reason: string | null;
  reapproach_date: string | null;
  status_changed_at?: string;

  lp_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;

  created_at: string;
  updated_at: string;

  // join
  assigned_user?: Pick<AppUser, "id" | "name"> | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: ActivityType;
  content: string;
  next_action_date: string | null;
  created_at: string;
  user?: Pick<AppUser, "id" | "name"> | null;
}

export interface Facility {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
  nearest_station: string | null;
  type: string | null;
  capacity: number | null;
  monthly_fee: number | null;
  initial_fee: number | null;
  max_care_level: string | null;
  accepts_dementia: boolean;
  accepts_welfare: boolean;
  medical_support: string[] | null;
  end_of_life_care: boolean;
  photo_urls: string[] | null;
  description: string | null;
  is_published: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  facility_id: string;
  room_number: string;
  floor: number | null;
  rent: number | null;
  common_fee: number | null;
  meal_fee: number | null;
  management_fee: number | null;
  status: RoomStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  facility?: Pick<Facility, "id" | "name"> | null;
}

export interface Tour {
  id: string;
  lead_id: string;
  facility_id: string | null;
  scheduled_at: string | null;
  staff_id: string | null;
  participants: string | null;
  meeting_place: string | null;
  result: TourResult;
  next_action: string | null;
  note: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  lead?: Pick<Lead, "id" | "consultant_name" | "resident_name"> | null;
  facility?: Pick<Facility, "id" | "name"> | null;
  staff?: Pick<AppUser, "id" | "name"> | null;
}

export interface Referrer {
  id: string;
  type: ReferrerType;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LpFaqItem {
  q: string;
  a: string;
}

export interface LpPage {
  id: string;
  title: string;
  slug: string;
  target_keyword: string | null;
  hero_copy: string | null;
  target_audience: string | null;
  problems: string | null;
  body: string | null;
  faq: LpFaqItem[];
  status: string; // draft / published
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  category: string | null;
  keywords: string | null;
  status: string; // draft / published
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}
