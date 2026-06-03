-- =============================================================
-- 第2フェーズ: SEO記事CMS / 操作ログ（監査ログ・要件32）
-- =============================================================

-- -------------------------------------------------------------
-- articles（SEOコラム記事）
-- -------------------------------------------------------------
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,                 -- 抜粋（一覧・meta description）
  body text,                    -- 本文
  cover_image_url text,         -- アイキャッチ
  category text,                -- カテゴリ（例: 費用 / 認知症 / 手続き）
  keywords text,                -- 想定検索キーワード
  status text not null default 'draft', -- draft / published
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_status on articles(status, published_at desc);

drop trigger if exists trg_articles_updated_at on articles;
create trigger trg_articles_updated_at before update on articles
  for each row execute function set_updated_at();

alter table articles enable row level security;

-- 公開記事は誰でも閲覧可。編集は admin / ad_manager。
drop policy if exists articles_public_select on articles;
create policy articles_public_select on articles for select
  using (status = 'published' or is_staff());
drop policy if exists articles_write on articles;
create policy articles_write on articles for all
  using (current_user_role() in ('admin', 'ad_manager'))
  with check (current_user_role() in ('admin', 'ad_manager'));

-- -------------------------------------------------------------
-- audit_logs（操作ログ・要件32）
-- -------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  user_name text,               -- 表示用にスナップショット保持
  action text not null,         -- 例: lead.status_change
  entity text,                  -- 例: lead / facility / room
  entity_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_entity on audit_logs(entity, entity_id);

alter table audit_logs enable row level security;

-- ログインスタッフは挿入可。閲覧は admin のみ（個人情報保護の観点）。
drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs for insert
  with check (is_staff());
drop policy if exists audit_select on audit_logs;
create policy audit_select on audit_logs for select
  using (current_user_role() = 'admin');
