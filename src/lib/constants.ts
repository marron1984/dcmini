// =============================================================
// ラベル定義・選択肢マスタ
// 日本語ラベルとDB値（enum）の対応を一元管理
// =============================================================

import type {
  LeadStatus,
  RoomStatus,
  ReferrerType,
  ActivityType,
  TourResult,
  UserRole,
} from "./types";

export const SITE_NAME = "DCかいご相談ダイヤル";
export const SITE_DESCRIPTION =
  "認知症・生活保護・身寄りなし・退院後の住まい探しまで、専門スタッフが無料でご相談をお受けします。";

// ---- 案件ステータス ----
export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "新規相談", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "awaiting_contact", label: "初回連絡待ち", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { value: "hearing", label: "ヒアリング中", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { value: "proposing", label: "施設提案中", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { value: "tour_adjusting", label: "見学調整中", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "tour_booked", label: "見学予約済", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "toured", label: "見学済", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "considering", label: "申込検討中", color: "bg-lime-100 text-lime-800 border-lime-200" },
  { value: "applied", label: "申込済", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "contract_prep", label: "契約準備中", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "move_in_scheduled", label: "入居予定", color: "bg-emerald-200 text-emerald-900 border-emerald-300" },
  { value: "moved_in", label: "入居完了", color: "bg-emerald-600 text-white border-emerald-700" },
  { value: "lost", label: "失注", color: "bg-gray-200 text-gray-700 border-gray-300" },
  { value: "on_hold", label: "保留", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

export const LEAD_STATUS_MAP: Record<LeadStatus, { label: string; color: string }> =
  Object.fromEntries(
    LEAD_STATUSES.map((s) => [s.value, { label: s.label, color: s.color }])
  ) as Record<LeadStatus, { label: string; color: string }>;

// カンバンに表示する主要ステータス（失注/保留は別枠）
export const KANBAN_STATUSES: LeadStatus[] = [
  "new",
  "awaiting_contact",
  "hearing",
  "proposing",
  "tour_adjusting",
  "tour_booked",
  "toured",
  "considering",
  "applied",
  "contract_prep",
  "move_in_scheduled",
  "moved_in",
];

// ---- 部屋状況 ----
export const ROOM_STATUSES: { value: RoomStatus; label: string; color: string }[] = [
  { value: "vacant", label: "空室", color: "bg-green-100 text-green-800" },
  { value: "occupied", label: "入居中", color: "bg-gray-200 text-gray-700" },
  { value: "reserved", label: "予約中", color: "bg-amber-100 text-amber-800" },
  { value: "applied", label: "申込中", color: "bg-orange-100 text-orange-800" },
  { value: "cleaning", label: "清掃中", color: "bg-sky-100 text-sky-800" },
  { value: "repair", label: "修繕中", color: "bg-red-100 text-red-800" },
];

export const ROOM_STATUS_MAP: Record<RoomStatus, { label: string; color: string }> =
  Object.fromEntries(
    ROOM_STATUSES.map((s) => [s.value, { label: s.label, color: s.color }])
  ) as Record<RoomStatus, { label: string; color: string }>;

// ---- 紹介元種別 ----
export const REFERRER_TYPES: { value: ReferrerType; label: string }[] = [
  { value: "care_manager", label: "ケアマネ" },
  { value: "home_care_office", label: "居宅介護支援事業所" },
  { value: "hospital", label: "病院" },
  { value: "msw", label: "MSW" },
  { value: "community_center", label: "地域包括支援センター" },
  { value: "agency", label: "紹介会社" },
  { value: "web", label: "WEB" },
  { value: "google_ads", label: "Google広告" },
  { value: "line", label: "LINE" },
  { value: "existing_referral", label: "既存紹介" },
];

// ---- 対応履歴種別 ----
export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "note", label: "メモ" },
  { value: "call", label: "電話" },
  { value: "line", label: "LINE" },
  { value: "email", label: "メール" },
  { value: "status_change", label: "ステータス変更" },
];

export const ACTIVITY_TYPE_MAP: Record<ActivityType, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((a) => [a.value, a.label])
) as Record<ActivityType, string>;

// ---- 見学結果 ----
export const TOUR_RESULTS: { value: TourResult; label: string; color: string }[] = [
  { value: "pending", label: "未実施", color: "bg-slate-100 text-slate-700" },
  { value: "positive", label: "好感触", color: "bg-green-100 text-green-800" },
  { value: "neutral", label: "普通", color: "bg-amber-100 text-amber-800" },
  { value: "negative", label: "難しい", color: "bg-red-100 text-red-800" },
];

export const TOUR_RESULT_MAP: Record<TourResult, { label: string; color: string }> =
  Object.fromEntries(
    TOUR_RESULTS.map((t) => [t.value, { label: t.label, color: t.color }])
  ) as Record<TourResult, { label: string; color: string }>;

// ---- 権限 ----
export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "管理者" },
  { value: "consultant", label: "相談員" },
  { value: "viewer", label: "閲覧者" },
  { value: "ad_manager", label: "広告担当" },
];

export const USER_ROLE_MAP: Record<UserRole, string> = Object.fromEntries(
  USER_ROLES.map((r) => [r.value, r.label])
) as Record<UserRole, string>;

// ---- 要介護度 ----
export const CARE_LEVELS = [
  "自立",
  "要支援1",
  "要支援2",
  "要介護1",
  "要介護2",
  "要介護3",
  "要介護4",
  "要介護5",
];

// ---- 失注理由（31）----
export const LOST_REASONS = [
  "費用が合わない",
  "地域が合わない",
  "医療対応不可",
  "認知症対応不可",
  "家族意向不一致",
  "本人拒否",
  "他社施設に決定",
  "連絡不能",
  "時期未定",
  "その他",
];

// ---- 悩み別相談カテゴリ（7）----
export const CONCERN_CATEGORIES = [
  { slug: "dementia", label: "認知症の方の入居相談", icon: "Brain" },
  { slug: "welfare", label: "生活保護の方の入居相談", icon: "HandCoins" },
  { slug: "no-family", label: "身寄りがない方の入居相談", icon: "UserRound" },
  { slug: "post-discharge", label: "退院後すぐの住まい探し", icon: "BedDouble" },
  { slug: "medical", label: "医療対応が必要な方", icon: "Stethoscope" },
  { slug: "low-cost", label: "介護費用を抑えたい方", icon: "PiggyBank" },
  { slug: "high-care", label: "要介護度が高い方", icon: "Accessibility" },
  { slug: "mental", label: "精神疾患がある方", icon: "HeartPulse" },
];

// ---- ヒアリング項目構成（12）----
export const HEARING_SECTIONS: {
  key: string;
  title: string;
  items: { key: string; label: string; type: "text" | "bool" }[];
}[] = [
  {
    key: "basic",
    title: "基本情報",
    items: [
      { key: "living_place", label: "現在どこで生活しているか", type: "text" },
      { key: "caregiver", label: "誰が介護しているか", type: "text" },
      { key: "reason", label: "入居を検討している理由", type: "text" },
      { key: "timing", label: "入居希望時期", type: "text" },
      { key: "family_intent", label: "家族の意向", type: "text" },
      { key: "self_intent", label: "本人の意向", type: "text" },
    ],
  },
  {
    key: "physical",
    title: "身体状況",
    items: [
      { key: "walking", label: "歩行", type: "text" },
      { key: "eating", label: "食事", type: "text" },
      { key: "toileting", label: "排泄", type: "text" },
      { key: "bathing", label: "入浴", type: "text" },
      { key: "dressing", label: "着替え", type: "text" },
      { key: "medication", label: "服薬管理", type: "text" },
      { key: "night_care", label: "夜間対応", type: "text" },
    ],
  },
  {
    key: "dementia",
    title: "認知症",
    items: [
      { key: "diagnosed", label: "認知症診断の有無", type: "bool" },
      { key: "wandering", label: "徘徊", type: "bool" },
      { key: "verbal_abuse", label: "暴言", type: "bool" },
      { key: "violence", label: "暴力", type: "bool" },
      { key: "delusion", label: "妄想", type: "bool" },
      { key: "theft_delusion", label: "物盗られ妄想", type: "bool" },
      { key: "day_night_reversal", label: "昼夜逆転", type: "bool" },
      { key: "care_refusal", label: "介護拒否", type: "bool" },
    ],
  },
  {
    key: "medical",
    title: "医療",
    items: [
      { key: "insulin", label: "インスリン", type: "bool" },
      { key: "gastrostomy", label: "胃ろう", type: "bool" },
      { key: "home_oxygen", label: "在宅酸素", type: "bool" },
      { key: "dialysis", label: "人工透析", type: "bool" },
      { key: "bedsore", label: "褥瘡", type: "bool" },
      { key: "balloon", label: "バルーン", type: "bool" },
      { key: "stoma", label: "ストーマ", type: "bool" },
      { key: "suction", label: "たん吸引", type: "bool" },
      { key: "psychiatry", label: "精神科通院", type: "bool" },
      { key: "medication_detail", label: "服薬内容", type: "text" },
    ],
  },
  {
    key: "financial",
    title: "金銭面",
    items: [
      { key: "pension", label: "年金額", type: "text" },
      { key: "welfare", label: "生活保護", type: "bool" },
      { key: "family_support", label: "家族負担可能額", type: "text" },
      { key: "monthly_budget", label: "月額予算", type: "text" },
      { key: "initial_cost_max", label: "初期費用上限", type: "text" },
    ],
  },
];

// ---- 医療対応項目（施設）----
export const MEDICAL_SUPPORT_OPTIONS = [
  "インスリン",
  "胃ろう",
  "在宅酸素",
  "人工透析",
  "褥瘡",
  "バルーン",
  "ストーマ",
  "たん吸引",
  "精神科通院",
  "看取り",
];

// 22. 通知カテゴリのラベル・色
export const NOTIFICATION_CATEGORIES: Record<
  string,
  { label: string; color: string }
> = {
  new_inquiry: { label: "新規問い合わせ", color: "bg-blue-100 text-blue-800" },
  no_first_contact: { label: "初回連絡未対応", color: "bg-red-100 text-red-800" },
  tour_tomorrow: { label: "見学前日", color: "bg-orange-100 text-orange-800" },
  next_action_due: { label: "次回アクション期限", color: "bg-amber-100 text-amber-800" },
  stalled: { label: "長期放置案件", color: "bg-slate-200 text-slate-700" },
  reapproach: { label: "再アプローチ予定", color: "bg-purple-100 text-purple-800" },
};
