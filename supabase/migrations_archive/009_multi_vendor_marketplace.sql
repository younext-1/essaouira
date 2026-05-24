-- =========================================================
-- Multi-Vendor E-Commerce Marketplace Migration
-- =========================================================

-- 1. Drop existing tables if they conflict (cascade ensures dependencies are clean)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
-- Accommodates Clerk ID mapping via clerk_id and stores buyer/seller settings
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'tourist',
  username TEXT UNIQUE,
  is_tourist BOOLEAN DEFAULT true,
  is_artisan BOOLEAN DEFAULT false,
  onboarding_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STORES TABLE
-- Allows any registered profile to open an artisanal store
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  category TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  total_sales INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
-- Holds multi-vendor product listings
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  compare_price NUMERIC,              -- original price for discount display
  images TEXT[] DEFAULT '{}',         -- array of image URLs
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  sku TEXT,
  weight NUMERIC,
  dimensions JSONB,                   -- {length, width, height}
  is_published BOOLEAN DEFAULT TRUE,
  avg_rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCT VARIANTS TABLE
-- Supports sizes, colors, etc.
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                 -- e.g. "Size", "Color"
  options TEXT[] NOT NULL             -- e.g. ["S","M","L"] or ["Red","Blue"]
);

-- 6. REVIEWS TABLE
-- Stores ratings from buyers
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  images TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- 7. CART ITEMS TABLE
-- Retains cart contents persistently in the database
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  variant JSONB,                      -- selected variant options
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WISHLIST TABLE
-- Handles product bookmarking
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 9. ORDERS TABLE
-- Tracks completed transactions
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',      -- pending, confirmed, shipped, delivered, cancelled
  total_amount NUMERIC NOT NULL,
  shipping_address JSONB,             -- {fullName, addressLine1, addressLine2, city, country, zip, phone}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDER ITEMS TABLE
-- Details individual order products
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC NOT NULL,
  variant JSONB
);

-- =========================================================
-- TRIGGERS AND RATING COMPUTATIONS
-- =========================================================

-- Trigger to automatically recalculate product rating average on review changes
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products SET
    avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric,1) FROM public.reviews 
                           WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)), 0),
    review_count = COALESCE((SELECT COUNT(*) FROM public.reviews 
                             WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)), 0)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR DELETE OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Select policies (Publicly viewable catalog data)
CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Stores are publicly viewable" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Products are publicly viewable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Variants are publicly viewable" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Reviews are publicly viewable" ON public.reviews FOR SELECT USING (true);

-- Interactive operations policies (Open writes for seamless development environment integration)
CREATE POLICY "Profiles are writable by anyone" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Stores are writable by anyone" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Products are writable by anyone" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Variants are writable by anyone" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Reviews are writable by anyone" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Cart is writable by anyone" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Wishlist is writable by anyone" ON public.wishlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Orders are writable by anyone" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Order items are writable by anyone" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- SEED DATA (ESSAOUIRA ARTISANAL STORES & LISTINGS)
-- =========================================================

DO $$
DECLARE
  artisan_user_id1 uuid;
  artisan_user_id2 uuid;
  artisan_user_id3 uuid;
  
  store_id1 uuid;
  store_id2 uuid;
  store_id3 uuid;
  
  prod_id1 uuid;
  prod_id2 uuid;
  prod_id3 uuid;
  prod_id4 uuid;
  prod_id5 uuid;
  prod_id6 uuid;
  prod_id7 uuid;
  prod_id8 uuid;
BEGIN

  -- 1. Insert seed profiles matching mock owners
  INSERT INTO public.profiles (clerk_id, full_name, avatar_url, bio, phone, role, username, is_artisan)
  VALUES (
    'user_seed_artisan_1',
    'Youssef El Khashab',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    'Master Thuya woodcraft wood carver based in the historical Medina of Essaouira.',
    '+212 612-345678',
    'artisan',
    'youssef_woodcraft',
    true
  ) RETURNING id INTO artisan_user_id1;

  INSERT INTO public.profiles (clerk_id, full_name, avatar_url, bio, phone, role, username, is_artisan)
  VALUES (
    'user_seed_artisan_2',
    'Amina Radi',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    'Founder of Mogador Organic Oils cooperative, sourcing directly from local argan forests.',
    '+212 698-765432',
    'artisan',
    'amina_argancoop',
    true
  ) RETURNING id INTO artisan_user_id2;

  INSERT INTO public.profiles (clerk_id, full_name, avatar_url, bio, phone, role, username, is_artisan)
  VALUES (
    'user_seed_artisan_3',
    'Mehdi Bouzidi',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    'Experienced surfer and designer crafting high-performance, eco-friendly waveboards.',
    '+212 654-987654',
    'artisan',
    'mehdi_wavebound',
    true
  ) RETURNING id INTO artisan_user_id3;

  -- 2. Insert seed stores
  -- Store 1: Mogador Woodcraft
  INSERT INTO public.stores (owner_id, name, slug, description, logo_url, banner_url, category, location, rating, review_count)
  VALUES (
    artisan_user_id1,
    'Mogador Woodcraft',
    'mogador-woodcraft',
    'Authentic rare Thuya wooden crafts, jewelry containers, and table sets hand-polished to perfection in the heart of Essaouira Medina.',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&h=400&fit=crop',
    'Artisanal Wood',
    'Essaouira Medina',
    4.8,
    24
  ) RETURNING id INTO store_id1;

  -- Store 2: Argan Gold Cooperative
  INSERT INTO public.stores (owner_id, name, slug, description, logo_url, banner_url, category, location, rating, review_count)
  VALUES (
    artisan_user_id2,
    'Argan Gold Cooperative',
    'argan-gold-cooperative',
    '100% pure organic cosmetic and culinary Argan oil products ethically extracted and cold-pressed by our local womens cooperative.',
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=400&fit=crop',
    'Cosmetics & Oils',
    'Essaouira Rural Forest',
    4.9,
    18
  ) RETURNING id INTO store_id2;

  -- Store 3: WaveBound Surf Craft
  INSERT INTO public.stores (owner_id, name, slug, description, logo_url, banner_url, category, location, rating, review_count)
  VALUES (
    artisan_user_id3,
    'WaveBound Surf Craft',
    'wavebound-surf-craft',
    'Custom high-performance wave surfboards, kites, and eco-friendly neoprenes suited for the high winds of Essaouira and Sidi Kaouki.',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150&h=150&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop',
    'Surf Gear',
    'Sidi Kaouki Beach',
    4.7,
    14
  ) RETURNING id INTO store_id3;

  -- 3. Insert seed products
  -- Woodcraft listings
  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id1,
    'Aromatic Thuya Lock Jewelry Box',
    'aromatic-thuya-lock-jewelry-box',
    'Indulge in the aromatic, sweet scent of pure Thuya wood. Hand-carved with complex hidden locks to secure your precious rings and jewelry. A gorgeous decorative tabletop piece reflecting the artistic heritage of Essaouira Medina.',
    420.00,
    550.00,
    ARRAY['https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=600', 'https://images.unsplash.com/photo-1582282667069-26a4f326f07d?w=600'],
    'Artisanal Wood',
    ARRAY['wood', 'jewelry box', 'thuya', 'handmade'],
    8,
    'THU-JWL-01',
    1.2,
    '{"length":20, "width":15, "height":10}'::jsonb,
    42
  ) RETURNING id INTO prod_id1;

  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id1,
    'Inlaid Wood Chess Set Deluxe',
    'inlaid-wood-chess-set-deluxe',
    'A spectacular chess set featuring natural lemon and ebony wood inlays, with pieces individually hand-shaped and weighted. Folds elegantly into a secure carrying box lined with premium green Moroccan felt.',
    1100.00,
    1400.00,
    ARRAY['https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600'],
    'Artisanal Wood',
    ARRAY['games', 'chess', 'luxury', 'inlay'],
    3,
    'THU-CHS-DX',
    3.5,
    '{"length":40, "width":40, "height":5}'::jsonb,
    11
  ) RETURNING id INTO prod_id2;

  -- Argan listings
  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id2,
    'Pure Cosmetic Argan Elixir - 100ml',
    'pure-cosmetic-argan-elixir-100ml',
    'Our award-winning cold-pressed cosmetic Argan oil is a multi-purpose beauty treatment. Rich in vitamin E, essential fatty acids, and powerful antioxidants, it deeply moisturizes hair, rejuvenates dry skin, and strengthens weak nails.',
    160.00,
    220.00,
    ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600'],
    'Cosmetics & Oils',
    ARRAY['argan', 'beauty', 'hair', 'skincare'],
    45,
    'ARG-COS-100',
    0.25,
    '{"length":5, "width":5, "height":15}'::jsonb,
    130
  ) RETURNING id INTO prod_id3;

  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id2,
    'Toasted Culinary Argan Oil - 500ml',
    'toasted-culinary-argan-oil-500ml',
    'Experience the culinary gold of Morocco. Hand-picked argan kernels are gently roasted to unlock a rich, nutty fragrance, then cold-pressed. Perfect for drizzling over traditional tagines, couscous, or dipping fresh Medina bread.',
    280.00,
    NULL,
    ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'],
    'Cosmetics & Oils',
    ARRAY['argan', 'organic', 'food', 'cooking'],
    28,
    'ARG-CUL-500',
    0.9,
    '{"length":8, "width":8, "height":25}'::jsonb,
    88
  ) RETURNING id INTO prod_id4;

  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id2,
    'Argan & Atlas Honey Honey Soap',
    'argan-atlas-honey-soap',
    'Deeply nourishing hand-rolled natural soap bar made with pure argan oil, raw Atlas mountain honey, and fine ground oatmeal for a gentle, luxurious exfoliation.',
    40.00,
    50.00,
    ARRAY['https://images.unsplash.com/photo-1607006342411-1a9032b4a22c?w=600'],
    'Cosmetics & Oils',
    ARRAY['soap', 'honey', 'argan', 'bath'],
    120,
    'ARG-SOP-HN',
    0.12,
    '{"length":6, "width":6, "height":3}'::jsonb,
    250
  ) RETURNING id INTO prod_id5;

  -- Surf listings
  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id3,
    'WaveBound Sidi Kaouki Surfboard',
    'wavebound-sidi-kaouki-surfboard',
    'A custom fish-tail surfboard designed specifically for the strong swells and windy breaks of Sidi Kaouki. Crafted using eco-responsible polyurethane cores and premium lightweight resin for quick responsiveness and maximum speed.',
    4200.00,
    4900.00,
    ARRAY['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'],
    'Surf Gear',
    ARRAY['surfboard', 'waves', 'custom', 'sidi kaouki'],
    2,
    'SRF-BRD-SK',
    4.2,
    '{"length":180, "width":50, "height":6}'::jsonb,
    4
  ) RETURNING id INTO prod_id6;

  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id3,
    'Ocean-Proof Wetsuit 3/2mm',
    'ocean-proof-wetsuit-3-2mm',
    'Stay warm in the cold Atlantic currents. Our 3/2mm surfing wetsuit features hardware-stitched blind seams and thermal fleece lining around the chest to retain core heat. High-flex shoulders make paddling effort-free.',
    950.00,
    1200.00,
    ARRAY['https://images.unsplash.com/photo-1568849676085-51415703900f?w=600'],
    'Surf Gear',
    ARRAY['wetsuit', 'surfing', 'apparel', 'waterproof'],
    12,
    'SRF-WET-32',
    1.6,
    '{"length":40, "width":30, "height":8}'::jsonb,
    19
  ) RETURNING id INTO prod_id7;

  INSERT INTO public.products (store_id, name, slug, description, price, compare_price, images, category, tags, stock, sku, weight, dimensions, total_sold)
  VALUES (
    store_id3,
    'WaveBound Pro Kiteboard Harness',
    'wavebound-pro-kiteboard-harness',
    'Premium lumbar support harness for high-impact kitesurfing. Includes double leash rings, padded leg loops, and quick release safety locks to securely anchor you to your sail during big Medina jumps.',
    680.00,
    NULL,
    ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'],
    'Surf Gear',
    ARRAY['harness', 'kiteboard', 'safety', 'pro'],
    4,
    'SRF-HRN-PR',
    0.85,
    '{"length":30, "width":25, "height":15}'::jsonb,
    7
  ) RETURNING id INTO prod_id8;

  -- 4. Insert variants specs
  -- Chess variant
  INSERT INTO public.product_variants (product_id, name, options)
  VALUES (prod_id2, 'Wood Quality', ARRAY['Polished Thuya', 'Mother-of-Pearl Inlaid']);

  -- Pure Cosmetic Argan variant
  INSERT INTO public.product_variants (product_id, name, options)
  VALUES (prod_id3, 'Scent', ARRAY['Natural', 'Rose Elixir', 'Lavender Blend']);

  -- Wetsuit variants
  INSERT INTO public.product_variants (product_id, name, options)
  VALUES (prod_id7, 'Size', ARRAY['S', 'M', 'L', 'XL']);
  
  INSERT INTO public.product_variants (product_id, name, options)
  VALUES (prod_id7, 'Color', ARRAY['Charcoal Black', 'Ocean Blue']);

END $$;
