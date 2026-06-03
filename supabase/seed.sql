-- =============================================================
-- デモ用シードデータ（任意）
-- =============================================================

insert into facilities (id, name, address, area, nearest_station, type, capacity,
  monthly_fee, initial_fee, max_care_level, accepts_dementia, accepts_welfare,
  medical_support, end_of_life_care, description, is_published, note)
values
  (gen_random_uuid(), 'サンライズ西淀川', '大阪市西淀川区千舟1-2-3', '大阪市西淀川区',
   '阪神なんば線 福駅', '住宅型有料老人ホーム', 50, 125000, 0, '要介護5',
   true, true, array['インスリン','在宅酸素','たん吸引'], true,
   '生活保護の方も相談可能な住宅型有料老人ホームです。', true,
   '空室3室。生活保護対応可。'),
  (gen_random_uuid(), 'グリーンライフ東淀川', '大阪市東淀川区淡路4-5-6', '大阪市東淀川区',
   '阪急京都線 淡路駅', 'サービス付き高齢者向け住宅', 40, 138000, 200000, '要介護4',
   true, false, array['服薬管理','人工透析'], false,
   '医療連携が充実したサ高住です。', true,
   '認知症対応可。'),
  (gen_random_uuid(), 'あんしんの家 大阪', '大阪市淀川区十三本町2-1-1', '大阪市淀川区',
   'JR/阪急 十三駅', '介護付有料老人ホーム', 60, 165000, 300000, '要介護5',
   true, false, array['胃ろう','バルーン','ストーマ','たん吸引','看取り'], true,
   '24時間看護師常駐の介護付有料老人ホームです。', false,
   '医療対応充実。')
on conflict do nothing;
