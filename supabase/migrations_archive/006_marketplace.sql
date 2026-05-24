-- =============================================
-- Multi-Vendor Marketplace Migration
-- =============================================

-- 1. Clean up old tables if they conflict (drop cascade to avoid lock issues)
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- 2. Create stores table
CREATE TABLE public.stores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  logo_url text,
  category text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create products table (referenced to stores)
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Allow public SELECT queries on both tables
CREATE POLICY "Stores are publicly viewable" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Products are publicly viewable" ON public.products FOR SELECT USING (true);

-- Allow fully open mutations for test/admin purposes (so you can edit in local UI)
CREATE POLICY "Stores are insertable by anyone" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Stores are updatable by anyone" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Stores are deletable by anyone" ON public.stores FOR DELETE USING (true);

CREATE POLICY "Products are insertable by anyone" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products are updatable by anyone" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Products are deletable by anyone" ON public.products FOR DELETE USING (true);

-- 6. Insert beautiful, realistic Essaouira-themed seed data!
DO $$
DECLARE
  wood_store_id uuid;
  argan_store_id uuid;
  surf_store_id uuid;
  leather_store_id uuid;
BEGIN
  -- Store 1: Mogador Woodcraft (Thuya carving specialty)
  INSERT INTO public.stores (name, description, logo_url, category)
  VALUES (
    'Mogador Woodcraft (نحت خشب الثويا)',
    'حرفيون مغاربة متخصصون في نحت وصقل خشب الثويا العطري النادر. قطع فنية فريدة تجسد تقاليد الصويرة العتيقة.',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&h=150&fit=crop',
    'Artisanal Wood'
  ) RETURNING id INTO wood_store_id;

  -- Store 2: Argan Gold Cooperative (Argan oil production)
  INSERT INTO public.stores (name, description, logo_url, category)
  VALUES (
    'Argan Gold Cooperative (تعاونية أركان الذهب)',
    'تعاونية نسوية محلية تنتج أفضل مستحضرات زيت الأركان الطبيعي العضوي للطهي والتجميل مباشرة من شجر الأركان الصويري.',
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=150&h=150&fit=crop',
    'Cosmetics & Oils'
  ) RETURNING id INTO argan_store_id;

  -- Store 3: Coastal Wave Surf Shop (Water sports gear)
  INSERT INTO public.stores (name, description, logo_url, category)
  VALUES (
    'Coastal Wave Surf Shop (أمواج موكادور)',
    'متجر الصويرة الأول لمعدات ركوب الأمواج، الكايت سورف، وتأجير الألواح وتنسيق الدروس مع مدربين معتمدين.',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150&h=150&fit=crop',
    'Surf Gear'
  ) RETURNING id INTO surf_store_id;

  -- Store 4: Medina Leather Workshop (Leather bags and shoes)
  INSERT INTO public.stores (name, description, logo_url, category)
  VALUES (
    'Medina Leather Workshop (جلديات الصويرة العتيقة)',
    'مصنوعات جلدية مغربية يدوية فاخرة: حقائب، أحذية، وبلغات مغربية مصنوعة من الجلود الطبيعية المدبوغة يدوياً.',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=150&h=150&fit=crop',
    'Leather Goods'
  ) RETURNING id INTO leather_store_id;

  -- Products for Store 1: Woodcraft
  INSERT INTO public.products (store_id, name, description, price, image_url, category, stock) VALUES
  (
    wood_store_id,
    'Classic Thuya Jewelry Box (صندوق مجوهرات ثويا)',
    'صندوق مجوهرات مصنوع يدوياً من خشب الثويا الفاخر، يتميز بنقوش مغربية ورائحة عطرية طبيعية تدوم لسنوات.',
    450.00,
    'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=600',
    'Boxes & Storage',
    12
  ),
  (
    wood_store_id,
    'Inlaid Wood Chess Set (شطرنج خشبي مطعم بالصدف)',
    'طاولة شطرنج مع قطع منحوتة يدوياً ومطعمة بعناية بقطع من خشب الليمون وخشب الأبنوس والصدف الطبيعي.',
    1200.00,
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600',
    'Games',
    5
  ),
  (
    wood_store_id,
    'Polished Thuya Wooden Bowl (صحن ثويا مصقول)',
    'وعاء خشبي متعدد الاستخدامات مصقول بعناية لإظهار الحلقات الطبيعية الفريدة لخيام خشب الثويا.',
    280.00,
    'https://images.unsplash.com/photo-1582282667069-26a4f326f07d?w=600',
    'Tableware',
    20
  );

  -- Products for Store 2: Argan Oil
  INSERT INTO public.products (store_id, name, description, price, image_url, category, stock) VALUES
  (
    argan_store_id,
    'Organic Cosmetic Argan Oil (زيت أركان تجميلي عضوي)',
    'زيت أركان بكر نقي 100% معصور على البارد، غني بفيتامين E ومضادات الأكسدة للعناية بالشعر والبشرة والأظافر.',
    180.00,
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600',
    'Beauty',
    50
  ),
  (
    argan_store_id,
    'Culinary Argan Oil - 500ml (زيت أركان محمص للأكل)',
    'زيت أركان نقي وصحي مستخلص من لوز الأركان المحمص قليلاً، يضفي نكهة بندقية دافئة وفريدة على أطباقك وسلطاتك.',
    290.00,
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
    'Food',
    35
  ),
  (
    argan_store_id,
    'Argan & Honey Nourishing Soap (صابون الأركان والعسل)',
    'صابون بلدي مغربي طبيعي غني بزيت الأركان المغذي وعسل الأطلس الحر لتنظيف البشرة بعمق وترطيبها.',
    45.00,
    'https://images.unsplash.com/photo-1607006342411-1a9032b4a22c?w=600',
    'Bath & Body',
    100
  );

  -- Products for Store 3: Surf Gear
  INSERT INTO public.products (store_id, name, description, price, image_url, category, stock) VALUES
  (
    surf_store_id,
    'Premium Surfboard Rental - Full Day (كراء لوح ركوب الأمواج)',
    'تأجير لوح ركوب أمواج احترافي متناسق مع طولك وخبرتك ليوم كامل للاستمتاع بشواطئ الصويرة وسيدي كاوكي.',
    350.00,
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
    'Rentals',
    15
  ),
  (
    surf_store_id,
    'Beginner Kitesurfing Class - 2 Hours (درس كايت سورف)',
    'حصة تعليمية مكثفة لركوب الأمواج الشراعي لمدة ساعتين مع مدرب مؤهل ومعدات أمان كاملة في خليج الصويرة الهادئ.',
    650.00,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    'Lessons',
    8
  ),
  (
    surf_store_id,
    'Neoprene Wetsuit 3/2mm (بدلة غوص نيوبرين)',
    'بدلة ركوب أمواج نيوبرين متينة بسماكة 3/2 مم، مثالية للرياح والمياه الباردة للمحيط الأطلسي بالصويرة.',
    950.00,
    'https://images.unsplash.com/photo-1568849676085-51415703900f?w=600',
    'Apparel',
    10
  );

  -- Products for Store 4: Leather Goods
  INSERT INTO public.products (store_id, name, description, price, image_url, category, stock) VALUES
  (
    leather_store_id,
    'Vintage Leather Satchel Bag (حقيبة كتف جلدية)',
    'حقيبة كتف من الجلد الطبيعي المدبوغ تقليدياً، تحتوي على عدة مقصورات وحزام كتف قابل للتعديل.',
    420.00,
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    'Bags',
    15
  ),
  (
    leather_store_id,
    'Traditional Leather Babouche (بلغة مغربية مطرزة)',
    'بلغة مغربية تقليدية مريحة وخفيفة مصنوعة يدوياً من الجلد الناعم ومطرزة بخيوط حريرية صقلي عريقة.',
    160.00,
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600',
    'Shoes',
    40
  ),
  (
    leather_store_id,
    'Classic Leather Travel Duffel (حقيبة سفر جلدية كبيرة)',
    'حقيبة سفر جلدية واسعة ومقاومة للمياه والخدش، مصممة للرحلات الطويلة بتفاصيل ومقابض يدوية متينة.',
    980.00,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
    'Luggage',
    6
  );

END $$;
