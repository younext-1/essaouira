-- =========================================================
-- Migration 012: Seller & Store Management System
-- =========================================================

-- 1. HARDEN AND UPGRADE STORES TABLE FOR SENSITIVE METRICS & GEOLOCATION
-- Add UNIQUE constraint to owner_id to strictly enforce ONE store per artisan
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_owner_id_key;
ALTER TABLE public.stores ADD CONSTRAINT stores_owner_id_unique UNIQUE (owner_id);

-- Enforce is_active defaults to FALSE (active state triggered only when onboarding is done)
ALTER TABLE public.stores ALTER COLUMN is_active SET DEFAULT FALSE;

-- Add coordinates, contact channels, verification flags, and metrics counters
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS coordinates POINT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. CREATE STORE METRICS SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.store_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue NUMERIC(12, 2) DEFAULT 0.00,
  avg_response_time_minutes INTEGER DEFAULT 0,
  cancellation_rate NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT store_metrics_store_date_unique UNIQUE (store_id, date)
);

-- 3. CREATE STORE SUBSCRIPTION TIERS & ACTIVE SUBSCRIPTIONS TABLES
CREATE TABLE IF NOT EXISTS public.store_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  max_products INTEGER NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL,
  featured_slots INTEGER NOT NULL DEFAULT 0,
  price_mad NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.store_tiers(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index subscriptions so only ONE subscription can be active per store
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_store_subscription 
  ON public.store_subscriptions(store_id) 
  WHERE (is_active = TRUE);

-- 4. CREATE ONBOARDING CHECKLIST STEPS TABLE
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  profile_added BOOLEAN DEFAULT FALSE,
  payout_connected BOOLEAN DEFAULT FALSE,
  first_product_created BOOLEAN DEFAULT FALSE,
  shipping_policy_set BOOLEAN DEFAULT FALSE,
  store_description_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SEED DEFAULT STORE TIERS (Bronze, Silver, Gold)
INSERT INTO public.store_tiers (name, max_products, commission_rate, featured_slots, price_mad, features)
VALUES 
  ('Bronze', 10, 0.10, 0, 0.00, '{"custom_analytics": false, "dedicated_support": false}'),
  ('Silver', 50, 0.08, 5, 150.00, '{"custom_analytics": true, "dedicated_support": false}'),
  ('Gold', 200, 0.05, 15, 400.00, '{"custom_analytics": true, "dedicated_support": true}')
ON CONFLICT (name) DO NOTHING;

-- 6. CREATE DATABASE TRIGGERS FOR ONBOARDING OPERATIONS

-- Trigger Function A: Auto-create onboarding checklist record on store insertion
CREATE OR REPLACE FUNCTION public.handle_new_store_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.onboarding_steps (store_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_new_store_onboarding ON public.stores;
CREATE TRIGGER trg_handle_new_store_onboarding
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store_onboarding();

-- Trigger Function B: Mark onboarding_completed = TRUE and set store is_active = TRUE when all checklist items are ticked
CREATE OR REPLACE FUNCTION public.check_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_added = TRUE 
     AND NEW.payout_connected = TRUE 
     AND NEW.first_product_created = TRUE 
     AND NEW.shipping_policy_set = TRUE 
     AND NEW.store_description_added = TRUE THEN
     
     -- Auto activate the store and flag onboarding complete
     UPDATE public.stores
     SET onboarding_completed = TRUE,
         is_active = TRUE,
         updated_at = NOW()
     WHERE id = NEW.store_id;
  ELSE
     -- Revert active and onboarding flag if any step gets unticked
     UPDATE public.stores
     SET onboarding_completed = FALSE,
         is_active = FALSE,
         updated_at = NOW()
     WHERE id = NEW.store_id AND (onboarding_completed = TRUE OR is_active = TRUE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_onboarding_completion ON public.onboarding_steps;
CREATE TRIGGER trg_check_onboarding_completion
  AFTER UPDATE ON public.onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.check_onboarding_completion();

-- 7. DEFINE HIGH-PERFORMANCE DATABASE INDEXES
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_category ON public.stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

CREATE INDEX IF NOT EXISTS idx_metrics_store_id ON public.store_metrics(store_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.store_metrics(date);

CREATE INDEX IF NOT EXISTS idx_subs_store_id ON public.store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_store_id ON public.onboarding_steps(store_id);

-- 8. SECURITY ROW-LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all newly introduced modules
ALTER TABLE public.store_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- ── STORES RLS POLICIES OVERWRITE ──
DROP POLICY IF EXISTS "stores_public_select" ON public.stores;
CREATE POLICY "stores_public_select" ON public.stores 
  FOR SELECT USING (
    (is_active = TRUE AND deleted_at IS NULL)
    OR
    owner_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id()
    )
  );

DROP POLICY IF EXISTS "stores_artisan_insert" ON public.stores;
CREATE POLICY "stores_artisan_insert" ON public.stores 
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role = 'artisan' AND verified = TRUE AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "stores_owner_modify" ON public.stores;
CREATE POLICY "stores_owner_modify" ON public.stores 
  FOR UPDATE USING (
    owner_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "stores_owner_delete" ON public.stores;
CREATE POLICY "stores_owner_delete" ON public.stores 
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND deleted_at IS NULL
    )
  );

-- ── ONBOARDING CHECKLIST RLS POLICIES ──
DROP POLICY IF EXISTS "onboarding_owner_read" ON public.onboarding_steps;
CREATE POLICY "onboarding_owner_read" ON public.onboarding_steps
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

DROP POLICY IF EXISTS "onboarding_owner_update" ON public.onboarding_steps;
CREATE POLICY "onboarding_owner_update" ON public.onboarding_steps
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

-- ── STORE METRICS RLS POLICIES ──
DROP POLICY IF EXISTS "metrics_owner_read" ON public.store_metrics;
CREATE POLICY "metrics_owner_read" ON public.store_metrics
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

DROP POLICY IF EXISTS "metrics_admin_moderator" ON public.store_metrics;
CREATE POLICY "metrics_admin_moderator" ON public.store_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
    )
  );

-- ── SUBSCRIPTION TIERS RLS POLICIES ──
DROP POLICY IF EXISTS "tiers_public_read" ON public.store_tiers;
CREATE POLICY "tiers_public_read" ON public.store_tiers
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "tiers_admin_write" ON public.store_tiers;
CREATE POLICY "tiers_admin_write" ON public.store_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role = 'admin'
    )
  );

-- ── STORE SUBSCRIPTIONS RLS POLICIES ──
DROP POLICY IF EXISTS "subs_owner_read" ON public.store_subscriptions;
CREATE POLICY "subs_owner_read" ON public.store_subscriptions
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

DROP POLICY IF EXISTS "subs_admin_write" ON public.store_subscriptions;
CREATE POLICY "subs_admin_write" ON public.store_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role = 'admin'
    )
  );
