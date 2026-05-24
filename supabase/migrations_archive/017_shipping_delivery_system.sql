-- Supabase Migration: 017_shipping_delivery_system.sql
-- Enables PostGIS extension and builds complete database model for multi-vendor shipping.

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. DROP EXISTING CONFLICTING OBJECTS
DROP TRIGGER IF EXISTS trg_on_shipment_insert ON public.shipments CASCADE;
DROP TRIGGER IF EXISTS trg_on_shipment_delivery ON public.shipments CASCADE;
DROP TRIGGER IF EXISTS trg_on_store_created_shipping_policy ON public.stores CASCADE;

DROP FUNCTION IF EXISTS public.handle_shipment_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_shipment_delivery() CASCADE;
DROP FUNCTION IF EXISTS public.handle_store_created_shipping_policy() CASCADE;

DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.pickup_hubs CASCADE;
DROP TABLE IF EXISTS public.store_shipping_rates CASCADE;
DROP TABLE IF EXISTS public.store_shipping_policies CASCADE;
DROP TABLE IF EXISTS public.carrier_configs CASCADE;
DROP TABLE IF EXISTS public.shipping_zones CASCADE;

DROP TYPE IF EXISTS public.delivery_type CASCADE;
DROP TYPE IF EXISTS public.rate_type CASCADE;
DROP TYPE IF EXISTS public.shipment_status CASCADE;

-- 2. CREATE CUSTOM ENUMS
CREATE TYPE public.delivery_type AS ENUM ('local', 'national', 'international');
CREATE TYPE public.rate_type AS ENUM ('flat', 'weight_based', 'free');
CREATE TYPE public.shipment_status AS ENUM (
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'returned'
);

-- 3. CREATE SHIPPING ZONES
CREATE TABLE public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type public.delivery_type NOT NULL,
  countries TEXT[] DEFAULT NULL, -- Array of ISO country codes (e.g. {'MA', 'FR'})
  cities TEXT[] DEFAULT NULL,    -- Array of cities in Morocco (e.g. {'Essaouira', 'Marrakech'})
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE CARRIER CONFIGURATIONS
CREATE TABLE public.carrier_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'amana', 'ctm', 'jadid', 'dhl', 'fedex', 'aramex'
  type public.delivery_type NOT NULL,
  logo_url VARCHAR(255),
  tracking_url_template VARCHAR(255) NOT NULL, -- e.g. 'https://www.amana-colis.ma/track?num={tracking_number}'
  api_endpoint VARCHAR(255) DEFAULT NULL,
  api_key_encrypted VARCHAR(500) DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  estimated_days_min INTEGER NOT NULL DEFAULT 1 CHECK (estimated_days_min >= 0),
  estimated_days_max INTEGER NOT NULL DEFAULT 7 CHECK (estimated_days_max >= estimated_days_min),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE STORE SHIPPING POLICIES
CREATE TABLE public.store_shipping_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE NOT NULL,
  offers_local_pickup BOOLEAN DEFAULT false,
  local_pickup_address TEXT,
  local_pickup_coords GEOMETRY(Point, 4326),
  local_pickup_fee NUMERIC(10, 2) DEFAULT 0.00 CHECK (local_pickup_fee >= 0),
  local_pickup_instructions TEXT,
  offers_national BOOLEAN DEFAULT true,
  offers_international BOOLEAN DEFAULT false,
  free_shipping_threshold_mad NUMERIC(10, 2) DEFAULT NULL CHECK (free_shipping_threshold_mad >= 0),
  handling_time_days INTEGER DEFAULT 1 CHECK (handling_time_days >= 0),
  ships_from_city VARCHAR(100) DEFAULT 'Essaouira',
  ships_from_coords GEOMETRY(Point, 4326),
  return_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE STORE SHIPPING RATES
CREATE TABLE public.store_shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  zone_id UUID REFERENCES public.shipping_zones.id ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES public.carrier_configs(id) ON DELETE SET NULL,
  rate_type public.rate_type NOT NULL,
  flat_fee NUMERIC(10, 2) CHECK (flat_fee >= 0),
  weight_tiers JSONB DEFAULT NULL, -- Array of tiers: [{"max_weight_g": 1000, "fee": 15.00}, {"max_weight_g": 5000, "fee": 25.00}]
  min_order_mad NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_mad >= 0),
  max_order_mad NUMERIC(10, 2) DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, zone_id),
  CONSTRAINT chk_order_bounds CHECK (max_order_mad IS NULL OR max_order_mad >= min_order_mad)
);

-- 7. CREATE PICKUP HUBS
CREATE TABLE public.pickup_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  coords GEOMETRY(Point, 4326),
  city VARCHAR(100) DEFAULT 'Essaouira',
  contact_phone VARCHAR(50),
  working_hours JSONB NOT NULL DEFAULT '{"weekdays": "09:00-18:00", "saturday": "09:00-13:00", "sunday": "closed"}'::JSONB,
  max_storage_days INTEGER DEFAULT 7 CHECK (max_storage_days > 0),
  is_active BOOLEAN DEFAULT true,
  partner_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE SHIPMENTS
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  carrier_id UUID REFERENCES public.carrier_configs(id) ON DELETE SET NULL,
  type public.delivery_type NOT NULL,
  tracking_number VARCHAR(100),
  tracking_url VARCHAR(500),
  shipping_label_url VARCHAR(500),
  pickup_hub_id UUID REFERENCES public.pickup_hubs(id) ON DELETE SET NULL,
  origin_address JSONB NOT NULL,
  destination_address JSONB NOT NULL,
  weight_grams INTEGER NOT NULL CHECK (weight_grams >= 0),
  dimensions JSONB DEFAULT '{"length_cm": 1, "width_cm": 1, "height_cm": 1}'::JSONB,
  declared_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (declared_value >= 0),
  customs_description TEXT DEFAULT NULL,
  estimated_delivery DATE,
  shipped_at TIMESTAMPTZ DEFAULT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  status public.shipment_status NOT NULL DEFAULT 'label_created',
  tracking_events JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE INDEXES FOR FAST SEARCH
CREATE INDEX idx_shipments_child_order ON public.shipments(child_order_id);
CREATE INDEX idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_type ON public.shipments(type);
CREATE INDEX idx_store_rates_store_zone ON public.store_shipping_rates(store_id, zone_id);
CREATE INDEX idx_pickup_hubs_city ON public.pickup_hubs(city);

-- 10. ROW-LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all newly created tables
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- A. SHIPPING ZONES POLICIES
CREATE POLICY "zones_public_select" ON public.shipping_zones
  FOR SELECT USING (true);

CREATE POLICY "zones_admin_all" ON public.shipping_zones
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

-- B. CARRIER CONFIGS POLICIES
CREATE POLICY "carriers_public_select" ON public.carrier_configs
  FOR SELECT USING (true);

CREATE POLICY "carriers_admin_all" ON public.carrier_configs
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

-- C. STORE SHIPPING POLICIES POLICIES
CREATE POLICY "policies_public_select" ON public.store_shipping_policies
  FOR SELECT USING (true);

CREATE POLICY "policies_owner_write" ON public.store_shipping_policies
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  ) WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

-- D. STORE SHIPPING RATES POLICIES
CREATE POLICY "rates_public_select" ON public.store_shipping_rates
  FOR SELECT USING (true);

CREATE POLICY "rates_owner_write" ON public.store_shipping_rates
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  ) WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

-- E. PICKUP HUBS POLICIES
CREATE POLICY "hubs_public_select" ON public.pickup_hubs
  FOR SELECT USING (true);

CREATE POLICY "hubs_admin_all" ON public.pickup_hubs
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

-- F. SHIPMENTS POLICIES
CREATE POLICY "shipments_buyer_seller_read" ON public.shipments
  FOR SELECT USING (
    -- Authenticated user is the buyer who made the parent order
    child_order_id IN (
      SELECT id FROM public.child_orders
      WHERE parent_id IN (
        SELECT id FROM public.parent_orders
        WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
    OR
    -- Authenticated user is the seller/owner of the store fulfilling the order
    child_order_id IN (
      SELECT id FROM public.child_orders
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
    OR
    -- Authenticated user is an admin or moderator
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

CREATE POLICY "shipments_seller_admin_write" ON public.shipments
  FOR ALL USING (
    child_order_id IN (
      SELECT id FROM public.child_orders
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
    OR
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  ) WITH CHECK (
    child_order_id IN (
      SELECT id FROM public.child_orders
      WHERE store_id IN (
        SELECT id FROM public.stores
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
    OR
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

-- 11. TRIGGER FUNCTIONS AND LOGIC

-- TRIGGER 1: PROPAGATE TRACKING INFORMATION ON SHIPMENTS INSERT
CREATE OR REPLACE FUNCTION public.handle_shipment_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_carrier_name VARCHAR(100);
BEGIN
  -- Resolve carrier name from configuration if associated
  IF NEW.carrier_id IS NOT NULL THEN
    SELECT name INTO v_carrier_name
    FROM public.carrier_configs
    WHERE id = NEW.carrier_id;
  END IF;

  -- Update associated child order
  UPDATE public.child_orders
  SET 
    tracking_number = NEW.tracking_number,
    carrier = COALESCE(v_carrier_name, 'Medina Express Delivery'),
    shipping_label_url = NEW.shipping_label_url,
    estimated_delivery = NEW.estimated_delivery,
    shipped_at = COALESCE(NEW.shipped_at, NOW()),
    status = 'shipped',
    updated_at = NOW()
  WHERE id = NEW.child_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_shipment_insert
AFTER INSERT ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.handle_shipment_insert();

-- TRIGGER 2: PROPAGATE STATUS CHANGES TO CHILD ORDERS ON SHIPMENT DELIVERED
CREATE OR REPLACE FUNCTION public.handle_shipment_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When the shipment status is updated to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    -- Transition child order to 'delivered' status
    UPDATE public.child_orders
    SET 
      status = 'delivered',
      delivered_at = COALESCE(NEW.delivered_at, NOW()),
      updated_at = NOW()
    WHERE id = NEW.child_order_id;
  END IF;

  -- If shipment transitions to failed or out_for_delivery, optionally update child order state
  IF NEW.status = 'out_for_delivery' AND OLD.status IS DISTINCT FROM 'out_for_delivery' THEN
    UPDATE public.child_orders
    SET 
      status = 'out_for_delivery',
      updated_at = NOW()
    WHERE id = NEW.child_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_shipment_delivery
AFTER UPDATE OF status ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.handle_shipment_delivery();

-- TRIGGER 3: AUTO-CREATE DEFAULT SHIPPING POLICY WHEN A STORE IS CREATED
CREATE OR REPLACE FUNCTION public.handle_store_created_shipping_policy()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default shipping policy with Essaouira coordinates
  INSERT INTO public.store_shipping_policies (
    store_id,
    offers_local_pickup,
    local_pickup_address,
    local_pickup_coords,
    local_pickup_fee,
    offers_national,
    offers_international,
    free_shipping_threshold_mad,
    handling_time_days,
    ships_from_city,
    ships_from_coords
  ) VALUES (
    NEW.id,
    false,
    'Essaouira Medina Partner Pickup Hub',
    ST_SetSRID(ST_Point(-9.7595, 31.5085), 4326), -- Essaouira Medina center coordinates
    0.00,
    true,
    false,
    NULL,
    1,
    'Essaouira',
    ST_SetSRID(ST_Point(-9.7595, 31.5085), 4326)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_store_created_shipping_policy
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_created_shipping_policy();
