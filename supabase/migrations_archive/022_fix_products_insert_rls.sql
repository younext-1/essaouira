-- =========================================================
-- Migration 022: Fix Products INSERT RLS Policy
-- =========================================================
-- Problem: Migration 013 created a products_owner_insert policy
-- that requires is_active = TRUE on the store. But migration 012
-- sets is_active = FALSE by default — it only becomes TRUE after
-- full onboarding (profile, payout, shipping, etc.) is complete.
-- This blocks artisans from creating their FIRST product, which
-- is itself an onboarding step!
--
-- Fix: Remove the is_active = TRUE requirement from INSERT policy.
-- The owner check (via clerk_id → profile → store) is sufficient security.
-- Also consolidate conflicting products policies from migrations 010 & 013.
-- =========================================================

-- Step 1: Drop ALL conflicting products INSERT/MODIFY policies
DROP POLICY IF EXISTS "products_owner_insert"   ON public.products;
DROP POLICY IF EXISTS "products_owner_update"   ON public.products;
DROP POLICY IF EXISTS "products_owner_delete"   ON public.products;
DROP POLICY IF EXISTS "products_owner_modify"   ON public.products;

-- Step 2: Create a clean INSERT policy without is_active requirement
-- Store owners can always insert products (regardless of is_active status)
CREATE POLICY "products_owner_insert" ON public.products
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores
      WHERE owner_id IN (
        SELECT id FROM public.profiles
        WHERE clerk_id = public.get_clerk_id()
        AND deleted_at IS NULL
      )
      AND deleted_at IS NULL
    )
  );

-- Step 3: Create a clean UPDATE policy
CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE owner_id IN (
        SELECT id FROM public.profiles
        WHERE clerk_id = public.get_clerk_id()
        AND deleted_at IS NULL
      )
      AND deleted_at IS NULL
    )
  );

-- Step 4: Create a clean DELETE policy
CREATE POLICY "products_owner_delete" ON public.products
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM public.stores
      WHERE owner_id IN (
        SELECT id FROM public.profiles
        WHERE clerk_id = public.get_clerk_id()
        AND deleted_at IS NULL
      )
      AND deleted_at IS NULL
    )
  );

-- Done ✓
