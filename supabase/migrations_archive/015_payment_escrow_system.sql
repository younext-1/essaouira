-- =========================================================
-- Migration 015: Payment System with Escrow
-- =========================================================

-- 1. DROP CONFLICTING OR OLD TABLES Safely
DROP TABLE IF EXISTS public.refund_requests CASCADE;
DROP TABLE IF EXISTS public.commission_rules CASCADE;
DROP TABLE IF EXISTS public.payout_requests CASCADE;
DROP TABLE IF EXISTS public.seller_balances CASCADE;
DROP TABLE IF EXISTS public.escrow_ledgers CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.child_orders CASCADE;
DROP TABLE IF EXISTS public.parent_orders CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 2. CREATE PARENT ORDERS TABLE
CREATE TABLE public.parent_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')) DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_total >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE CHILD ORDERS TABLE
CREATE TABLE public.child_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID REFERENCES public.parent_orders(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'disputed', 'refunded')) DEFAULT 'pending',
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE ORDER ITEMS TABLE (UPGRADED)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
  variant_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE PAYMENT METHODS TABLE
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('card', 'bank_transfer', 'cod')),
  last4 VARCHAR,
  brand VARCHAR,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CREATE TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
  parent_order_id UUID REFERENCES public.parent_orders(id) ON DELETE SET NULL,
  gateway VARCHAR NOT NULL CHECK (gateway IN ('stripe', 'cod', 'bank_transfer')),
  gateway_transaction_id VARCHAR UNIQUE,
  gateway_response JSONB,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR NOT NULL DEFAULT 'MAD',
  exchange_rate NUMERIC NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  amount_mad NUMERIC(10, 2) NOT NULL CHECK (amount_mad >= 0),
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CREATE ESCROW LEDGERS TABLE
CREATE TABLE public.escrow_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  gross_amount NUMERIC(10, 2) NOT NULL CHECK (gross_amount >= 0),
  platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  net_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('holding', 'released', 'refunded', 'disputed')) DEFAULT 'holding',
  hold_reason VARCHAR,
  release_trigger VARCHAR CHECK (release_trigger IN ('buyer_confirmed', 'auto_7days', 'admin_manual', 'dispute_resolved')),
  held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  dispute_opened_at TIMESTAMPTZ
);

-- 8. CREATE SELLER BALANCES TABLE
CREATE TABLE public.seller_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE NOT NULL,
  available_mad NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  pending_mad NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (pending_mad >= 0),
  total_earned_mad NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned_mad >= 0),
  total_withdrawn_mad NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn_mad >= 0),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CREATE PAYOUT REQUESTS TABLE
CREATE TABLE public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 100.00), -- minimum 100 MAD
  method VARCHAR NOT NULL CHECK (method IN ('bank_transfer', 'cash', 'mobile_money')),
  bank_details JSONB NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason VARCHAR,
  reference_number VARCHAR
);

-- 10. CREATE COMMISSION RULES TABLE
CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR,
  store_tier_id UUID REFERENCES public.store_tiers(id) ON DELETE SET NULL,
  rate NUMERIC(5, 4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  min_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_fee >= 0),
  max_fee NUMERIC(10, 2) CHECK (max_fee >= min_fee),
  is_default BOOLEAN NOT NULL DEFAULT false,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. CREATE REFUND REQUESTS TABLE
CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason VARCHAR NOT NULL CHECK (reason IN ('not_received', 'damaged', 'not_as_described', 'changed_mind', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}'::TEXT[],
  amount_requested NUMERIC(10, 2) NOT NULL CHECK (amount_requested >= 0),
  amount_approved NUMERIC(10, 2) CHECK (amount_approved >= 0),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. CREATE INDEXES ON COMMONLY QUERIED COLUMNS
CREATE INDEX IF NOT EXISTS idx_parent_orders_buyer ON public.parent_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_parent_orders_status ON public.parent_orders(status);

CREATE INDEX IF NOT EXISTS idx_child_orders_parent ON public.child_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_store ON public.child_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_status ON public.child_orders(status);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_parent ON public.transactions(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_ledgers(status);
CREATE INDEX IF NOT EXISTS idx_escrow_store ON public.escrow_ledgers(store_id);
CREATE INDEX IF NOT EXISTS idx_escrow_child_order ON public.escrow_ledgers(child_order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_held ON public.escrow_ledgers(held_at);

CREATE INDEX IF NOT EXISTS idx_seller_balances_store ON public.seller_balances(store_id);

CREATE INDEX IF NOT EXISTS idx_payouts_store ON public.payout_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested ON public.payout_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_refunds_child_order ON public.refund_requests(child_order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_buyer ON public.refund_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refund_requests(status);

-- =========================================================
-- PL/pgSQL DATABASE TRIGGERS & AUTOMATIONS
-- =========================================================

-- Trigger to automatically hold funds (Increment pending balance)
CREATE OR REPLACE FUNCTION public.handle_escrow_held()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'holding' THEN
    INSERT INTO public.seller_balances (store_id, pending_mad, available_mad, total_earned_mad, total_withdrawn_mad, last_updated)
    VALUES (NEW.store_id, NEW.gross_amount, 0.00, 0.00, 0.00, NOW())
    ON CONFLICT (store_id) DO UPDATE
    SET pending_mad = public.seller_balances.pending_mad + NEW.gross_amount,
        last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_escrow_held
AFTER INSERT ON public.escrow_ledgers
FOR EACH ROW
EXECUTE FUNCTION public.handle_escrow_held();

-- Trigger to automatically release or refund funds
CREATE OR REPLACE FUNCTION public.handle_escrow_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Transition from holding to released (Available increases, pending decreases)
  IF OLD.status = 'holding' AND NEW.status = 'released' THEN
    UPDATE public.seller_balances
    SET pending_mad = GREATEST(0.00, pending_mad - OLD.gross_amount),
        available_mad = available_mad + NEW.net_amount,
        total_earned_mad = total_earned_mad + NEW.net_amount,
        last_updated = NOW()
    WHERE store_id = NEW.store_id;
  
  -- Transition from holding to refunded (Pending decreases, no change to available)
  ELSIF OLD.status = 'holding' AND NEW.status = 'refunded' THEN
    UPDATE public.seller_balances
    SET pending_mad = GREATEST(0.00, pending_mad - OLD.gross_amount),
        last_updated = NOW()
    WHERE store_id = NEW.store_id;

  -- Transition from holding to disputed (no immediate balance deductions, kept in pending/holding until resolution)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_escrow_update
AFTER UPDATE ON public.escrow_ledgers
FOR EACH ROW
EXECUTE FUNCTION public.handle_escrow_update();

-- Trigger to automatically deduct available balance on payout completion
CREATE OR REPLACE FUNCTION public.handle_payout_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.seller_balances
    SET available_mad = GREATEST(-100000.00, available_mad - NEW.amount), -- allow negative balance for adjustments
        total_withdrawn_mad = total_withdrawn_mad + NEW.amount,
        last_updated = NOW()
    WHERE store_id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_payout_completed
AFTER UPDATE ON public.payout_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_payout_completed();

-- Helper function to check if the current user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE clerk_id = public.get_clerk_id()),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS on all newly created tables
ALTER TABLE public.parent_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- 1. parent_orders
CREATE POLICY "parent_orders_buyer_select" ON public.parent_orders
  FOR SELECT USING (buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()) OR public.is_admin_user());

CREATE POLICY "parent_orders_admin_all" ON public.parent_orders
  FOR ALL USING (public.is_admin_user());

-- 2. child_orders
CREATE POLICY "child_orders_buyer_select" ON public.child_orders
  FOR SELECT USING (
    parent_order_id IN (SELECT id FROM public.parent_orders WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
    OR public.is_admin_user()
  );

CREATE POLICY "child_orders_seller_select" ON public.child_orders
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
  );

CREATE POLICY "child_orders_admin_all" ON public.child_orders
  FOR ALL USING (public.is_admin_user());

-- 3. order_items
CREATE POLICY "order_items_buyer_select" ON public.order_items
  FOR SELECT USING (
    child_order_id IN (SELECT id FROM public.child_orders WHERE parent_order_id IN (SELECT id FROM public.parent_orders WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())))
    OR public.is_admin_user()
  );

CREATE POLICY "order_items_seller_select" ON public.order_items
  FOR SELECT USING (
    child_order_id IN (SELECT id FROM public.child_orders WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())))
  );

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL USING (public.is_admin_user());

-- 4. payment_methods
CREATE POLICY "payment_methods_owner_all" ON public.payment_methods
  FOR ALL USING (buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()) OR public.is_admin_user());

-- 5. transactions
CREATE POLICY "transactions_buyer_select" ON public.transactions
  FOR SELECT USING (
    parent_order_id IN (SELECT id FROM public.parent_orders WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
    OR public.is_admin_user()
  );

CREATE POLICY "transactions_seller_select" ON public.transactions
  FOR SELECT USING (
    id IN (SELECT transaction_id FROM public.escrow_ledgers WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())))
  );

CREATE POLICY "transactions_admin_all" ON public.transactions
  FOR ALL USING (public.is_admin_user());

-- 6. escrow_ledgers
CREATE POLICY "escrow_buyer_select" ON public.escrow_ledgers
  FOR SELECT USING (
    child_order_id IN (SELECT id FROM public.child_orders WHERE parent_order_id IN (SELECT id FROM public.parent_orders WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())))
    OR public.is_admin_user()
  );

CREATE POLICY "escrow_seller_select" ON public.escrow_ledgers
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
  );

CREATE POLICY "escrow_admin_all" ON public.escrow_ledgers
  FOR ALL USING (public.is_admin_user());

-- 7. seller_balances
CREATE POLICY "balances_seller_select" ON public.seller_balances
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
  );

CREATE POLICY "balances_admin_all" ON public.seller_balances
  FOR ALL USING (public.is_admin_user());

-- 8. payout_requests
CREATE POLICY "payout_seller_all" ON public.payout_requests
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()))
  );

CREATE POLICY "payout_admin_all" ON public.payout_requests
  FOR ALL USING (public.is_admin_user());

-- 9. commission_rules
CREATE POLICY "commission_rules_public_select" ON public.commission_rules
  FOR SELECT USING (true);

CREATE POLICY "commission_rules_admin_all" ON public.commission_rules
  FOR ALL USING (public.is_admin_user());

-- 10. refund_requests
CREATE POLICY "refund_buyer_all" ON public.refund_requests
  FOR ALL USING (
    buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  );

CREATE POLICY "refund_seller_select" ON public.refund_requests
  FOR SELECT USING (
    child_order_id IN (SELECT id FROM public.child_orders WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())))
  );

CREATE POLICY "refund_admin_all" ON public.refund_requests
  FOR ALL USING (public.is_admin_user());
