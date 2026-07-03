-- =============================================================
-- 0008: RLS強化・索引追加（全体再点検による是正）
--  - 個人情報を含むテーブルの SELECT を、アプリ層 permissions.ts と
--    一致するロールに限定する（従来は is_staff() = ad_manager も可だった）。
--  - 広告レポートは admin / ad_manager のみに限定。
--  - 集計クエリで使う外部キーに索引を追加。
-- =============================================================

-- 案件系（leads / activities / proposals / tours）: admin, consultant, viewer
drop policy if exists leads_select on leads;
create policy leads_select on leads for select
  using (current_user_role() in ('admin', 'consultant', 'viewer'));

drop policy if exists activities_select on lead_activities;
create policy activities_select on lead_activities for select
  using (current_user_role() in ('admin', 'consultant', 'viewer'));

drop policy if exists proposals_select on lead_facility_proposals;
create policy proposals_select on lead_facility_proposals for select
  using (current_user_role() in ('admin', 'consultant', 'viewer'));

drop policy if exists tours_select on tours;
create policy tours_select on tours for select
  using (current_user_role() in ('admin', 'consultant', 'viewer'));

-- 入居者・契約: admin, consultant, viewer
drop policy if exists residents_select on residents;
create policy residents_select on residents for select
  using (current_user_role() in ('admin', 'consultant', 'viewer'));

drop policy if exists contracts_select on contracts;
create policy contracts_select on contracts for select
  using (current_user_role() in ('admin', 'consultant', 'viewer'));

-- 紹介元: admin, consultant（permissions.ts の referrers と一致）
drop policy if exists referrers_select on referrers;
create policy referrers_select on referrers for select
  using (current_user_role() in ('admin', 'consultant'));

-- 広告レポート: admin, ad_manager のみ（費用情報の閲覧制限）
drop policy if exists ad_reports_select on ad_reports;
create policy ad_reports_select on ad_reports for select
  using (current_user_role() in ('admin', 'ad_manager'));

-- ---- 索引（集計・結合パターンに対応）----
create index if not exists leads_referrer_idx on leads(referrer_id);
create index if not exists tours_lead_idx on tours(lead_id);
create index if not exists tours_facility_idx on tours(facility_id);
create index if not exists tours_scheduled_idx on tours(scheduled_at);
create index if not exists proposals_facility_idx on lead_facility_proposals(facility_id);
