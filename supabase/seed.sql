-- =============================================
-- Mogador Connect: Seed Data
-- =============================================

-- Create 3 test artisan profiles
INSERT INTO public.profiles 
  (id, clerk_id, username, full_name, title, location, 
   bio, verified, is_artisan, is_tourist, avatar_url, cover_url, role, email)
VALUES
  (uuid_generate_v4(), 'seed_user_1', 'amine-craft', 'أمين الخشبي', 
   'حرفي خشب الثويا', 'الصويرة، المغرب',
   'حرفي متخصص في نحت خشب الثويا منذ 12 سنة. أصنع قطعاً فنية فريدة تعكس روح الصويرة العتيقة.',
   true, true, false,
   'https://api.dicebear.com/7.x/avataaars/svg?seed=amine',
   'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200',
   'artisan', 'amine@mogador.ma'),
   
  (uuid_generate_v4(), 'seed_user_2', 'surf-mogador', 'يوسف الأمواج',
   'مدرب تزلج', 'الصويرة، المغرب',
   'مدرب تزلج محترف على شاطئ الصويرة. الرياح هنا مثالية للمبتدئين والمحترفين.',
   true, true, false,
   'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef',
   'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200',
   'artisan', 'youssef@mogador.ma'),
   
  (uuid_generate_v4(), 'seed_user_3', 'gnaoua-music', 'فاطمة الموسيقى',
   'موسيقية كناوة', 'الصويرة، المغرب',
   'فنانة موسيقى كناوة وتراث مغربي أصيل. أحيي حفلات تقليدية في قلب المدينة العتيقة.',
   true, true, false,
   'https://api.dicebear.com/7.x/avataaars/svg?seed=fatima',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
   'artisan', 'fatima@mogador.ma');

-- Populate related data using the generated IDs
DO $$
DECLARE
  amine_id uuid;
  youssef_id uuid;
  fatima_id uuid;
  post1_id uuid;
  post2_id uuid;
  post3_id uuid;
BEGIN
  SELECT id INTO amine_id FROM profiles WHERE username = 'amine-craft';
  SELECT id INTO youssef_id FROM profiles WHERE username = 'surf-mogador';
  SELECT id INTO fatima_id FROM profiles WHERE username = 'gnaoua-music';

  -- ── Posts ──
  INSERT INTO posts (id, author_id, title, content, category, location, is_featured)
  VALUES (uuid_generate_v4(), amine_id,
    'صناديق الثويا الجديدة',
    'مجموعة جديدة من صناديق الثويا المنحوتة يدوياً. كل قطعة فريدة تعكس روح الصويرة العتيقة وحرفية أجيال من الصنّاع.',
    'artisan', 'المدينة القديمة، الصويرة', true)
  RETURNING id INTO post1_id;

  INSERT INTO posts (id, author_id, title, content, category, location)
  VALUES (uuid_generate_v4(), youssef_id,
    'جلسات التزلج على الأمواج',
    'أفضل وقت للتزلج! الرياح مثالية والأمواج رائعة هذا الأسبوع. احجز جلستك الآن واستمتع بالمحيط الأطلسي.',
    'surf', 'شاطئ الصويرة', false)
  RETURNING id INTO post2_id;

  INSERT INTO posts (id, author_id, title, content, category, location)
  VALUES (uuid_generate_v4(), fatima_id,
    'حفل كناوة الليلة',
    'سهرة موسيقية رائعة بإيقاعات كناوة الأصيلة في قلب المدينة. تعالوا نشارك معاً الموسيقى والفرح.',
    'music', 'ساحة مولاي الحسن، الصويرة', false)
  RETURNING id INTO post3_id;

  -- ── Post Images ──
  INSERT INTO post_images (post_id, url, sort_order) VALUES
    (post1_id, 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=800', 0),
    (post2_id, 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800', 0),
    (post3_id, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', 0);

  -- ── Tags ──
  INSERT INTO post_tags (post_id, tag) VALUES
    (post1_id, 'حرفي'), (post1_id, 'ثويا'), (post1_id, 'صويرة'),
    (post2_id, 'تزلج'), (post2_id, 'صويرة'), (post2_id, 'أمواج'),
    (post3_id, 'كناوة'), (post3_id, 'موسيقى'), (post3_id, 'تراث');

  -- ── Profile Stats ──
  INSERT INTO profile_stats (profile_id, label, value, suffix, sort_order) VALUES
    (amine_id, 'سنوات خبرة', '12', '', 0),
    (amine_id, 'منتج في المتجر', '48', '+', 1),
    (amine_id, 'تقييم', '4.9', '⭐', 2),
    (amine_id, 'عميل راضٍ', '200', '+', 3),
    (youssef_id, 'سنوات خبرة', '8', '', 0),
    (youssef_id, 'طالب', '300', '+', 1),
    (youssef_id, 'تقييم', '4.8', '⭐', 2),
    (fatima_id, 'سنوات خبرة', '15', '', 0),
    (fatima_id, 'حفل', '200', '+', 1),
    (fatima_id, 'تقييم', '5.0', '⭐', 2);

  -- ── Specialties ──
  INSERT INTO specialties (profile_id, icon, label, is_active, sort_order) VALUES
    (amine_id, '🪵', 'نحت الخشب', true, 0),
    (amine_id, '🎨', 'التلوين اليدوي', false, 1),
    (amine_id, '📦', 'صناديق الثويا', false, 2),
    (youssef_id, '🏄', 'تزلج على الأمواج', true, 0),
    (youssef_id, '🪁', 'كايت سورف', false, 1),
    (fatima_id, '🥁', 'موسيقى كناوة', true, 0),
    (fatima_id, '🎵', 'تراث مغربي', false, 1);

  -- ── Services ──
  INSERT INTO services (profile_id, icon, title, description, duration, price, sort_order) VALUES
    (amine_id, '🎁', 'طلبات مخصصة', 'أصنع لك قطعة حسب طلبك وذوقك الخاص', '7-14 يوم', 'من 300 درهم', 0),
    (amine_id, '🏫', 'ورشات تعليمية', 'تعلم نحت الخشب في ورشتي بالمدينة القديمة', '3 ساعات', '200 درهم/شخص', 1),
    (youssef_id, '🏄', 'دروس تزلج', 'تعلم التزلج مع مدرب محترف على شاطئ الصويرة', 'ساعتان', '300 درهم', 0),
    (fatima_id, '🎵', 'حفلات خاصة', 'حفل موسيقي لمناسباتك الخاصة بإيقاعات كناوة', 'ساعتان', '500 درهم', 0);

  -- ── Portfolio Items ──
  INSERT INTO portfolio_items (profile_id, title, image_url, price_mad, sort_order) VALUES
    (amine_id, 'صندوق الزخارف', 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=600', 450, 0),
    (amine_id, 'إطار المرآة', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600', 850, 1),
    (amine_id, 'طاولة صغيرة', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600', 1200, 2);

  -- ── Products (Marketplace) ──
  INSERT INTO products (seller_id, title, description, price_mad, category, image_url) VALUES
    (amine_id, 'صندوق ثويا صغير', 'صندوق منحوت يدوياً من خشب الثويا الأصيل بنقوش مغربية', 350, 'خشب الثويا',
     'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=400'),
    (amine_id, 'إطار مزخرف', 'إطار صور مزخرف بنقوش مغربية تقليدية من خشب الثويا', 280, 'خشب الثويا',
     'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400'),
    (amine_id, 'صندوق مجوهرات', 'صندوق أنيق لحفظ المجوهرات مصنوع يدوياً', 500, 'خشب الثويا',
     'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400');

  -- ── Reviews ──
  INSERT INTO reviews (profile_id, author_name, flag, text, stars) VALUES
    (amine_id, 'Sophie M.', '🇫🇷', 'تحفة فنية رائعة! الجودة استثنائية والتفاصيل مذهلة. شكراً أمين.', 5),
    (amine_id, 'Ahmed K.', '🇸🇦', 'تعامل راقي وقطعة خشبية تزين صالتي. أنصح الجميع بزيارته.', 5),
    (youssef_id, 'James T.', '🇬🇧', 'أفضل تجربة تزلج في حياتي! شكراً يوسف على الدرس الرائع.', 5),
    (fatima_id, 'Maria L.', '🇪🇸', 'موسيقى ساحرة! أمسية لا تُنسى في قلب المدينة القديمة.', 5);
END $$;
