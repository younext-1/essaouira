-- =========================================================
-- Multi-Vendor Marketplace Migration (with User Profiles)
-- =========================================================

-- 1. Drop existing tables if they exist to avoid conflicts (cascade ensures dependencies are clean)
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create profiles table (IDs correspond to Clerk user IDs)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, -- Clerk User UUID or Text represented as UUID
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create stores table (owned by a profile)
CREATE TABLE public.stores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  logo_url text,
  category text,
  created_at timestamptz DEFAULT now()
);

-- 4. Create products table (referenced to stores)
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Profiles
CREATE POLICY "Allow public read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow open insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow open update profiles" ON public.profiles
  FOR UPDATE USING (true);

-- 7. RLS Policies for Stores
CREATE POLICY "Allow public read stores" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "Allow open insert stores" ON public.stores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow open update stores" ON public.stores
  FOR UPDATE USING (true);

CREATE POLICY "Allow open delete stores" ON public.stores
  FOR DELETE USING (true);

-- 8. RLS Policies for Products
CREATE POLICY "Allow public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Allow open insert products" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow open update products" ON public.products
  FOR UPDATE USING (true);

CREATE POLICY "Allow open delete products" ON public.products
  FOR DELETE USING (true);
