-- =============================================================
-- Row Level Security ポリシー
-- 32. 必須非機能要件: 個人情報保護 / 管理画面は社内のみ
-- 公開側のフォーム送信はサーバー側で service_role を用いるため、
-- 一般ユーザー(anon)には leads への直接アクセスを与えない。
-- =============================================================

-- ヘルパー: 現在のユーザーが指定ロールを持つか
create or replace function current_user_role()
returns user_role as $$
  select role from users where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_staff()
returns boolean as $$
  select exists (select 1 from users where id = auth.uid() and is_active);
$$ language sql stable security definer;

-- RLS 有効化
alter table users enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table lead_facility_proposals enable row level security;
alter table facilities enable row level security;
alter table rooms enable row level security;
alter table tours enable row level security;
alter table referrers enable row level security;
alter table ad_reports enable row level security;
alter table lp_pages enable row level security;
alter table site_settings enable row level security;

-- users: 本人は自分を読める。staffは全員読める。更新はadminのみ。
drop policy if exists users_select on users;
create policy users_select on users for select
  using (auth.uid() = id or is_staff());

drop policy if exists users_admin_all on users;
create policy users_admin_all on users for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- 業務テーブル: ログイン済みstaffは閲覧可。編集はviewer以外。
-- （MVPでは簡潔さ優先。広告担当の細かな制御はアプリ層で補助）

-- leads
drop policy if exists leads_select on leads;
create policy leads_select on leads for select using (is_staff());
drop policy if exists leads_write on leads;
create policy leads_write on leads for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- lead_activities
drop policy if exists activities_select on lead_activities;
create policy activities_select on lead_activities for select using (is_staff());
drop policy if exists activities_write on lead_activities;
create policy activities_write on lead_activities for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- lead_facility_proposals
drop policy if exists proposals_select on lead_facility_proposals;
create policy proposals_select on lead_facility_proposals for select using (is_staff());
drop policy if exists proposals_write on lead_facility_proposals;
create policy proposals_write on lead_facility_proposals for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- facilities: 公開済みは誰でも閲覧可（空室公開ページ）。それ以外はstaff。
drop policy if exists facilities_public_select on facilities;
create policy facilities_public_select on facilities for select
  using (is_published or is_staff());
drop policy if exists facilities_write on facilities;
create policy facilities_write on facilities for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- rooms: 公開施設の部屋は閲覧可。
drop policy if exists rooms_public_select on rooms;
create policy rooms_public_select on rooms for select
  using (
    is_staff() or exists (
      select 1 from facilities f where f.id = rooms.facility_id and f.is_published
    )
  );
drop policy if exists rooms_write on rooms;
create policy rooms_write on rooms for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- tours
drop policy if exists tours_select on tours;
create policy tours_select on tours for select using (is_staff());
drop policy if exists tours_write on tours;
create policy tours_write on tours for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- referrers
drop policy if exists referrers_select on referrers;
create policy referrers_select on referrers for select using (is_staff());
drop policy if exists referrers_write on referrers;
create policy referrers_write on referrers for all
  using (current_user_role() in ('admin', 'consultant'))
  with check (current_user_role() in ('admin', 'consultant'));

-- ad_reports: 広告担当とadmin
drop policy if exists ad_reports_select on ad_reports;
create policy ad_reports_select on ad_reports for select using (is_staff());
drop policy if exists ad_reports_write on ad_reports;
create policy ad_reports_write on ad_reports for all
  using (current_user_role() in ('admin', 'ad_manager'))
  with check (current_user_role() in ('admin', 'ad_manager'));

-- lp_pages: 公開済みは誰でも閲覧。編集は広告担当/admin。
drop policy if exists lp_public_select on lp_pages;
create policy lp_public_select on lp_pages for select
  using (status = 'published' or is_staff());
drop policy if exists lp_write on lp_pages;
create policy lp_write on lp_pages for all
  using (current_user_role() in ('admin', 'ad_manager'))
  with check (current_user_role() in ('admin', 'ad_manager'));

-- site_settings: 誰でも読める（電話番号など公開情報）。更新はadmin。
drop policy if exists settings_select on site_settings;
create policy settings_select on site_settings for select using (true);
drop policy if exists settings_write on site_settings;
create policy settings_write on site_settings for all
  using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- =============================================================
-- 新規Authユーザー作成時に users 行を自動作成
-- =============================================================
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'consultant'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
