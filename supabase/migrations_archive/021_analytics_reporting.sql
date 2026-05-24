-- ── 1. CREATE MARKETPLACE ANALYTICS EVENTS TABLE ──
CREATE TABLE IF NOT EXISTS public.marketplace_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100), -- Anonymous session/cookie identifier
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Authenticated user if available
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'page_view', 
    'product_view', 
    'store_view', 
    'add_to_cart', 
    'initiate_checkout', 
    'purchase'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. CREATE PERFORMANCE OPTIMIZED INDEXES ──
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_date 
  ON public.marketplace_analytics_events(store_id, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_date 
  ON public.marketplace_analytics_events(product_id, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date 
  ON public.marketplace_analytics_events(event_type, created_at);

-- ── 3. ENABLE ROW LEVEL SECURITY ──
ALTER TABLE public.marketplace_analytics_events ENABLE ROW LEVEL SECURITY;

-- ── 4. DEFINE RLS POLICIES FOR EVENTS ──

-- Allow anyone to insert analytics events (for recording guest visits)
DROP POLICY IF EXISTS "analytics_insert_public" ON public.marketplace_analytics_events;
CREATE POLICY "analytics_insert_public" ON public.marketplace_analytics_events
  FOR INSERT WITH CHECK (TRUE);

-- Store owners can view their store's events
DROP POLICY IF EXISTS "analytics_select_owner" ON public.marketplace_analytics_events;
CREATE POLICY "analytics_select_owner" ON public.marketplace_analytics_events
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
    )
  );

-- Admins and Moderators can view all events
DROP POLICY IF EXISTS "analytics_select_admin" ON public.marketplace_analytics_events;
CREATE POLICY "analytics_select_admin" ON public.marketplace_analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
    )
  );

-- ── 5. REAL-TIME VIEW METRICS SYNC TRIGGER ──
CREATE OR REPLACE FUNCTION public.sync_view_to_store_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.store_id IS NOT NULL AND NEW.event_type IN ('product_view', 'store_view') THEN
    INSERT INTO public.store_metrics (
      store_id,
      date,
      views,
      orders,
      revenue,
      avg_response_time_minutes,
      cancellation_rate
    )
    VALUES (
      NEW.store_id,
      NEW.created_at::DATE,
      1,
      0,
      0.00,
      0,
      0.00
    )
    ON CONFLICT (store_id, date) 
    DO UPDATE SET 
      views = public.store_metrics.views + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_view_analytics ON public.marketplace_analytics_events;
CREATE TRIGGER trg_handle_view_analytics
  AFTER INSERT ON public.marketplace_analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_view_to_store_metrics();

-- ── 6. REAL-TIME ORDER METRICS SYNC TRIGGER ──
CREATE OR REPLACE FUNCTION public.sync_order_to_store_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
  v_store_id UUID;
  v_total_orders INTEGER;
  v_total_cancelled INTEGER;
  v_total_revenue NUMERIC(12, 2);
  v_cancellation_rate NUMERIC(5, 2);
  v_divisor INTEGER;
BEGIN
  -- Determine store_id and date context from either old or new record
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
    v_date := OLD.created_at::DATE;
  ELSE
    v_store_id := NEW.store_id;
    v_date := NEW.created_at::DATE;
  END IF;

  IF v_store_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Count total orders for the store on this specific date
  SELECT COUNT(*), COALESCE(SUM(subtotal), 0.00)
  INTO v_total_orders, v_total_revenue
  FROM public.child_orders
  WHERE store_id = v_store_id AND created_at::DATE = v_date AND status != 'cancelled';

  -- 2. Count cancelled orders for cancellation rate calculation
  SELECT COUNT(*)
  INTO v_total_cancelled
  FROM public.child_orders
  WHERE store_id = v_store_id AND created_at::DATE = v_date AND status = 'cancelled';

  -- Re-include cancelled count in the divisor for rate calculation
  v_divisor := v_total_orders + v_total_cancelled;
  IF v_divisor > 0 THEN
    v_cancellation_rate := (v_total_cancelled::NUMERIC / v_divisor::NUMERIC) * 100.0;
  ELSE
    v_cancellation_rate := 0.00;
  END IF;

  -- 3. Upsert metrics for this store and date
  INSERT INTO public.store_metrics (
    store_id,
    date,
    views,
    orders,
    revenue,
    avg_response_time_minutes,
    cancellation_rate
  )
  VALUES (
    v_store_id,
    v_date,
    0,
    v_total_orders,
    v_total_revenue,
    0,
    v_cancellation_rate
  )
  ON CONFLICT (store_id, date) 
  DO UPDATE SET 
    orders = v_total_orders,
    revenue = v_total_revenue,
    cancellation_rate = v_cancellation_rate;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_order_metrics ON public.child_orders;
CREATE TRIGGER trg_sync_order_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.child_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_to_store_metrics();

-- ── 7. ADVANCED STORE ANALYTICS SUMMARY FUNCTION ──
CREATE OR REPLACE FUNCTION public.get_store_analytics_summary(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  views BIGINT,
  orders BIGINT,
  revenue NUMERIC(12, 2),
  cancellation_rate NUMERIC(5, 2),
  conversion_rate NUMERIC(5, 2)
) AS $$
BEGIN
  -- Validate store ownership or admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = p_store_id AND owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id())
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permissions to read analytics for this store.';
  END IF;

  RETURN QUERY
  SELECT 
    m.date,
    COALESCE(SUM(m.views), 0)::BIGINT as views,
    COALESCE(SUM(m.orders), 0)::BIGINT as orders,
    COALESCE(SUM(m.revenue), 0.00)::NUMERIC(12, 2) as revenue,
    COALESCE(AVG(m.cancellation_rate), 0.00)::NUMERIC(5, 2) as cancellation_rate,
    (CASE 
      WHEN SUM(m.views) > 0 THEN (SUM(m.orders)::NUMERIC / SUM(m.views)::NUMERIC) * 100.0
      ELSE 0.00 
     END)::NUMERIC(5, 2) as conversion_rate
  FROM public.store_metrics m
  WHERE m.store_id = p_store_id AND m.date BETWEEN p_start_date AND p_end_date
  GROUP BY m.date
  ORDER BY m.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. SYSTEM-WIDE ADMIN LEDGER SUMMARY FUNCTION ──
CREATE OR REPLACE FUNCTION public.get_admin_ledger_summary(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_volume NUMERIC(15, 2),
  total_platform_fees NUMERIC(15, 2),
  total_shipping_costs NUMERIC(15, 2),
  total_seller_earnings NUMERIC(15, 2),
  escrow_holding NUMERIC(15, 2),
  escrow_released NUMERIC(15, 2),
  escrow_refunded NUMERIC(15, 2),
  escrow_disputed NUMERIC(15, 2)
) AS $$
BEGIN
  -- Strict Admin check
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE clerk_id = public.get_clerk_id() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Admin role required for ledger summary.';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(co.subtotal), 0.00)::NUMERIC(15, 2) as total_volume,
    COALESCE(SUM(co.platform_fee), 0.00)::NUMERIC(15, 2) as total_platform_fees,
    COALESCE(SUM(co.shipping_cost), 0.00)::NUMERIC(15, 2) as total_shipping_costs,
    COALESCE(SUM(co.seller_earnings), 0.00)::NUMERIC(15, 2) as total_seller_earnings,
    COALESCE(SUM(CASE WHEN el.status = 'holding' THEN el.gross_amount ELSE 0.00 END), 0.00)::NUMERIC(15, 2) as escrow_holding,
    COALESCE(SUM(CASE WHEN el.status = 'released' THEN el.gross_amount ELSE 0.00 END), 0.00)::NUMERIC(15, 2) as escrow_released,
    COALESCE(SUM(CASE WHEN el.status = 'refunded' THEN el.gross_amount ELSE 0.00 END), 0.00)::NUMERIC(15, 2) as escrow_refunded,
    COALESCE(SUM(CASE WHEN el.status = 'disputed' THEN el.gross_amount ELSE 0.00 END), 0.00)::NUMERIC(15, 2) as escrow_disputed
  FROM public.child_orders co
  LEFT JOIN public.escrow_ledgers el ON el.child_order_id = co.id
  WHERE co.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
