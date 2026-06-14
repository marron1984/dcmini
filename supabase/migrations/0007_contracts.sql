-- =============================================================
-- 0007: 契約管理台帳（メタデータ＋世代管理）
--  - 締結済みの原本は自社サインシステム（電子契約）側を正とし、
--    本テーブルは原本へのリンク・締結状況・世代・契約期間を管理する台帳。
--  - residents 1 ── N contracts。
-- =============================================================

-- 契約種別
do $$ begin
  create type contract_type as enum (
    'residency',          -- 入居契約
    'renewal',            -- 更新契約
    'important_matters',  -- 重要事項説明書
    'memorandum',         -- 覚書
    'other'               -- その他
  );
exception when duplicate_object then null; end $$;

-- 契約ステータス
do $$ begin
  create type contract_status as enum (
    'draft',     -- 下書き
    'sent',      -- 送信済（署名依頼中）
    'signed',    -- 締結済
    'expired',   -- 失効
    'cancelled'  -- 解約
  );
exception when duplicate_object then null; end $$;

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ひも付け
  resident_id uuid not null references residents(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,

  -- 区分・世代
  contract_type contract_type not null default 'residency',
  title text,
  template_version text,                 -- 雛形（重要事項説明書・契約書ひな形）の世代
  generation int not null default 1,     -- 入居者ごとの契約世代（更新で増える）
  renewal_of uuid references contracts(id) on delete set null, -- 前世代の契約

  -- 締結状況・原本（実体は持たず参照のみ）
  status contract_status not null default 'draft',
  provider text default '自社サインシステム',
  external_contract_id text,             -- 電子契約側の契約ID
  document_url text,                     -- 原本（締結済PDF）へのリンク

  -- 期間・金額
  signed_at date,
  effective_from date,
  effective_to date,                     -- 契約満了日 → 更新期限通知に利用
  amount int,                            -- 契約金額（月額等）

  note text
);

create index if not exists contracts_resident_idx on contracts(resident_id);
create index if not exists contracts_status_idx on contracts(status);
create index if not exists contracts_effective_to_idx on contracts(effective_to);

drop trigger if exists trg_contracts_updated_at on contracts;
create trigger trg_contracts_updated_at before update on contracts
  for each row execute function set_updated_at();

-- ---- RLS（契約は機微情報。staff閲覧・admin/consultant編集）----
alter table contracts enable row level security;

drop policy if exists contracts_select on contracts;
create policy contracts_select on contracts for select using (is_staff());

drop policy if exists contracts_write on contracts;
create policy contracts_write on contracts for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));
