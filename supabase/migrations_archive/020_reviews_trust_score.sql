-- =========================================================
-- Migration 020: Double-Blind Reviews & Trust Scores System
-- =========================================================

BEGIN;

-- 1. CLEAN SLATE FOR REVIEWS
-- Drop old basic review tables if they exist to avoid namespace conflicts
DROP TRIGGER IF EXISTS trigger_update_rating ON public.reviews CASCADE;
DROP FUNCTION IF EXISTS public.update_product_rating() CASCADE;
DROP TABLE IF EXISTS public.helpful_votes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- 2. CREATE PRODUCT REVIEWS TABLE (Buyer reviewing product/artisan)
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID NOT NULL REFERENCES public.child_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255) NOT NULL CHECK (char_length(trim(title)) > 0),
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  images TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- A buyer can only review a specific product once per order
  CONSTRAINT unique_order_product_review UNIQUE (child_order_id, product_id)
);

-- 3. CREATE BUYER REVIEWS TABLE (Seller/Artisan reviewing buyer)
CREATE TABLE public.buyer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id UUID NOT NULL REFERENCES public.child_orders(id) ON DELETE CASCADE UNIQUE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE STORES TRUST METRICS TABLE
CREATE TABLE public.stores_trust_metrics (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (avg_rating BETWEEN 0.00 AND 5.00),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  communication_score NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (communication_score BETWEEN 0.00 AND 5.00),
  order_completion_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (order_completion_rate BETWEEN 0.00 AND 100.00),
  on_time_delivery_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (on_time_delivery_rate BETWEEN 0.00 AND 100.00),
  trust_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00 CHECK (trust_score BETWEEN 0.00 AND 100.00),
  badges TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HELPFUL VOTES TABLE (For product reviews)
CREATE TABLE public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_vote UNIQUE (review_id, profile_id)
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_published ON public.product_reviews(product_id, is_published);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer ON public.product_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_reviews_buyer_published ON public.buyer_reviews(buyer_id, is_published);
CREATE INDEX IF NOT EXISTS idx_buyer_reviews_seller ON public.buyer_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review ON public.review_helpful_votes(review_id);

-- 7. DOUBLE-BLIND GATE ENGINE AND TRIGGERS

-- Function to check and publish reviews if both parts exist or 14 days passed
CREATE OR REPLACE FUNCTION public.check_and_publish_reviews(p_child_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_buyer_has_reviewed BOOLEAN;
  v_seller_has_reviewed BOOLEAN;
  v_delivery_date TIMESTAMPTZ;
  v_window_expired BOOLEAN := FALSE;
BEGIN
  -- Check if buyer has submitted reviews for this order
  SELECT EXISTS(SELECT 1 FROM public.product_reviews WHERE child_order_id = p_child_order_id)
  INTO v_buyer_has_reviewed;

  -- Check if seller has submitted review for this order
  SELECT EXISTS(SELECT 1 FROM public.buyer_reviews WHERE child_order_id = p_child_order_id)
  INTO v_seller_has_reviewed;

  -- Check if order's delivery date is older than 14 days
  SELECT delivered_at INTO v_delivery_date FROM public.child_orders WHERE id = p_child_order_id;
  IF v_delivery_date IS NOT NULL AND (v_delivery_date + INTERVAL '14 days' <= NOW()) THEN
    v_window_expired := TRUE;
  END IF;

  -- If both reviewed OR window expired, we publish all reviews for this order
  IF (v_buyer_has_reviewed AND v_seller_has_reviewed) OR v_window_expired THEN
    -- Publish product reviews
    UPDATE public.product_reviews 
    SET is_published = TRUE, published_at = COALESCE(published_at, NOW())
    WHERE child_order_id = p_child_order_id AND is_published = FALSE;

    -- Publish buyer review
    UPDATE public.buyer_reviews 
    SET is_published = TRUE, published_at = COALESCE(published_at, NOW())
    WHERE child_order_id = p_child_order_id AND is_published = FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger functions to automatically try to publish reviews upon submission
CREATE OR REPLACE FUNCTION public.trg_fn_on_product_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform purchase validation: order must be delivered or completed, and product must be part of order_items
  IF NOT EXISTS (
    SELECT 1 FROM public.child_orders co
    JOIN public.order_items oi ON oi.child_order_id = co.id
    WHERE co.id = NEW.child_order_id 
      AND co.status IN ('delivered', 'completed')
      AND oi.product_id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Invalid review: This product was not purchased in this order, or the order is not yet delivered/completed.';
  END IF;

  -- The reviewer must be the buyer of the order
  IF NOT EXISTS (
    SELECT 1 FROM public.child_orders co
    JOIN public.parent_orders po ON po.id = co.parent_id
    WHERE co.id = NEW.child_order_id AND po.buyer_id = NEW.buyer_id
  ) THEN
    RAISE EXCEPTION 'Invalid review: The reviewer is not the buyer who placed this order.';
  END IF;


  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_product_review_insert
BEFORE INSERT ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_on_product_review_insert();

-- Trigger after insert/update to trigger the publisher check
CREATE OR REPLACE FUNCTION public.trg_fn_after_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.check_and_publish_reviews(NEW.child_order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_product_review_insert
AFTER INSERT ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_after_review_insert();

-- Validation on buyer_reviews
CREATE OR REPLACE FUNCTION public.trg_fn_on_buyer_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that child order is delivered or completed
  IF NOT EXISTS (
    SELECT 1 FROM public.child_orders co
    WHERE co.id = NEW.child_order_id AND co.status IN ('delivered', 'completed')
  ) THEN
    RAISE EXCEPTION 'Invalid review: The order is not yet delivered or completed.';
  END IF;

  -- Validate seller matching child order store owner
  IF NOT EXISTS (
    SELECT 1 FROM public.child_orders co
    JOIN public.stores s ON s.id = co.store_id
    WHERE co.id = NEW.child_order_id AND s.owner_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'Invalid review: Only the store owner who fulfilled this order can review the buyer.';
  END IF;

  -- Validate target buyer matches parent order buyer
  IF NOT EXISTS (
    SELECT 1 FROM public.child_orders co
    JOIN public.parent_orders po ON po.id = co.parent_id
    WHERE co.id = NEW.child_order_id AND po.buyer_id = NEW.buyer_id
  ) THEN
    RAISE EXCEPTION 'Invalid review: Target buyer does not match the buyer who placed the order.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_buyer_review_insert
BEFORE INSERT ON public.buyer_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_on_buyer_review_insert();

CREATE TRIGGER trg_after_buyer_review_insert
AFTER INSERT ON public.buyer_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_after_review_insert();

-- 8. TRUST SCORE RECALCULATION & BADGES ENGINE

CREATE OR REPLACE FUNCTION public.recalculate_store_trust_metrics(p_store_id UUID)
RETURNS VOID AS $$
DECLARE
  v_avg_rating NUMERIC(3, 2) := 0.00;
  v_total_reviews INTEGER := 0;
  v_completion_rate NUMERIC(5, 2) := 100.00;
  v_on_time_rate NUMERIC(5, 2) := 100.00;
  v_trust_score NUMERIC(5, 2) := 100.00;
  v_badges TEXT[] := '{}'::TEXT[];
  v_completed_count INTEGER := 0;
  v_cancelled_seller INTEGER := 0;
  v_delivered_count INTEGER := 0;
  v_on_time_count INTEGER := 0;
BEGIN
  -- 1. Calculate Average Rating and Total Review Count from published reviews
  SELECT 
    COALESCE(ROUND(AVG(pr.rating)::numeric, 2), 0.00),
    COUNT(pr.id)
  INTO v_avg_rating, v_total_reviews
  FROM public.product_reviews pr
  JOIN public.products p ON p.id = pr.product_id
  WHERE p.store_id = p_store_id AND pr.is_published = TRUE;

  -- 2. Calculate Order Completion Rate
  SELECT COUNT(*) INTO v_completed_count 
  FROM public.child_orders 
  WHERE store_id = p_store_id AND status IN ('completed', 'delivered');

  SELECT COUNT(*) INTO v_cancelled_seller
  FROM public.child_orders
  WHERE store_id = p_store_id AND status = 'cancelled';

  IF (v_completed_count + v_cancelled_seller) > 0 THEN
    v_completion_rate := ROUND((v_completed_count::numeric / (v_completed_count + v_cancelled_seller)::numeric) * 100.00, 2);
  ELSE
    v_completion_rate := 100.00;
  END IF;

  -- 3. Calculate On-Time Delivery Rate
  SELECT COUNT(*) INTO v_delivered_count
  FROM public.child_orders
  WHERE store_id = p_store_id AND status IN ('completed', 'delivered') AND delivered_at IS NOT NULL;

  SELECT COUNT(*) INTO v_on_time_count
  FROM public.child_orders
  WHERE store_id = p_store_id 
    AND status IN ('completed', 'delivered') 
    AND delivered_at IS NOT NULL 
    AND estimated_delivery IS NOT NULL
    AND delivered_at::date <= estimated_delivery;

  IF v_delivered_count > 0 THEN
    v_on_time_rate := ROUND((v_on_time_count::numeric / v_delivered_count::numeric) * 100.00, 2);
  ELSE
    v_on_time_rate := 100.00;
  END IF;

  -- 4. Calculate Combined Trust Score
  v_trust_score := ROUND(
    (v_avg_rating * 20.0 * 0.40) + 
    (v_completion_rate * 0.30) + 
    (v_on_time_rate * 0.30),
    2
  );

  -- 5. Determine Badges
  IF v_avg_rating >= 4.80 AND v_total_reviews >= 10 THEN
    v_badges := array_append(v_badges, 'maallem_master');
  END IF;

  IF v_on_time_rate >= 95.00 AND v_delivered_count >= 5 THEN
    v_badges := array_append(v_badges, 'fast_shipper');
  END IF;

  IF v_trust_score >= 95.00 AND v_total_reviews >= 3 THEN
    v_badges := array_append(v_badges, 'highly_trusted');
  END IF;

  -- 6. Upsert trust metrics
  INSERT INTO public.stores_trust_metrics (
    store_id, avg_rating, total_reviews, order_completion_rate, on_time_delivery_rate, trust_score, badges, updated_at
  ) VALUES (
    p_store_id, v_avg_rating, v_total_reviews, v_completion_rate, v_on_time_rate, v_trust_score, v_badges, NOW()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    order_completion_rate = EXCLUDED.order_completion_rate,
    on_time_delivery_rate = EXCLUDED.on_time_delivery_rate,
    trust_score = EXCLUDED.trust_score,
    badges = EXCLUDED.badges,
    updated_at = NOW();

  -- 7. Sync back to public.stores rating and total_reviews for general listing use
  UPDATE public.stores SET
    rating = v_avg_rating,
    total_reviews = v_total_reviews
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update product rating on product_reviews insert/update/delete AND recalculate store trust metrics
CREATE OR REPLACE FUNCTION public.trg_fn_sync_published_reviews_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_store_id UUID;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  SELECT store_id INTO v_store_id FROM public.products WHERE id = v_product_id;

  UPDATE public.products SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.product_reviews
      WHERE product_id = v_product_id AND is_published = TRUE
    ), 0.00),
    total_reviews = COALESCE((
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = v_product_id AND is_published = TRUE
    ), 0)
  WHERE id = v_product_id;

  IF v_store_id IS NOT NULL THEN
    PERFORM public.recalculate_store_trust_metrics(v_store_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_published_reviews_metrics
AFTER INSERT OR DELETE OR UPDATE OF is_published, rating ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_sync_published_reviews_metrics();

-- Sync store metrics when order statuses transition (delivery time, completion, etc.)
CREATE OR REPLACE FUNCTION public.trg_fn_sync_order_completion_trust_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'delivered', 'cancelled') AND NEW.status <> OLD.status THEN
    PERFORM public.recalculate_store_trust_metrics(NEW.store_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_order_completion_trust_metrics
AFTER UPDATE OF status ON public.child_orders
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_sync_order_completion_trust_metrics();

-- 9. CRON WORKER TO PUBLISH EXPIRED WINDOWS (14 DAYS)
CREATE OR REPLACE FUNCTION public.sweep_expired_double_blind_reviews()
RETURNS INTEGER AS $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT DISTINCT co.id 
    FROM public.child_orders co
    LEFT JOIN public.product_reviews pr ON pr.child_order_id = co.id AND pr.is_published = FALSE
    LEFT JOIN public.buyer_reviews br ON br.child_order_id = co.id AND br.is_published = FALSE
    WHERE co.status IN ('delivered', 'completed')
      AND co.delivered_at IS NOT NULL
      AND co.delivered_at + INTERVAL '14 days' <= NOW()
      AND (pr.id IS NOT NULL OR br.id IS NOT NULL)
  LOOP
    PERFORM public.check_and_publish_reviews(r.id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores_trust_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Product Reviews Policies
CREATE POLICY "product_reviews_select_public" ON public.product_reviews
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "product_reviews_select_own" ON public.product_reviews
  FOR SELECT USING (
    buyer_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    )
  );

CREATE POLICY "product_reviews_insert_buyer" ON public.product_reviews
  FOR INSERT WITH CHECK (
    buyer_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    )
  );

CREATE POLICY "product_reviews_update_own" ON public.product_reviews
  FOR UPDATE USING (
    buyer_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    ) AND is_published = FALSE
  ) WITH CHECK (
    buyer_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    ) AND is_published = FALSE
  );

-- Buyer Reviews Policies
CREATE POLICY "buyer_reviews_select_published" ON public.buyer_reviews
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "buyer_reviews_select_own" ON public.buyer_reviews
  FOR SELECT USING (
    buyer_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    ) OR seller_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    )
  );

CREATE POLICY "buyer_reviews_insert_seller" ON public.buyer_reviews
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    )
  );

CREATE POLICY "buyer_reviews_update_own" ON public.buyer_reviews
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    ) AND is_published = FALSE
  ) WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    ) AND is_published = FALSE
  );

-- Trust Metrics Policy (Public read-only)
CREATE POLICY "stores_trust_metrics_select" ON public.stores_trust_metrics
  FOR SELECT USING (TRUE);

-- Helpful Votes Policies
CREATE POLICY "helpful_votes_select" ON public.review_helpful_votes
  FOR SELECT USING (TRUE);

CREATE POLICY "helpful_votes_insert" ON public.review_helpful_votes
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    )
  );

CREATE POLICY "helpful_votes_delete" ON public.review_helpful_votes
  FOR DELETE USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id()
    )
  );

COMMIT;
