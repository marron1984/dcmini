-- =============================================================
-- 0006: 流入チャネル（集客経路）と入居者管理
--  - leads に channel 列を追加（WEB集客 / 地域連携 / ケアマネ紹介 など）
--  - residents テーブルを新設（入居が決まった方の情報を管理）
-- =============================================================

-- ---- 流入チャネル enum ----
do $$ begin
  create type lead_channel as enum (
    'web',          -- WEB集客（フォーム・検索・広告）
    'phone',        -- 電話直入
    'care_manager', -- ケアマネ紹介
    'medical',      -- 医療機関（病院・MSW）紹介
    'regional',     -- 地域連携（地域包括・イベント・チラシ等のリアル接点）
    'agency',       -- 紹介会社
    'repeat',       -- 既存・口コミ紹介
    'other'         -- その他
  );
exception when duplicate_object then null; end $$;

alter table leads add column if not exists channel lead_channel;

-- 既存行の初期化: utm_source/紹介元の有無からおおまかに推定（NULLのものだけ）
update leads set channel = 'web'
where channel is null and (utm_source is not null or lp_name is not null or gclid is not null);

create index if not exists leads_channel_idx on leads(channel);

-- ---- 入居者ステータス enum ----
do $$ begin
  create type resident_status as enum (
    'scheduled',  -- 入居予定
    'residing',   -- 入居中
    'moved_out'   -- 退去
  );
exception when duplicate_object then null; end $$;

-- ---- 入居者テーブル ----
create table if not exists residents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 由来の案件（任意。案件から登録された場合に紐付け）
  lead_id uuid references leads(id) on delete set null,
  -- 入居先
  facility_id uuid references facilities(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,

  -- 入居者情報
  name text not null,
  name_kana text,
  age int,
  gender text,
  care_level text,

  -- 入退去
  status resident_status not null default 'residing',
  admission_date date,   -- 入居日
  contract_date date,    -- 契約日
  move_out_date date,    -- 退去日

  -- 費用・連絡先
  monthly_fee int,
  guarantor text,            -- 身元保証人
  emergency_contact text,    -- 緊急連絡先

  note text
);

create index if not exists residents_status_idx on residents(status);
create index if not exists residents_facility_idx on residents(facility_id);
create index if not exists residents_admission_idx on residents(admission_date desc);

drop trigger if exists trg_residents_updated_at on residents;
create trigger trg_residents_updated_at before update on residents
  for each row execute function set_updated_at();

-- ---- RLS（入居者は個人情報。staffのみ閲覧・admin/consultantのみ編集）----
alter table residents enable row level security;

drop policy if exists residents_select on residents;
create policy residents_select on residents for select using (is_staff());

drop policy if exists residents_write on residents;
create policy residents_write on residents for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));
