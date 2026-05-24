-- =========================================================
-- Migration 021: Fix Products Public Visibility
-- =========================================================
-- Problem: Migration 013 created a strict RLS policy that
-- only shows products with status='active' to the public.
-- However, existing products inserted via the dashboard forms
-- or older migrations have status='draft' or NULL, making them
-- invisible to anonymous visitors.
-- 
-- Fix 1: Update all existing products to status='active'
-- Fix 2: Replace the restrictive RLS with a permissive public read

-- Step 1: Set all existing products to 'active' status
UPDATE public.products
SET status = 'active'
WHERE status IS NULL OR status = 'draft';

-- Step 2: Drop the restrictive products_public_read policy
DROP POLICY IF EXISTS "products_public_read" ON public.products;

-- Step 3: Create a new permissive public read policy
-- All products are publicly visible (sellers control visibility via dashboard)
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (true);

-- Step 4: Fix product_variants public read (was restricted to is_active=TRUE)
DROP POLICY IF EXISTS "variants_public_read" ON public.product_variants;
CREATE POLICY "variants_public_read" ON public.product_variants
  FOR SELECT USING (true);

-- Done
