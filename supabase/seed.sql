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

-- デモ用LP（CMS）
insert into lp_pages (title, slug, target_keyword, hero_copy, target_audience, problems, status, faq)
values (
  '認知症の方の入居相談｜大阪',
  'dementia-osaka',
  '認知症 老人ホーム 大阪',
  '認知症が進み、自宅での介護が難しくなった方へ',
  E'認知症の診断を受けている\n徘徊・昼夜逆転がある\n介護拒否で対応が難しい',
  E'認知症対応可の施設をご紹介\n症状に合うケア体制をご提案\nご家族の負担を軽減',
  'published',
  '[{"q":"認知症でも入居できますか？","a":"対応可能な施設をご紹介できます。症状をお伺いし、最適な住まいをご提案します。"}]'::jsonb
)
on conflict (slug) do nothing;

-- デモ用コラム記事
insert into articles (title, slug, excerpt, body, category, keywords, status, published_at)
values (
  '老人ホームの費用相場を分かりやすく解説',
  'cost-guide',
  '老人ホームの月額費用や初期費用の目安、費用を抑えるポイントを分かりやすくまとめました。',
  E'老人ホームの費用は施設の種類や立地によって大きく変わります。\n\n月額費用の目安は10万円〜25万円程度が一般的です。初期費用が必要な施設もあれば、生活保護の方が入居できる初期費用0円の施設もあります。\n\nご予算に合わせた施設選びは、専門スタッフが無料でサポートします。お気軽にご相談ください。',
  '費用',
  '老人ホーム 費用 相場 大阪',
  'published',
  now()
)
on conflict (slug) do nothing;
