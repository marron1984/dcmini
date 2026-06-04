-- =============================================================
-- 連携設定: site_settings に計測タグ等のキーを追加（6・3）
-- =============================================================

insert into site_settings (key, value) values
  ('business_hours', '9:00〜18:00'),
  ('ga_id', ''),
  ('gtm_id', ''),
  ('google_ads_id', '')
on conflict (key) do nothing;
