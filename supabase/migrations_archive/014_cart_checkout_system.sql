-- =========================================================
-- Migration 014: Cart and Checkout Management System
-- =========================================================

-- 1. DROP CONFLICTING STRUCTURES Safely
DROP TRIGGER IF EXISTS trg_touch_cart_updated_at ON public.cart_items CASCADE;
DROP TRIGGER IF EXISTS trg_set_cart_expiry ON public.carts CASCADE;
DROP TRIGGER IF EXISTS trg_checkout_abandoned_release_locks ON public.checkout_sessions CASCADE;
DROP TABLE IF EXISTS public.abandoned_checkouts CASCADE;
DROP TABLE IF EXISTS public.checkout_sessions CASCADE;
DROP TABLE IF EXISTS public.coupon_usages CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;
DROP TABLE IF EXISTS public.inventory_locks CASCADE;

-- 2. RECREATE INVENTORY LOCKS TABLE WITH NON-UNIQUE checkout_id
CREATE TABLE public.inventory_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id VARCHAR NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  released BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_locks_checkout ON public.inventory_locks(checkout_id);
CREATE INDEX IF NOT EXISTS idx_locks_expires ON public.inventory_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_locks_released ON public.inventory_locks(released);

-- 3. CREATE CARTS TABLE
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_token VARCHAR UNIQUE,
  status VARCHAR NOT NULL CHECK (status IN ('active', 'checked_out', 'abandoned', 'merged')) DEFAULT 'active',
  coupon_code VARCHAR,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_carts_buyer ON public.carts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_carts_guest ON public.carts(guest_token);
CREATE INDEX IF NOT EXISTS idx_carts_status ON public.carts(status);
CREATE INDEX IF NOT EXISTS idx_carts_expires ON public.carts(expires_at);

-- 4. CREATE CART ITEMS TABLE
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_add NUMERIC(10, 2) NOT NULL CHECK (price_at_add >= 0),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- 5. CREATE COUPONS TABLE
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR UNIQUE NOT NULL,
  discount_type VARCHAR NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(10, 2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  max_usages INTEGER NOT NULL DEFAULT 0 CHECK (max_usages >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  applicable_product_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  applicable_store_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- 6. CREATE COUPON USAGES TABLE
CREATE TABLE public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coupon_buyer UNIQUE (coupon_id, buyer_id)
);

-- 7. CREATE CHECKOUT SESSIONS TABLE
CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status VARCHAR NOT NULL CHECK (status IN ('initiated', 'payment_pending', 'payment_failed', 'completed', 'abandoned')) DEFAULT 'initiated',
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  partitioned_stores JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_total NUMERIC(10, 2) NOT NULL CHECK (shipping_total >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_intent_id VARCHAR,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_buyer ON public.checkout_sessions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_checkout_status ON public.checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_expires ON public.checkout_sessions(expires_at);

-- 8. CREATE ABANDONED CHECKOUTS TABLE
CREATE TABLE public.abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE CASCADE NOT NULL,
  buyer_email VARCHAR,
  cart_snapshot JSONB NOT NULL,
  recovery_token VARCHAR UNIQUE NOT NULL,
  recovery_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  discount_offered NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_offered >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_recovery_token ON public.abandoned_checkouts(recovery_token);

-- =========================================================
-- PL/pgSQL PROCEDURES & ATOMIC FUNCTIONS (INVENTORY HARDENING)
-- =========================================================

-- Recreate or update reserve_stock to support multiple products without checkout_id uniqueness constraint
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_product_id UUID,
  p_variant_id UUID,
  p_qty INTEGER,
  p_checkout_id VARCHAR,
  p_ttl_minutes INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
  v_reserved INTEGER;
  v_quantity INTEGER;
  v_cleaned_variant_id UUID;
BEGIN
  v_cleaned_variant_id := COALESCE(p_variant_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- 1. Ensure the product exists
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product % does not exist', p_product_id;
  END IF;

  -- 2. Ensure variant exists
  IF p_variant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.product_variants WHERE id = p_variant_id) THEN
    RAISE EXCEPTION 'Variant % does not exist', p_variant_id;
  END IF;

  -- 3. Preseed inventory item if missing
  INSERT INTO public.product_inventory (product_id, variant_id, quantity, reserved)
  VALUES (p_product_id, p_variant_id, 0, 0)
  ON CONFLICT (product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- 4. Exclusively lock product inventory row
  IF p_variant_id IS NULL THEN
    SELECT quantity, reserved, available INTO v_quantity, v_reserved, v_available
    FROM public.product_inventory
    WHERE product_id = p_product_id AND variant_id IS NULL
    FOR UPDATE;
  ELSE
    SELECT quantity, reserved, available INTO v_quantity, v_reserved, v_available
    FROM public.product_inventory
    WHERE product_id = p_product_id AND variant_id = p_variant_id
    FOR UPDATE;
  END IF;

  -- 5. Stock check validation
  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Inventory not seeded';
  END IF;

  IF v_available < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock. Requested %, available %', p_qty, v_available;
  END IF;

  -- 6. Insert new lock record (multiple rows per checkout_id are fine)
  INSERT INTO public.inventory_locks (product_id, variant_id, quantity, checkout_id, expires_at)
  VALUES (p_product_id, p_variant_id, p_qty, p_checkout_id, NOW() + (p_ttl_minutes || ' minutes')::interval);

  -- 7. Add reservation count to inventory
  IF p_variant_id IS NULL THEN
    UPDATE public.product_inventory
    SET reserved = reserved + p_qty, last_updated = NOW()
    WHERE product_id = p_product_id AND variant_id IS NULL;
  ELSE
    UPDATE public.product_inventory
    SET reserved = reserved + p_qty, last_updated = NOW()
    WHERE product_id = p_product_id AND variant_id = p_variant_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Recreate or update release_stock to support multiple products under the same checkout_id
CREATE OR REPLACE FUNCTION public.release_stock(
  p_checkout_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_lock RECORD;
  v_released_any BOOLEAN := FALSE;
BEGIN
  -- Iterate through active, non-released locks for this checkout session
  FOR v_lock IN 
    SELECT * FROM public.inventory_locks 
    WHERE checkout_id = p_checkout_id AND released = false
    FOR UPDATE
  LOOP
    -- Decrement reserved count in inventory
    IF v_lock.variant_id IS NULL THEN
      UPDATE public.product_inventory
      SET reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW()
      WHERE product_id = v_lock.product_id AND variant_id IS NULL;
    ELSE
      UPDATE public.product_inventory
      SET reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW()
      WHERE product_id = v_lock.product_id AND variant_id = v_lock.variant_id;
    END IF;

    -- Update lock status
    UPDATE public.inventory_locks
    SET released = true
    WHERE id = v_lock.id;

    v_released_any := TRUE;
  END LOOP;

  RETURN v_released_any;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Recreate confirm_stock_deduction to support multiple locks under the same checkout_id
CREATE OR REPLACE FUNCTION public.confirm_stock_deduction(
  p_checkout_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_lock RECORD;
  v_deducted_any BOOLEAN := FALSE;
BEGIN
  FOR v_lock IN 
    SELECT * FROM public.inventory_locks 
    WHERE checkout_id = p_checkout_id AND released = false
    FOR UPDATE
  LOOP
    -- Deduct both physical quantity and reserved counts
    IF v_lock.variant_id IS NULL THEN
      UPDATE public.product_inventory
      SET quantity = GREATEST(0, quantity - v_lock.quantity),
          reserved = GREATEST(0, reserved - v_lock.quantity),
          last_updated = NOW()
      WHERE product_id = v_lock.product_id AND variant_id IS NULL;
    ELSE
      UPDATE public.product_inventory
      SET quantity = GREATEST(0, quantity - v_lock.quantity),
          reserved = GREATEST(0, reserved - v_lock.quantity),
          last_updated = NOW()
      WHERE product_id = v_lock.product_id AND variant_id = v_lock.variant_id;
    END IF;

    -- Mark lock as released
    UPDATE public.inventory_locks
    SET released = true
    WHERE id = v_lock.id;

    v_deducted_any := TRUE;
  END LOOP;

  RETURN v_deducted_any;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Recreate release_expired_locks to work correctly with released boolean states
CREATE OR REPLACE FUNCTION public.release_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  v_lock RECORD;
  v_released_count INTEGER := 0;
BEGIN
  -- Fetch all active locks that have expired
  FOR v_lock IN 
    SELECT DISTINCT checkout_id FROM public.inventory_locks 
    WHERE expires_at < NOW() AND released = false
  LOOP
    IF public.release_stock(v_lock.checkout_id) THEN
      v_released_count := v_released_count + 1;
    END IF;
  END LOOP;
  RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================
-- DATABASE AUTOMATIONS & TRIGGERS
-- =========================================================

-- 1. Trigger for Cart Expiry (Update expiry on modifications)
CREATE OR REPLACE FUNCTION public.fn_set_cart_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_cart_expiry
BEFORE INSERT OR UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_cart_expiry();


-- 2. Trigger to touch parent Cart's updated_at when items change
CREATE OR REPLACE FUNCTION public.fn_touch_cart_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_cart_id := OLD.cart_id;
  ELSE
    v_cart_id := NEW.cart_id;
  END IF;

  UPDATE public.carts
  SET updated_at = NOW()
  WHERE id = v_cart_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_touch_cart_updated_at
AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_touch_cart_updated_at();


-- 3. Trigger to auto-release inventory locks when checkout session transitions to abandoned
CREATE OR REPLACE FUNCTION public.fn_checkout_abandoned_release_locks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'abandoned' AND OLD.status <> 'abandoned' THEN
    PERFORM public.release_stock(NEW.id::VARCHAR);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_checkout_abandoned_release_locks
AFTER UPDATE ON public.checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.fn_checkout_abandoned_release_locks();


-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locks ENABLE ROW LEVEL SECURITY;

-- Carts Policies
CREATE POLICY "Allow select on active carts matching owner/guest" ON public.carts
  FOR SELECT USING (
    (buyer_id IS NOT NULL AND buyer_id = auth.uid()) OR 
    (guest_token IS NOT NULL)
  );

CREATE POLICY "Allow insert on active carts" ON public.carts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on active carts matching owner/guest" ON public.carts
  FOR UPDATE USING (
    (buyer_id IS NOT NULL AND buyer_id = auth.uid()) OR 
    (guest_token IS NOT NULL)
  ) WITH CHECK (true);

-- Cart Items Policies
CREATE POLICY "Allow operations on items for authenticated owner or guest" ON public.cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_id AND (
        (c.buyer_id IS NOT NULL AND c.buyer_id = auth.uid()) OR
        (c.guest_token IS NOT NULL)
      )
    )
  );

-- Coupons Policies
CREATE POLICY "Allow public read of active coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND valid_from <= NOW() AND valid_until >= NOW());

CREATE POLICY "Allow admins full coupon actions" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Coupon Usages Policies
CREATE POLICY "Allow users to read own coupon usages" ON public.coupon_usages
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Allow users to insert own coupon usages" ON public.coupon_usages
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Checkout Sessions Policies
CREATE POLICY "Allow owners to read own checkout sessions" ON public.checkout_sessions
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Allow owners to update/insert checkout sessions" ON public.checkout_sessions
  FOR ALL USING (buyer_id = auth.uid() OR buyer_id IS NULL) WITH CHECK (buyer_id = auth.uid() OR buyer_id IS NULL);

-- Abandoned Checkouts Policies
CREATE POLICY "Allow admins read abandoned checkouts" ON public.abandoned_checkouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'moderator')
    )
  );

-- Inventory Locks Policies
CREATE POLICY "Locks service role only" ON public.inventory_locks
  FOR ALL USING (false);
