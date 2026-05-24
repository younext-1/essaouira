-- =========================================================
-- Migration 014: Inventory Stock Locking and Management Procedures
-- =========================================================

-- 1. Create or replace reserve_stock RPC function
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
  -- We treat NULL variant_id as '00000000-0000-0000-0000-000000000000'::uuid for constraint checks
  v_cleaned_variant_id := COALESCE(p_variant_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Ensure the product exists first
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product % does not exist', p_product_id;
  END IF;

  -- Ensure the variant exists if specified
  IF p_variant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.product_variants WHERE id = p_variant_id) THEN
    RAISE EXCEPTION 'Variant % does not exist', p_variant_id;
  END IF;

  -- 1. Ensure the inventory row exists. If not, initialize it.
  INSERT INTO public.product_inventory (product_id, variant_id, quantity, reserved)
  VALUES (p_product_id, p_variant_id, 0, 0)
  ON CONFLICT (product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  -- 2. Lock the row using SELECT FOR UPDATE
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

  -- 3. Check if available stock is sufficient
  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Inventory record not found for product %', p_product_id;
  END IF;

  IF v_available < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock. Requested %, available %', p_qty, v_available;
  END IF;

  -- 4. Create the lock
  INSERT INTO public.inventory_locks (product_id, variant_id, quantity, checkout_id, expires_at)
  VALUES (p_product_id, p_variant_id, p_qty, p_checkout_id, NOW() + (p_ttl_minutes || ' minutes')::interval)
  ON CONFLICT (checkout_id) DO UPDATE 
  SET quantity = EXCLUDED.quantity,
      expires_at = EXCLUDED.expires_at;

  -- 5. Update the reserved count in inventory
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


-- 2. Create or replace release_stock RPC function
CREATE OR REPLACE FUNCTION public.release_stock(
  p_checkout_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_lock RECORD;
BEGIN
  -- 1. Find and lock the lock row to avoid races
  SELECT * INTO v_lock
  FROM public.inventory_locks
  WHERE checkout_id = p_checkout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Decrement reserved count in product_inventory
  IF v_lock.variant_id IS NULL THEN
    UPDATE public.product_inventory
    SET reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW()
    WHERE product_id = v_lock.product_id AND variant_id IS NULL;
  ELSE
    UPDATE public.product_inventory
    SET reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW()
    WHERE product_id = v_lock.product_id AND variant_id = v_lock.variant_id;
  END IF;

  -- 3. Delete the lock
  DELETE FROM public.inventory_locks WHERE checkout_id = p_checkout_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create or replace confirm_stock_deduction RPC function
CREATE OR REPLACE FUNCTION public.confirm_stock_deduction(
  p_checkout_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_lock RECORD;
BEGIN
  -- 1. Find and lock the lock row
  SELECT * INTO v_lock
  FROM public.inventory_locks
  WHERE checkout_id = p_checkout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Permanently deduct stock (quantity) and release reservation (reserved)
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

  -- 3. Delete the lock
  DELETE FROM public.inventory_locks WHERE checkout_id = p_checkout_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create or replace release_expired_locks RPC function
CREATE OR REPLACE FUNCTION public.release_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  v_lock RECORD;
  v_released_count INTEGER := 0;
BEGIN
  FOR v_lock IN 
    SELECT * FROM public.inventory_locks 
    WHERE expires_at < NOW()
  LOOP
    IF public.release_stock(v_lock.checkout_id) THEN
      v_released_count := v_released_count + 1;
    END IF;
  END LOOP;
  RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
