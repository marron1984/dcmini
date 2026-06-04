-- =============================================================
-- KPI精度向上: ステータス変更時刻を専用列で保持
-- （updated_at は任意編集でも更新されるため月次集計の根拠に使えない）
-- =============================================================

alter table leads
  add column if not exists status_changed_at timestamptz not null default now();

-- 既存行は作成時刻で初期化（おおよその近似）
update leads set status_changed_at = created_at
where status_changed_at is null;
