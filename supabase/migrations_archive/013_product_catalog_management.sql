-- =========================================================
-- Migration 013: Product & Catalog Management System
-- =========================================================

-- 1. CLEAN UP PREVIOUS PRODUCTS LOGIC IF ANY
DROP TRIGGER IF EXISTS trg_generate_product_slug ON public.products CASCADE;
DROP TABLE IF EXISTS public.experience_slots CASCADE;
DROP TABLE IF EXISTS public.experience_details CASCADE;
DROP TABLE IF EXISTS public.inventory_locks CASCADE;
DROP TABLE IF EXISTS public.product_inventory CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

DROP TYPE IF EXISTS public.product_type CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;

-- 2. CREATE TYPE ENUMS FOR DUAL TYPES AND LIFECYCLE STATES
CREATE TYPE public.product_type AS ENUM ('physical', 'experience');
CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'paused', 'sold_out', 'archived');

-- 3. CREATE CATEGORIES TABLE (Hierarchical structure)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  name_fr VARCHAR,
  slug VARCHAR UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(12, 2) CHECK (compare_at_price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  type public.product_type NOT NULL,
  status public.product_status NOT NULL DEFAULT 'draft',
  stock INTEGER DEFAULT 0,
  weight_grams INTEGER CHECK (weight_grams >= 0),
  dimensions JSONB DEFAULT '{"length": 0, "width": 0, "height": 0}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  total_sales INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.00,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE PRODUCT VARIANTS TABLE
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  sku VARCHAR UNIQUE NOT NULL,
  price_override NUMERIC(12, 2) CHECK (price_override >= 0),
  stock INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE PRODUCT INVENTORY TABLE
CREATE TABLE public.product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  reserved INTEGER DEFAULT 0 CHECK (reserved >= 0),
  available INTEGER GENERATED ALWAYS AS (quantity - reserved) STORED,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT product_inventory_unique UNIQUE (product_id, variant_id)
);

-- 7. CREATE INVENTORY LOCKS TABLE
CREATE TABLE public.inventory_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  checkout_id VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE EXPERIENCE DETAILS TABLE
CREATE TABLE public.experience_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID UNIQUE REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  duration_hours NUMERIC(4, 2) NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  meeting_point TEXT NOT NULL,
  meeting_point_coords POINT,
  languages TEXT[] DEFAULT '{}',
  includes TEXT[] DEFAULT '{}',
  excludes TEXT[] DEFAULT '{}',
  cancellation_policy TEXT,
  min_age INTEGER CHECK (min_age >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE EXPERIENCE SLOTS TABLE
CREATE TABLE public.experience_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  booked_count INTEGER DEFAULT 0 CHECK (booked_count >= 0),
  is_available BOOLEAN DEFAULT TRUE,
  price_override NUMERIC(12, 2) CHECK (price_override >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REGISTER DATABASE INDEXES FOR SPEED SEARCHES
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_inventory_product_variant ON public.product_inventory(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_locks_checkout ON public.inventory_locks(checkout_id);
CREATE INDEX IF NOT EXISTS idx_locks_expires ON public.inventory_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_exp_slots_product ON public.experience_slots(product_id);
CREATE INDEX IF NOT EXISTS idx_exp_slots_date ON public.experience_slots(date);

-- 11. REGISTER MULTI-LANGUAGE GIN SEARCH INDEX (English, French, Arabic via Simple)
ALTER TABLE public.products ADD COLUMN fts_document tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) ||
  to_tsvector('french', coalesce(name_fr, '') || ' ' || coalesce(description_fr, '')) ||
  to_tsvector('simple', coalesce(name_ar, '') || ' ' || coalesce(description_ar, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING GIN(fts_document);

-- 12. DATABASE TRIGGERS IMPLEMENTATION

-- Trigger A: Auto-generate alphanumeric safe kebab-case UNIQUE slug from product name
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.name <> OLD.name OR NEW.slug IS NULL THEN
    -- Convert text to lowercase, swap spaces and symbols to dash
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '[\s_]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN
      base_slug := 'artisanal-item';
    END IF;
    -- Inject random alphanumeric sequence suffix to prevent collisions
    final_slug := base_slug || '-' || substring(md5(random()::text) from 1 for 6);
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.generate_product_slug();

-- Trigger B: Update store total_sales when an order completes (reaches delivered/confirmed status)
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status IN ('confirmed', 'delivered') AND OLD.status NOT IN ('confirmed', 'delivered')) OR
     (TG_OP = 'INSERT' AND NEW.status IN ('confirmed', 'delivered')) THEN
    UPDATE public.stores
    SET total_sales = total_sales + 1
    WHERE id = NEW.store_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'delivered') AND NEW.status NOT IN ('confirmed', 'delivered')) THEN
    UPDATE public.stores
    SET total_sales = greatest(0, total_sales - 1)
    WHERE id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_order_completion ON public.orders;
CREATE TRIGGER trg_handle_order_completion
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_completion();

-- Trigger C: Update product average rating when a new product review is written/updated
CREATE OR REPLACE FUNCTION public.handle_review_changes()
RETURNS TRIGGER AS $$
DECLARE
  p_id UUID;
  avg_score NUMERIC(3, 2);
  reviews_cnt INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    p_id := NEW.product_id;
  ELSE
    p_id := OLD.product_id;
  END IF;

  SELECT count(*), coalesce(avg(rating), 0.00)
  INTO reviews_cnt, avg_score
  FROM public.reviews
  WHERE product_id = p_id;

  UPDATE public.products
  SET rating = avg_score,
      total_reviews = reviews_cnt
  WHERE id = p_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_review_changes ON public.reviews;
CREATE TRIGGER trg_handle_review_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_review_changes();

-- Trigger D: Set status = 'sold_out' when inventory stock is empty, restore status = 'active' when replenished
CREATE OR REPLACE FUNCTION public.handle_inventory_stock_changes()
RETURNS TRIGGER AS $$
DECLARE
  total_available INTEGER;
  p_status public.product_status;
BEGIN
  -- Aggregate total available stock across variants
  SELECT coalesce(sum(available), 0) INTO total_available
  FROM public.product_inventory
  WHERE product_id = NEW.product_id;

  SELECT status INTO p_status
  FROM public.products
  WHERE id = NEW.product_id;

  -- Toggle status indicator safely
  IF total_available <= 0 AND p_status = 'active' THEN
    UPDATE public.products
    SET status = 'sold_out', stock = 0
    WHERE id = NEW.product_id;
  ELSIF total_available > 0 AND p_status = 'sold_out' THEN
    UPDATE public.products
    SET status = 'active', stock = total_available
    WHERE id = NEW.product_id;
  ELSE
    -- Just keep products.stock column updated
    UPDATE public.products
    SET stock = total_available
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_inventory_stock_changes ON public.product_inventory;
CREATE TRIGGER trg_handle_inventory_stock_changes
  AFTER INSERT OR UPDATE ON public.product_inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_inventory_stock_changes();

-- 13. SECURITY ROW-LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_slots ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
    )
  );

-- Products RLS
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (
    status = 'active'
    OR
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

CREATE POLICY "products_owner_insert" ON public.products
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()) AND is_active = TRUE AND deleted_at IS NULL
    )
  );

CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()) AND deleted_at IS NULL
    )
  );

CREATE POLICY "products_owner_delete" ON public.products
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()) AND deleted_at IS NULL
    )
  );

-- Product Variants RLS
CREATE POLICY "variants_public_read" ON public.product_variants
  FOR SELECT USING (
    is_active = TRUE
    OR
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "variants_owner_all" ON public.product_variants
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- Inventory RLS
CREATE POLICY "inventory_owner_read" ON public.product_inventory
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE status = 'active'
      OR store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "inventory_owner_update" ON public.product_inventory
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- Locks RLS (Mainly serviced by Postgres transaction procedures, but secured here for REST APIs)
CREATE POLICY "locks_owner_read" ON public.inventory_locks
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- Experience Details RLS
CREATE POLICY "exp_details_public_read" ON public.experience_details
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE status = 'active'
      OR store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "exp_details_owner_all" ON public.experience_details
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- Experience Slots RLS
CREATE POLICY "exp_slots_public_read" ON public.experience_slots
  FOR SELECT USING (
    is_available = TRUE
    OR
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "exp_slots_owner_all" ON public.experience_slots
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

-- 14. SEED SAMPLE CATEGORIES
INSERT INTO public.categories (name, name_ar, name_fr, slug, icon_url, sort_order)
VALUES
  ('Rugs & Tapestries', 'زرابي ومنسوجات', 'Tapis & Tapisseries', 'rugs-tapestries', 'rug', 1),
  ('Wood Carvings', 'نحت خشبي', 'Sculptures sur Bois', 'wood-carvings', 'hammer', 2),
  ('Oils & Cosmetics', 'زيوت ومستحضرات تجميل', 'Huiles & Cosmétiques', 'oils-cosmetics', 'droplet', 3),
  ('Excursions & Guided Tours', 'جولات استكشافية سياحية', 'Excursions & Visites Guidées', 'guided-excursions', 'map-pin', 4),
  ('Surf & Water Sports Lessons', 'حصص ركوب أمواج ورياضات مائية', 'Leçons de Surf & Sports Nautiques', 'surf-water-lessons', 'wind', 5),
  ('Culinary Arts & Cooking Classes', 'ورشات طبخ وفنون طهي', 'Cours de Cuisine & Arts Culinaires', 'cooking-classes', 'utensils', 6)
ON CONFLICT (slug) DO NOTHING;
