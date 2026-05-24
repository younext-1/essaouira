-- =========================================================
-- MIGRATION: 016_ORDER_MANAGEMENT_SYSTEM.SQL
-- PRODUCTION-READY ORDER MANAGEMENT SYSTEM (OMS)
-- =========================================================

BEGIN;

-- 1. PREPARE THE DATABASE FOR UPGRADE
-- Drop dependent triggers and tables to ensure a clean slate, cascades will clean foreign key dependencies.
DROP TRIGGER IF EXISTS trg_validate_child_order_transitions ON public.child_orders CASCADE;
DROP TRIGGER IF EXISTS trg_log_child_order_status_changes ON public.child_orders CASCADE;
DROP TRIGGER IF EXISTS trg_on_child_order_insert ON public.child_orders CASCADE;
DROP TRIGGER IF EXISTS trg_populate_item_product_snapshot ON public.order_items CASCADE;
DROP TRIGGER IF EXISTS trg_on_dispute_opened ON public.order_disputes CASCADE;
DROP TRIGGER IF EXISTS trg_on_dispute_resolved ON public.order_disputes CASCADE;

DROP TABLE IF EXISTS public.order_disputes CASCADE;
DROP TABLE IF EXISTS public.order_history CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.child_orders CASCADE;
DROP TABLE IF EXISTS public.parent_orders CASCADE;

-- 2. CREATE UPGRADED PARENT ORDERS TABLE
CREATE TABLE public.parent_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
  notes TEXT,
  -- Retaining optional fields for compatibility with existing checkout flows
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  shipping_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_total >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE UPGRADED CHILD ORDERS TABLE
CREATE TABLE public.child_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.parent_orders(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled',
    'refund_requested',
    'refunded'
  )) DEFAULT 'pending',
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
  seller_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (seller_earnings >= 0),
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),
  shipping_label_url VARCHAR(500),
  estimated_delivery DATE,
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason VARCHAR(255),
  seller_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE UPGRADED ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  selected_options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE ORDER HISTORY TABLE
CREATE TABLE public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  from_status VARCHAR(50) NOT NULL,
  to_status VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role VARCHAR(20) NOT NULL CHECK (actor_role IN ('buyer', 'seller', 'system', 'admin')),
  note TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CREATE ORDER DISPUTES TABLE
CREATE TABLE public.order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'item_not_received',
    'item_damaged',
    'item_not_as_described',
    'seller_unresponsive',
    'other'
  )),
  description TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  resolution VARCHAR(20) CHECK (resolution IN ('refund_buyer', 'release_seller', 'partial_refund')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 7. RE-LINK REFERENCES IN ESCROW LEDGER AND OTHER TABLES
-- Re-create reference in escrow_ledgers
ALTER TABLE IF EXISTS public.escrow_ledgers 
  DROP CONSTRAINT IF EXISTS escrow_ledgers_child_order_id_fkey,
  ADD CONSTRAINT escrow_ledgers_child_order_id_fkey 
    FOREIGN KEY (child_order_id) REFERENCES public.child_orders(id) ON DELETE CASCADE;

-- Re-create reference in refund_requests
ALTER TABLE IF EXISTS public.refund_requests 
  DROP CONSTRAINT IF EXISTS refund_requests_child_order_id_fkey,
  ADD CONSTRAINT refund_requests_child_order_id_fkey 
    FOREIGN KEY (child_order_id) REFERENCES public.child_orders(id) ON DELETE CASCADE;

-- 8. INDEXES ON COMMONLY FILTERED COLUMNS
CREATE INDEX IF NOT EXISTS idx_parent_orders_buyer ON public.parent_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_parent_orders_checkout ON public.parent_orders(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_parent ON public.child_orders(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_store ON public.child_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_status ON public.child_orders(status);
CREATE INDEX IF NOT EXISTS idx_child_orders_created ON public.child_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_child ON public.order_items(child_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_history_child ON public.order_history(child_order_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_child ON public.order_disputes(child_order_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_status ON public.order_disputes(status);

-- 9. TRANSACTION-SAFE DATABASE TRIGGERS & FUNCTIONS

-- A. Validate State Transitions (BEFORE UPDATE)
CREATE OR REPLACE FUNCTION public.validate_child_order_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- If status hasn't changed, just return NEW
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Enforce strict transition graph
  IF NOT (
    (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled')) OR
    (OLD.status = 'confirmed' AND NEW.status IN ('processing', 'cancelled')) OR
    (OLD.status = 'processing' AND NEW.status IN ('shipped', 'cancelled')) OR
    (OLD.status = 'shipped' AND NEW.status IN ('out_for_delivery', 'delivered')) OR
    (OLD.status = 'out_for_delivery' AND NEW.status = 'delivered') OR
    (OLD.status = 'delivered' AND NEW.status IN ('completed', 'refund_requested')) OR
    (OLD.status = 'refund_requested' AND NEW.status IN ('refunded', 'processing'))
  ) THEN
    RAISE EXCEPTION 'Invalid status transition: % to %', OLD.status, NEW.status;
  END IF;

  -- Set status-specific timestamps automatically
  IF NEW.status = 'confirmed' THEN
    NEW.confirmed_at = NOW();
  ELSIF NEW.status = 'shipped' THEN
    NEW.shipped_at = NOW();
  ELSIF NEW.status = 'delivered' THEN
    NEW.delivered_at = NOW();
  ELSIF NEW.status = 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status = 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_child_order_transitions
BEFORE UPDATE OF status ON public.child_orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_child_order_transition();

-- B. Stock Restoration Function
CREATE OR REPLACE FUNCTION public.restore_order_stock(p_child_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN 
    SELECT product_id, variant_id, quantity 
    FROM public.order_items 
    WHERE child_order_id = p_child_order_id
  LOOP
    -- Restore quantity back to product_inventory
    UPDATE public.product_inventory
    SET quantity = quantity + v_item.quantity,
        last_updated = NOW()
    WHERE product_id = v_item.product_id
      AND (variant_id = v_item.variant_id OR (variant_id IS NULL AND v_item.variant_id IS NULL));
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- C. Handle State Transition Side-Effects (AFTER UPDATE)
CREATE OR REPLACE FUNCTION public.handle_child_order_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    -- 1. Automatically write history log
    INSERT INTO public.order_history (
      child_order_id,
      from_status,
      to_status,
      actor_role,
      note,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'system',
      'System transitioned order status from ' || OLD.status || ' to ' || NEW.status || '.',
      NOW()
    );

    -- 2. Escrow release trigger on Completed
    IF NEW.status = 'completed' THEN
      UPDATE public.escrow_ledgers
      SET status = 'released',
          released_at = NOW(),
          release_trigger = 'buyer_confirmed'
      WHERE child_order_id = NEW.id AND status = 'holding';
    END IF;

    -- 3. Escrow refund trigger on Refunded
    IF NEW.status = 'refunded' THEN
      UPDATE public.escrow_ledgers
      SET status = 'refunded',
          released_at = NOW(),
          release_trigger = 'dispute_resolved'
      WHERE child_order_id = NEW.id AND status IN ('holding', 'disputed');
    END IF;

    -- 4. Stock recovery on Cancelled
    IF NEW.status = 'cancelled' THEN
      PERFORM public.restore_order_stock(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_child_order_status_changes
AFTER UPDATE OF status ON public.child_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_child_order_status_changes();

-- D. Initial Order History Entry on Insert (AFTER INSERT)
CREATE OR REPLACE FUNCTION public.handle_child_order_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.order_history (
    child_order_id,
    from_status,
    to_status,
    actor_role,
    note,
    created_at
  ) VALUES (
    NEW.id,
    'none',
    NEW.status,
    'system',
    'Order created in ' || NEW.status || ' status.',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_child_order_insert
AFTER INSERT ON public.child_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_child_order_insert();

-- E. Auto-Populate Product Snapshot on Order Items Insert (BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.populate_item_product_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name VARCHAR;
  v_product_image VARCHAR;
  v_store_name VARCHAR;
  v_variant_name VARCHAR;
  v_variant_sku VARCHAR;
  v_snapshot JSONB;
BEGIN
  -- Fetch product details and store name
  SELECT p.name, COALESCE(p.images[1], ''), s.name
  INTO v_product_name, v_product_image, v_store_name
  FROM public.products p
  JOIN public.stores s ON s.id = p.store_id
  WHERE p.id = NEW.product_id;

  -- Fetch variant details if variant_id is selected
  IF NEW.variant_id IS NOT NULL THEN
    SELECT name, sku
    INTO v_variant_name, v_variant_sku
    FROM public.product_variants
    WHERE id = NEW.variant_id;
  END IF;

  -- Compile full offline-capable snapshot JSONB
  v_snapshot = jsonb_build_object(
    'name', COALESCE(v_product_name, 'Deleted Product'),
    'image', COALESCE(v_product_image, ''),
    'price', NEW.unit_price,
    'store_name', COALESCE(v_store_name, 'Unknown Store'),
    'variant_details', CASE 
      WHEN NEW.variant_id IS NOT NULL THEN 
        jsonb_build_object('name', COALESCE(v_variant_name, 'Unknown Variant'), 'sku', COALESCE(v_variant_sku, ''))
      ELSE 
        NULL 
      END
  );

  NEW.product_snapshot = v_snapshot;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_populate_item_product_snapshot
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.populate_item_product_snapshot();

-- F. Dispute Opened Freezer Trigger
CREATE OR REPLACE FUNCTION public.handle_dispute_opened()
RETURNS TRIGGER AS $$
BEGIN
  -- Lock the associated escrow ledger into 'disputed' state
  UPDATE public.escrow_ledgers
  SET status = 'disputed',
      dispute_opened_at = NOW(),
      hold_reason = 'Escrow frozen due to active order dispute: ' || NEW.description
  WHERE child_order_id = NEW.child_order_id;
  
  -- Log entry to order_history
  INSERT INTO public.order_history (
    child_order_id,
    from_status,
    to_status,
    actor_id,
    actor_role,
    note
  ) VALUES (
    NEW.child_order_id,
    (SELECT status FROM public.child_orders WHERE id = NEW.child_order_id),
    (SELECT status FROM public.child_orders WHERE id = NEW.child_order_id),
    NEW.opened_by,
    'buyer',
    'Dispute opened by buyer. Reason: ' || NEW.reason
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_dispute_opened
AFTER INSERT ON public.order_disputes
FOR EACH ROW
EXECUTE FUNCTION public.handle_dispute_opened();

-- G. Dispute Resolved Trigger
CREATE OR REPLACE FUNCTION public.handle_dispute_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
    -- Log resolution audit trail
    INSERT INTO public.order_history (
      child_order_id,
      from_status,
      to_status,
      actor_id,
      actor_role,
      note
    ) VALUES (
      NEW.child_order_id,
      (SELECT status FROM public.child_orders WHERE id = NEW.child_order_id),
      CASE 
        WHEN NEW.resolution = 'refund_buyer' THEN 'refunded'
        ELSE 'completed'
      END,
      NEW.resolved_by,
      'admin',
      'Dispute resolved by Admin. Action: ' || NEW.resolution || '. Notes: ' || COALESCE(NEW.resolution_notes, '')
    );

    IF NEW.resolution = 'refund_buyer' THEN
      -- Release escrow back to customer (status = refunded)
      UPDATE public.escrow_ledgers
      SET status = 'refunded',
          released_at = NOW(),
          release_trigger = 'dispute_resolved'
      WHERE child_order_id = NEW.child_order_id;

      -- Transition order to 'refunded'
      UPDATE public.child_orders
      SET status = 'refunded'
      WHERE id = NEW.child_order_id;

    ELSIF NEW.resolution = 'release_seller' THEN
      -- Release escrow to artisan (status = released)
      UPDATE public.escrow_ledgers
      SET status = 'released',
          released_at = NOW(),
          release_trigger = 'dispute_resolved'
      WHERE child_order_id = NEW.child_order_id;

      -- Transition order to 'completed'
      UPDATE public.child_orders
      SET status = 'completed'
      WHERE id = NEW.child_order_id;

    ELSIF NEW.resolution = 'partial_refund' THEN
      -- Escrow released (payout split net adjusted manually or released)
      UPDATE public.escrow_ledgers
      SET status = 'released',
          released_at = NOW(),
          release_trigger = 'dispute_resolved'
      WHERE child_order_id = NEW.child_order_id;

      -- Transition order to 'completed'
      UPDATE public.child_orders
      SET status = 'completed'
      WHERE id = NEW.child_order_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_dispute_resolved
AFTER UPDATE OF status ON public.order_disputes
FOR EACH ROW
EXECUTE FUNCTION public.handle_dispute_resolved();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.parent_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

-- Parent Orders
CREATE POLICY "parent_orders_buyer_select" ON public.parent_orders
  FOR SELECT USING (buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()));

CREATE POLICY "parent_orders_admin_all" ON public.parent_orders
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

CREATE POLICY "parent_orders_service_insert" ON public.parent_orders
  FOR INSERT WITH CHECK (true); -- allowed for backend / service role insertions

-- Child Orders
CREATE POLICY "child_orders_buyer_select" ON public.child_orders
  FOR SELECT USING (
    parent_id IN (SELECT id FROM public.parent_orders WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
  );

CREATE POLICY "child_orders_seller_select" ON public.child_orders
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
  );

CREATE POLICY "child_orders_admin_all" ON public.child_orders
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

CREATE POLICY "child_orders_service_insert_update" ON public.child_orders
  FOR ALL USING (true); -- allowed for backend

-- Order Items
CREATE POLICY "order_items_buyer_select" ON public.order_items
  FOR SELECT USING (
    child_order_id IN (
      SELECT id FROM public.child_orders 
      WHERE parent_id IN (
        SELECT id FROM public.parent_orders 
        WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "order_items_seller_select" ON public.order_items
  FOR SELECT USING (
    child_order_id IN (
      SELECT id FROM public.child_orders 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

CREATE POLICY "order_items_service_all" ON public.order_items
  FOR ALL USING (true);

-- Order History
CREATE POLICY "order_history_buyer_select" ON public.order_history
  FOR SELECT USING (
    child_order_id IN (
      SELECT id FROM public.child_orders 
      WHERE parent_id IN (
        SELECT id FROM public.parent_orders 
        WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "order_history_seller_select" ON public.order_history
  FOR SELECT USING (
    child_order_id IN (
      SELECT id FROM public.child_orders 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "order_history_admin_all" ON public.order_history
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

CREATE POLICY "order_history_service_all" ON public.order_history
  FOR ALL USING (true);

-- Order Disputes
CREATE POLICY "order_disputes_buyer_select" ON public.order_disputes
  FOR SELECT USING (
    opened_by IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

CREATE POLICY "order_disputes_seller_select" ON public.order_disputes
  FOR SELECT USING (
    child_order_id IN (
      SELECT id FROM public.child_orders 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
      )
    )
  );

CREATE POLICY "order_disputes_admin_all" ON public.order_disputes
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) IN ('admin', 'moderator')
  );

CREATE POLICY "order_disputes_service_all" ON public.order_disputes
  FOR ALL USING (true);

COMMIT;
