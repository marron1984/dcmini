-- =============================================================
-- DCかいご相談ダイヤル  初期スキーマ
-- MVP範囲 + 将来拡張を見据えたテーブル設計
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 列挙型
-- -------------------------------------------------------------

-- ユーザー権限（21. 権限管理）
do $$ begin
  create type user_role as enum ('admin', 'consultant', 'viewer', 'ad_manager');
exception when duplicate_object then null; end $$;

-- 案件ステータス（10. CRM要件）
do $$ begin
  create type lead_status as enum (
    'new',              -- 新規相談
    'awaiting_contact', -- 初回連絡待ち
    'hearing',          -- ヒアリング中
    'proposing',        -- 施設提案中
    'tour_adjusting',   -- 見学調整中
    'tour_booked',      -- 見学予約済
    'toured',           -- 見学済
    'considering',      -- 申込検討中
    'applied',          -- 申込済
    'contract_prep',    -- 契約準備中
    'move_in_scheduled',-- 入居予定
    'moved_in',         -- 入居完了
    'lost',             -- 失注
    'on_hold'           -- 保留
  );
exception when duplicate_object then null; end $$;

-- 部屋状況（14. 部屋管理要件）
do $$ begin
  create type room_status as enum (
    'occupied',  -- 入居中
    'reserved',  -- 予約中
    'vacant',    -- 空室
    'cleaning',  -- 清掃中
    'repair',    -- 修繕中
    'applied'    -- 申込中
  );
exception when duplicate_object then null; end $$;

-- 対応履歴種別（11/30）
do $$ begin
  create type activity_type as enum (
    'note',        -- メモ
    'call',        -- 電話履歴
    'line',        -- LINE履歴
    'email',       -- メール
    'status_change'-- ステータス変更
  );
exception when duplicate_object then null; end $$;

-- 紹介元種別（16. 紹介元管理要件）
do $$ begin
  create type referrer_type as enum (
    'care_manager',      -- ケアマネ
    'home_care_office',  -- 居宅介護支援事業所
    'hospital',          -- 病院
    'msw',               -- MSW
    'community_center',  -- 地域包括支援センター
    'agency',            -- 紹介会社
    'web',               -- WEB
    'google_ads',        -- Google広告
    'line',              -- LINE
    'existing_referral'  -- 既存紹介
  );
exception when duplicate_object then null; end $$;

-- 見学結果の感触
do $$ begin
  create type tour_result as enum ('pending', 'positive', 'neutral', 'negative');
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------
-- updated_at 自動更新トリガ
-- -------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -------------------------------------------------------------
-- users（社内スタッフ。Supabase Auth と1:1で紐づく）
-- -------------------------------------------------------------
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  role user_role not null default 'consultant',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- referrers（紹介元）
-- -------------------------------------------------------------
create table if not exists referrers (
  id uuid primary key default gen_random_uuid(),
  type referrer_type not null default 'web',
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  note text,
  last_contacted_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_referrers_updated_at on referrers;
create trigger trg_referrers_updated_at before update on referrers
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- facilities（施設）
-- -------------------------------------------------------------
create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  area text,                       -- エリア（例: 大阪市西淀川区）
  nearest_station text,            -- 最寄駅
  type text,                       -- 施設種別（住宅型/介護付き/サ高住 等）
  capacity int,                    -- 定員
  monthly_fee int,                 -- 月額費用（円）
  initial_fee int,                 -- 初期費用（円）
  max_care_level text,             -- 対応可能介護度
  accepts_dementia boolean not null default false, -- 認知症対応可否
  accepts_welfare boolean not null default false,  -- 生活保護対応可否
  medical_support text[],          -- 医療対応項目（配列）
  end_of_life_care boolean not null default false, -- 看取り対応
  photo_urls text[],               -- 写真
  description text,                -- 紹介文
  is_published boolean not null default false,     -- 空室公開ページ用
  note text,                       -- 管理メモ
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_facilities_updated_at on facilities;
create trigger trg_facilities_updated_at before update on facilities
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- rooms（部屋）
-- -------------------------------------------------------------
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  room_number text not null,
  floor int,
  rent int,            -- 家賃
  common_fee int,      -- 共益費
  meal_fee int,        -- 食費
  management_fee int,  -- 管理費
  status room_status not null default 'vacant',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_facility on rooms(facility_id);

drop trigger if exists trg_rooms_updated_at on rooms;
create trigger trg_rooms_updated_at before update on rooms
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- leads（入居相談案件）
-- 9. 問い合わせフォーム / 11. 案件詳細 / 12. ヒアリング項目
-- -------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  status lead_status not null default 'new',
  assigned_user_id uuid references users(id) on delete set null,
  referrer_id uuid references referrers(id) on delete set null,

  -- 相談者情報
  consultant_name text not null,
  consultant_name_kana text,
  consultant_phone text,
  consultant_email text,
  relationship text,            -- 本人との続柄
  consultant_area text,         -- 住所または相談地域

  -- 入居予定者情報
  resident_name text,
  resident_age int,
  resident_gender text,
  resident_current_area text,   -- 現在の居住地
  care_level text,              -- 要介護度
  dementia_status boolean,      -- 認知症の有無
  welfare_status boolean,       -- 生活保護の有無
  medical_needs boolean,        -- 医療行為の有無
  mental_illness boolean,       -- 精神疾患の有無
  has_guarantor boolean,        -- 身元保証人の有無
  desired_move_in_date text,    -- 希望入居時期
  budget int,                   -- 月額予算
  desired_area text,            -- 希望地域
  note text,                    -- 相談内容

  -- ヒアリング項目（12）はJSONで柔軟に保持
  hearing jsonb not null default '{}'::jsonb,

  -- 失注（31）
  lost_reason text,
  reapproach_date date,

  -- 流入情報（9. 流入情報）
  lp_name text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_assigned on leads(assigned_user_id);
create index if not exists idx_leads_created on leads(created_at desc);

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at before update on leads
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- lead_activities（対応履歴）
-- -------------------------------------------------------------
create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  activity_type activity_type not null default 'note',
  content text not null default '',
  next_action_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_lead on lead_activities(lead_id, created_at desc);

-- -------------------------------------------------------------
-- lead_facility_proposals（施設提案）
-- -------------------------------------------------------------
create table if not exists lead_facility_proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  facility_id uuid not null references facilities(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposals_lead on lead_facility_proposals(lead_id);

-- -------------------------------------------------------------
-- tours（見学）
-- -------------------------------------------------------------
create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  facility_id uuid references facilities(id) on delete set null,
  scheduled_at timestamptz,
  staff_id uuid references users(id) on delete set null,
  participants text,        -- 参加者
  meeting_place text,       -- 集合場所
  result tour_result not null default 'pending',
  next_action text,         -- 次回アクション
  note text,                -- 見学後メモ
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tours_lead on tours(lead_id);
create index if not exists idx_tours_scheduled on tours(scheduled_at);

drop trigger if exists trg_tours_updated_at on tours;
create trigger trg_tours_updated_at before update on tours
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- ad_reports（広告レポート: 手入力）
-- -------------------------------------------------------------
create table if not exists ad_reports (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  campaign_name text,
  ad_group_name text,
  keyword text,
  cost int,
  impressions int,
  clicks int,
  conversions int,     -- 問い合わせ数
  tours int,           -- 見学数
  move_ins int,        -- 入居数
  created_at timestamptz not null default now()
);

create index if not exists idx_ad_reports_date on ad_reports(date desc);

-- -------------------------------------------------------------
-- lp_pages（ランディングページ）
-- -------------------------------------------------------------
create table if not exists lp_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  target_keyword text,
  hero_copy text,
  target_audience text,    -- 対象者
  problems text,           -- 解決できる悩み
  body text,
  faq jsonb not null default '[]'::jsonb,
  status text not null default 'draft', -- draft / published
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_lp_pages_updated_at on lp_pages;
create trigger trg_lp_pages_updated_at before update on lp_pages
  for each row execute function set_updated_at();

-- -------------------------------------------------------------
-- site_settings（電話番号など管理画面から変更可能な設定）
-- -------------------------------------------------------------
create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into site_settings (key, value) values
  ('phone_number', '0120-000-000'),
  ('line_url', 'https://line.me/R/ti/p/@your-line-id')
on conflict (key) do nothing;
