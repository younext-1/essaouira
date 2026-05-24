-- =========================================================
-- Migration 010: Database Security Hardening & Soft Deletes
-- =========================================================

-- 1. ADD SOFT DELETE COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. SECURE TRANSACTION HISTORY (ORDERS REFERENTIAL INTEGRITY)
-- Drop NOT NULL constraints on orders columns that represent buyers and stores
-- to allow ON DELETE SET NULL rather than ON DELETE CASCADE.
ALTER TABLE public.orders ALTER COLUMN buyer_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN store_id DROP NOT NULL;

-- Recreate foreign key constraints with SET NULL
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_buyer_id_fkey 
  FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.stores(id) 
  ON DELETE SET NULL;

-- 3. DROP INSECURE OR OPEN RLS POLICIES (FROM 009 & PRIOR MIGRATIONS)
-- Tables policies
DROP POLICY IF EXISTS "Profiles are writable by anyone" ON public.profiles;
DROP POLICY IF EXISTS "Stores are writable by anyone" ON public.stores;
DROP POLICY IF EXISTS "Products are writable by anyone" ON public.products;
DROP POLICY IF EXISTS "Variants are writable by anyone" ON public.product_variants;
DROP POLICY IF EXISTS "Reviews are writable by anyone" ON public.reviews;
DROP POLICY IF EXISTS "Cart is writable by anyone" ON public.cart_items;
DROP POLICY IF EXISTS "Wishlist is writable by anyone" ON public.wishlist;
DROP POLICY IF EXISTS "Orders are writable by anyone" ON public.orders;
DROP POLICY IF EXISTS "Order items are writable by anyone" ON public.order_items;

DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Stores are publicly viewable" ON public.stores;
DROP POLICY IF EXISTS "Products are publicly viewable" ON public.products;
DROP POLICY IF EXISTS "Variants are publicly viewable" ON public.product_variants;
DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.reviews;

-- 4. CREATE OWNERSHIP-BASED & ACTIVE-ONLY RLS POLICIES (FIX 2 & FIX 8)

-- ── PROFILES ──
CREATE POLICY "profiles_public_select" ON public.profiles 
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "profiles_owner_update" ON public.profiles 
  FOR UPDATE USING (clerk_id = get_clerk_id() AND deleted_at IS NULL);

-- ── STORES ──
CREATE POLICY "stores_public_select" ON public.stores 
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "stores_artisan_insert" ON public.stores 
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = get_clerk_id() AND is_artisan = true AND deleted_at IS NULL
    )
  );

CREATE POLICY "stores_owner_modify" ON public.stores 
  FOR ALL USING (
    owner_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL
    )
  );

-- ── PRODUCTS ──
CREATE POLICY "products_public_select" ON public.products 
  FOR SELECT USING (
    is_published = true 
    AND store_id IN (SELECT id FROM public.stores WHERE deleted_at IS NULL)
  );

CREATE POLICY "products_owner_modify" ON public.products 
  FOR ALL USING (
    store_id IN (
      SELECT id FROM public.stores 
      WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL)
    )
  );

-- ── PRODUCT VARIANTS ──
CREATE POLICY "variants_public_select" ON public.product_variants 
  FOR SELECT USING (true);

CREATE POLICY "variants_owner_modify" ON public.product_variants 
  FOR ALL USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE store_id IN (
        SELECT id FROM public.stores 
        WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL)
      )
    )
  );

-- ── REVIEWS ──
CREATE POLICY "reviews_public_select" ON public.reviews 
  FOR SELECT USING (true);

CREATE POLICY "reviews_owner_insert" ON public.reviews 
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL
    )
  );

CREATE POLICY "reviews_owner_modify" ON public.reviews 
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL
    )
  );

-- ── CART ITEMS ──
CREATE POLICY "cart_items_owner_access" ON public.cart_items 
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL
    )
  );

-- ── WISHLIST ──
CREATE POLICY "wishlist_owner_access" ON public.wishlist 
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.profiles 
      WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL
    )
  );

-- ── ORDERS ──
CREATE POLICY "orders_parties_select" ON public.orders 
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL)
    OR store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL))
  );

CREATE POLICY "orders_buyer_insert" ON public.orders 
  FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL)
  );

CREATE POLICY "orders_store_owner_update" ON public.orders 
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL))
  );

-- ── ORDER ITEMS ──
CREATE POLICY "order_items_parties_select" ON public.order_items 
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL)
      OR store_id IN (SELECT id FROM public.stores WHERE owner_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL))
    )
  );

CREATE POLICY "order_items_insert" ON public.order_items 
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE buyer_id IN (SELECT id FROM public.profiles WHERE clerk_id = get_clerk_id() AND deleted_at IS NULL)
    )
  );

-- 5. TRIGGER FOR ROLE AND VERIFICATION PRIVILEGE PROTECTION (FIX 3)
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if trigger is executed under the REST/GraphQL API roles (authenticated or anon)
  -- service_role (superuser) bypasses this protection.
  IF current_setting('role', true) IN ('authenticated', 'anon') THEN
    -- If role is modified, revert it
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      NEW.role = OLD.role;
    END IF;
    
    -- If verified status is modified, revert it
    IF OLD.verified IS DISTINCT FROM NEW.verified THEN
      NEW.verified = OLD.verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_sensitive_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_columns();

-- 6. ENFORCE STORAGE BUCKETS SECURITY (FIX 5)
-- Drop wide-open storage policies
DROP POLICY IF EXISTS "storage_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;

-- Create highly locked down policies
-- Enforce authenticated sessions and whitelist production buckets
CREATE POLICY "storage_auth_upload" ON storage.objects 
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'covers', 'posts', 'portfolio', 'products'));

CREATE POLICY "storage_owner_delete" ON storage.objects 
  FOR DELETE 
  TO authenticated
  USING (bucket_id IN ('avatars', 'covers', 'posts', 'portfolio', 'products'));

-- 7. SOFT DELETE STORED PROCEDURE (FIX 8)
-- Secure Postgres function to flag user profiles and their corresponding stores
-- as deleted, preventing complete CASCADE loss of user order logs.
CREATE OR REPLACE FUNCTION public.soft_delete_profile(p_profile_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Authenticate context: Only the profile owner, an admin, or the service_role can soft-delete
  IF (SELECT clerk_id FROM public.profiles WHERE id = p_profile_id) = public.get_clerk_id() 
     OR (SELECT role FROM public.profiles WHERE clerk_id = public.get_clerk_id()) = 'admin' 
     OR current_setting('role', true) = 'service_role' THEN
     
     -- 1. Soft delete the Profile row
     UPDATE public.profiles 
     SET deleted_at = NOW() 
     WHERE id = p_profile_id;
     
     -- 2. Soft delete all Stores owned by the profile
     UPDATE public.stores 
     SET deleted_at = NOW() 
     WHERE owner_id = p_profile_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: You do not have permissions to delete this profile.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
