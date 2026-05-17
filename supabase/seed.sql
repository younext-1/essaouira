-- =============================================
-- Mogador Connect: Seed Data
-- =============================================
-- NOTE: These use hardcoded UUIDs for consistency.
-- In production, user IDs come from auth.users via the trigger.

-- Create a demo artisan profile (Amine)
insert into public.profiles (id, username, full_name, avatar_url, cover_url, title, location, bio, verified, is_artisan, is_tourist, whatsapp, instagram)
values (
  '00000000-0000-0000-0000-000000000001',
  'amine-craft-shop',
  'أمين الحرفي',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?q=80&w=1200&auto=format&fit=crop',
  'حرفي خشب الثويا',
  'المدينة القديمة، الصويرة',
  'حرفي متخصص في خشب الثويا منذ أكثر من 15 عاماً. ورثت هذه الحرفة عن أبي وجدي. أصنع كل قطعة بيدي بعناية ودقة، مستخدماً أساليب تقليدية صويرية أصيلة. كل قطعة فريدة وتحمل قصة من تراث المدينة.',
  true,
  true,
  false,
  'https://wa.me/212600000000',
  'https://instagram.com/amine_craft'
) on conflict (id) do nothing;

-- Create a demo guide profile
insert into public.profiles (id, username, full_name, avatar_url, title, location, bio, verified, is_artisan, is_tourist)
values (
  '00000000-0000-0000-0000-000000000002',
  'ahmed-guide',
  'أحمد بناني',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
  'مرشد سياحي',
  'الصويرة',
  'مرشد سياحي محلي متخصص في جولات المدينة التاريخية',
  true,
  true,
  false
) on conflict (id) do nothing;

-- Create surf school profile
insert into public.profiles (id, username, full_name, avatar_url, title, location, verified, is_artisan)
values (
  '00000000-0000-0000-0000-000000000003',
  'mogador-surf',
  'مدرسة موكادور للتزلج',
  'https://images.unsplash.com/photo-1502680390548-bdbac40d7258?q=80&w=200&auto=format&fit=crop',
  'مدرسة تزلج',
  'شاطئ الصويرة',
  true,
  true
) on conflict (id) do nothing;

-- =============================================
-- PROFILE STATS (for Amine)
-- =============================================
insert into public.profile_stats (profile_id, label, value, suffix, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'سنوات الخبرة', '15', '+', 0),
  ('00000000-0000-0000-0000-000000000001', 'قطعة مصنوعة', '500', '+', 1),
  ('00000000-0000-0000-0000-000000000001', 'تقييم', '4.9', '★', 2),
  ('00000000-0000-0000-0000-000000000001', 'عملاء', '200', '+', 3);

-- =============================================
-- SPECIALTIES
-- =============================================
insert into public.specialties (profile_id, icon, label, is_active, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '🪵', 'خشب الثويا', true, 0),
  ('00000000-0000-0000-0000-000000000001', '🎨', 'نقش يدوي', false, 1),
  ('00000000-0000-0000-0000-000000000001', '📐', 'تصاميم هندسية', false, 2),
  ('00000000-0000-0000-0000-000000000001', '🔮', 'عطور الثويا', false, 3);

-- =============================================
-- SERVICES
-- =============================================
insert into public.services (profile_id, icon, title, description, duration, price, is_available, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '🪵', 'ورشة تعليمية', 'تعلم أساسيات النحت على خشب الثويا مع شرح تفصيلي', '3 ساعات', '300 درهم', true, 0),
  ('00000000-0000-0000-0000-000000000001', '🎁', 'قطعة مخصصة', 'اطلب قطعة مصممة خصيصاً لك حسب المقاسات والتصميم', '2-5 أيام', 'حسب التصميم', true, 1),
  ('00000000-0000-0000-0000-000000000001', '📦', 'شحن دولي', 'نوفر خدمة الشحن الآمن لجميع أنحاء العالم', '5-10 أيام', '150 درهم', true, 2);

-- =============================================
-- PORTFOLIO ITEMS
-- =============================================
insert into public.portfolio_items (profile_id, title, image_url, price_mad, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'طاولة ثويا كلاسيكية', 'https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80&w=400&auto=format&fit=crop', 1200, 0),
  ('00000000-0000-0000-0000-000000000001', 'صندوق مجوهرات', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400&auto=format&fit=crop', 350, 1),
  ('00000000-0000-0000-0000-000000000001', 'لوحة نقش هندسي', 'https://images.unsplash.com/photo-1605883705077-8d3d3cebe78c?q=80&w=400&auto=format&fit=crop', 800, 2);

-- =============================================
-- REVIEWS
-- =============================================
insert into public.reviews (profile_id, author_name, flag, text, stars) values
  ('00000000-0000-0000-0000-000000000001', 'Marie', '🇫🇷', 'Artisan incroyable ! La qualité du travail est exceptionnelle.', 5),
  ('00000000-0000-0000-0000-000000000001', 'John', '🇬🇧', 'Amazing craftsmanship. The thuya wood table is a masterpiece.', 5),
  ('00000000-0000-0000-0000-000000000001', 'كريم', '🇲🇦', 'حرفي ممتاز، عمل رائع وأسعار معقولة', 4);

-- =============================================
-- POSTS
-- =============================================
insert into public.posts (id, author_id, title, content, category, location, is_featured, view_count) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'قطعة جديدة من خشب الثويا', 'صنعت هذه الطاولة الفريدة من خشب الثويا الصويري الأصيل. كل نقش يحكي قصة من تراثنا العريق.', 'artisan', 'المدينة القديمة', true, 1240),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'أفضل أمواج الموسم!', 'الرياح التجارية وصلت مبكراً هذا العام! تعالوا استمتعوا بأفضل أمواج التزلج الشراعي في شاطئ الصويرة.', 'surf', 'شاطئ الصويرة', true, 890),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'جولة في أزقة المدينة القديمة', 'اكتشف سحر الأزقة الضيقة والأبواب المزخرفة في مدينة الصويرة القديمة. كل زاوية تحكي حكاية.', 'culture', 'المدينة القديمة', false, 560);

-- Post images
insert into public.post_images (post_id, url, alt, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80&w=800&auto=format&fit=crop', 'Thuya wood table', 0),
  ('10000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1502680390548-bdbac40d7258?q=80&w=800&auto=format&fit=crop', 'Windsurfing', 0),
  ('10000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', 'Medina alley', 0);

-- Post tags
insert into public.post_tags (post_id, tag) values
  ('10000000-0000-0000-0000-000000000001', 'خشب_الثويا'),
  ('10000000-0000-0000-0000-000000000001', 'حرف_يدوية'),
  ('10000000-0000-0000-0000-000000000001', 'الصويرة'),
  ('10000000-0000-0000-0000-000000000002', 'تزلج'),
  ('10000000-0000-0000-0000-000000000002', 'رياضة'),
  ('10000000-0000-0000-0000-000000000002', 'شاطئ'),
  ('10000000-0000-0000-0000-000000000003', 'ثقافة'),
  ('10000000-0000-0000-0000-000000000003', 'تاريخ'),
  ('10000000-0000-0000-0000-000000000003', 'مدينة_قديمة');

-- =============================================
-- PRODUCTS (Marketplace)
-- =============================================
insert into public.products (seller_id, title, description, price_mad, category, image_url) values
  ('00000000-0000-0000-0000-000000000001', 'طاولة خشب الثويا مزخرفة', 'طاولة مصنوعة يدوياً من خشب الثويا مع نقش هندسي تقليدي', 1200, 'خشب الثويا', 'https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80&w=400&auto=format&fit=crop'),
  ('00000000-0000-0000-0000-000000000001', 'صندوق مجوهرات ثويا', 'صندوق أنيق لحفظ المجوهرات مزخرف بنقوش يدوية', 350, 'خشب الثويا', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=400&auto=format&fit=crop'),
  ('00000000-0000-0000-0000-000000000001', 'طبق فخار تقليدي', 'طبق فخاري مزخرف بألوان مغربية أصيلة', 150, 'فخار', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=400&auto=format&fit=crop');
