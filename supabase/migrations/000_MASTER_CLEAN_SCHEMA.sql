-- =========================================================
-- Mogador Connect: Consolidated Master Database Schema
-- File: supabase/migrations/000_MASTER_CLEAN_SCHEMA.sql
-- =========================================================

-- Clean slate initialization
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions on the public schema for Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO supabase_admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, anon;

SET check_function_bodies = OFF;

-- =========================================================
-- 1. EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =========================================================
-- 3. CORE TABLES
-- =========================================================

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text UNIQUE NOT NULL,
  email varchar UNIQUE,
  phone varchar,
  role text DEFAULT 'tourist' CHECK (role IN ('tourist', 'artisan', 'moderator', 'admin')),
  username text UNIQUE NOT NULL,
  full_name text,
  full_name_ar text,
  avatar_url text,
  location text,
  cover_url text,
  title text,
  title_ar text,
  bio text,
  bio_ar text,
  verified boolean DEFAULT false,
  profile_md text,
  is_artisan boolean DEFAULT false,
  is_tourist boolean DEFAULT true,
  craft_category text,
  languages text[] DEFAULT '{ar}',
  is_open_now boolean DEFAULT false,
  work_start_time text DEFAULT '09:00',
  work_end_time text DEFAULT '18:00',
  work_days text[] DEFAULT array['mon','tue','wed','thu','fri','sat'],
  onboarding_done boolean DEFAULT false,
  custom_html text,
  custom_html_enabled boolean DEFAULT false,
  custom_html_filename text,
  website text,
  whatsapp text,
  instagram text,
  facebook text,
  tiktok text,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- STORES TABLE
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  avatar_url text,
  category text,
  location text,
  coordinates point,
  phone text,
  whatsapp text,
  working_hours jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  total_sales integer DEFAULT 0,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  review_count integer DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- =========================================================
-- 4. PRODUCT CATALOG TABLES
-- =========================================================

-- CUSTOM ENUMS
CREATE TYPE public.product_type AS ENUM ('physical', 'experience');
CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'paused', 'sold_out', 'archived');

-- CATEGORIES TABLE
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  name_ar varchar,
  name_fr varchar,
  slug varchar UNIQUE NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  icon_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  name_ar text,
  name_fr text,
  slug text UNIQUE,
  description text,
  description_ar text,
  description_fr text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10, 2) CHECK (compare_at_price >= 0),
  images text[] NOT NULL DEFAULT '{}'::text[],
  thumbnail_url text,
  type public.product_type NOT NULL,
  status public.product_status NOT NULL DEFAULT 'draft',
  stock integer DEFAULT 0 CHECK (stock >= 0),
  weight_grams integer CHECK (weight_grams >= 0),
  dimensions jsonb DEFAULT '{"length": 0, "width": 0, "height": 0}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  total_sales integer DEFAULT 0,
  total_reviews integer DEFAULT 0,
  rating numeric(3, 2) DEFAULT 0.00 CHECK (rating BETWEEN 0.00 AND 5.00),
  is_featured boolean DEFAULT false,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- PRODUCT VARIANTS TABLE
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name varchar NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sku varchar UNIQUE NOT NULL,
  price_override numeric(10, 2) CHECK (price_override >= 0),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  images text[] DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- PRODUCT INVENTORY TABLE
CREATE TABLE public.product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  reserved integer DEFAULT 0 CHECK (reserved >= 0),
  available integer GENERATED ALWAYS AS (quantity - reserved) STORED,
  last_updated timestamptz DEFAULT NOW(),
  CONSTRAINT product_inventory_unique UNIQUE (product_id, variant_id)
);

-- EXPERIENCE DETAILS TABLE
CREATE TABLE public.experience_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  duration_hours numeric(4, 2) NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  meeting_point text NOT NULL,
  meeting_point_coords point,
  languages text[] DEFAULT '{}'::text[],
  includes text[] DEFAULT '{}'::text[],
  excludes text[] DEFAULT '{}'::text[],
  cancellation_policy text,
  min_age integer CHECK (min_age >= 0),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- EXPERIENCE SLOTS TABLE
CREATE TABLE public.experience_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  booked_count integer DEFAULT 0 CHECK (booked_count >= 0),
  is_available boolean DEFAULT true,
  price_override numeric(10, 2) CHECK (price_override >= 0),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- =========================================================
-- 5. COMMERCE & TRANSACTIONS TABLES
-- =========================================================

-- INVENTORY LOCKS TABLE (For pending checkouts)
CREATE TABLE public.inventory_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id varchar NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  locked_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  released boolean DEFAULT false
);

-- CARTS TABLE
CREATE TABLE public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_token varchar UNIQUE,
  status varchar NOT NULL CHECK (status IN ('active', 'checked_out', 'abandoned', 'merged')) DEFAULT 'active',
  coupon_code varchar,
  discount_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL
);

-- CART ITEMS TABLE
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_add numeric(10, 2) NOT NULL CHECK (price_at_add >= 0),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz NOT NULL DEFAULT NOW()
);

-- COUPONS TABLE
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar UNIQUE NOT NULL,
  discount_type varchar NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
  max_discount_amount numeric(10, 2),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  max_usages integer NOT NULL DEFAULT 0 CHECK (max_usages >= 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active boolean NOT NULL DEFAULT true,
  applicable_product_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  applicable_store_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- COUPON REDEMPTIONS TABLE (Upgraded from coupon_usages)
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  used_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coupon_buyer UNIQUE (coupon_id, buyer_id)
);

-- CHECKOUT SESSIONS TABLE
CREATE TABLE public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status varchar NOT NULL CHECK (status IN ('initiated', 'payment_pending', 'payment_failed', 'completed', 'abandoned')) DEFAULT 'initiated',
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  partitioned_stores jsonb NOT NULL,
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_total numeric(10, 2) NOT NULL CHECK (shipping_total >= 0),
  discount_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_intent_id varchar,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ABANDONED CHECKOUTS TABLE
CREATE TABLE public.abandoned_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid REFERENCES public.checkout_sessions(id) ON DELETE CASCADE NOT NULL,
  buyer_email varchar,
  cart_snapshot jsonb NOT NULL,
  recovery_token varchar UNIQUE NOT NULL,
  recovery_sent_at timestamptz,
  recovered_at timestamptz,
  discount_offered numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_offered >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 6. ORDER MODULES
-- =========================================================

-- PARENT ORDERS TABLE
CREATE TABLE public.parent_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  checkout_session_id uuid REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  currency varchar(10) NOT NULL DEFAULT 'MAD',
  notes text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  shipping_total numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_total >= 0),
  discount_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- CHILD ORDERS TABLE (Partitioned by Store)
CREATE TABLE public.child_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.parent_orders(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  status varchar(30) NOT NULL CHECK (status IN (
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
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
  platform_fee numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
  seller_earnings numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (seller_earnings >= 0),
  tracking_number varchar(100),
  carrier varchar(100),
  shipping_label_url varchar(500),
  estimated_delivery date,
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason varchar(255),
  seller_notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  selected_options jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- ORDER HISTORY TIMELINE TABLE
CREATE TABLE public.order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  from_status varchar(50) NOT NULL,
  to_status varchar(50) NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role varchar(20) NOT NULL CHECK (actor_role IN ('buyer', 'seller', 'system', 'admin')),
  note text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- ORDER DISPUTES TABLE
CREATE TABLE public.order_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  opened_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  reason varchar(50) NOT NULL CHECK (reason IN (
    'item_not_received',
    'item_damaged',
    'item_not_as_described',
    'seller_unresponsive',
    'other'
  )),
  description text NOT NULL,
  evidence_urls text[] NOT NULL DEFAULT '{}'::text[],
  status varchar(20) NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  resolution varchar(20) CHECK (resolution IN ('refund_buyer', 'release_seller', 'partial_refund')),
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  opened_at timestamptz NOT NULL DEFAULT NOW(),
  resolved_at timestamptz
);

-- =========================================================
-- 7. FINANCIALS, BALANCES & PAYMENTS TABLES
-- =========================================================

-- TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id uuid REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
  parent_order_id uuid REFERENCES public.parent_orders(id) ON DELETE SET NULL,
  gateway varchar NOT NULL CHECK (gateway IN ('stripe', 'cod', 'bank_transfer')),
  gateway_transaction_id varchar UNIQUE,
  gateway_response jsonb,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  currency varchar NOT NULL DEFAULT 'MAD',
  exchange_rate numeric NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  amount_mad numeric(10, 2) NOT NULL CHECK (amount_mad >= 0),
  platform_fee numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
  status varchar NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')) DEFAULT 'pending',
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ESCROW LEDGERS TABLE
CREATE TABLE public.escrow_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  gross_amount numeric(10, 2) NOT NULL CHECK (gross_amount >= 0),
  platform_fee numeric(10, 2) NOT NULL CHECK (platform_fee >= 0),
  shipping_fee numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  net_amount numeric(10, 2) NOT NULL,
  status varchar NOT NULL CHECK (status IN ('holding', 'released', 'refunded', 'disputed')) DEFAULT 'holding',
  hold_reason varchar,
  release_trigger varchar CHECK (release_trigger IN ('buyer_confirmed', 'auto_7days', 'admin_manual', 'dispute_resolved')),
  held_at timestamptz NOT NULL DEFAULT NOW(),
  released_at timestamptz,
  dispute_opened_at timestamptz
);

-- SELLER BALANCES TABLE
CREATE TABLE public.seller_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE NOT NULL,
  available_mad numeric(10, 2) NOT NULL DEFAULT 0.00,
  pending_mad numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (pending_mad >= 0),
  total_earned_mad numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned_mad >= 0),
  total_withdrawn_mad numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn_mad >= 0),
  last_updated timestamptz NOT NULL DEFAULT NOW()
);

-- PAYOUT REQUESTS TABLE
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 100.00), -- minimum 100 MAD
  method varchar NOT NULL CHECK (method IN ('bank_transfer', 'cash', 'mobile_money')),
  bank_details jsonb NOT NULL,
  status varchar NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  processed_at timestamptz,
  processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason varchar,
  reference_number varchar
);

-- COMMISSION RULES TABLE
CREATE TABLE public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category varchar,
  store_tier_id uuid, -- referenced later once store_tiers is defined
  rate numeric(5, 4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  min_fee numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (min_fee >= 0),
  max_fee numeric(10, 2) CHECK (max_fee >= min_fee),
  is_default boolean NOT NULL DEFAULT false,
  effective_from timestamptz NOT NULL DEFAULT NOW()
);

-- REFUND REQUESTS TABLE
CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason varchar NOT NULL CHECK (reason IN ('not_received', 'damaged', 'not_as_described', 'changed_mind', 'other')),
  description text NOT NULL,
  evidence_urls text[] DEFAULT '{}'::text[],
  amount_requested numeric(10, 2) NOT NULL CHECK (amount_requested >= 0),
  amount_approved numeric(10, 2) CHECK (amount_approved >= 0),
  status varchar NOT NULL CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- PAYMENT METHODS TABLE
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id varchar NOT NULL,
  type varchar NOT NULL CHECK (type IN ('card', 'bank_transfer', 'cod')),
  last4 varchar,
  brand varchar,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 8. COURIERS & SHIPPING TABLES
-- =========================================================

-- CUSTOM ENUMS
CREATE TYPE public.delivery_type AS ENUM ('local', 'national', 'international');
CREATE TYPE public.rate_type AS ENUM ('flat', 'weight_based', 'free');
CREATE TYPE public.shipment_status AS ENUM ('label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned');

-- SHIPPING ZONES TABLE
CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  type public.delivery_type NOT NULL,
  countries text[] DEFAULT NULL,
  cities text[] DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW()
);

-- CARRIER CONFIGURATIONS TABLE
CREATE TABLE public.carrier_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  code varchar(50) UNIQUE NOT NULL, -- e.g. 'amana', 'dhl'
  type public.delivery_type NOT NULL,
  logo_url varchar(255),
  tracking_url_template varchar(255) NOT NULL,
  api_endpoint varchar(255) DEFAULT NULL,
  api_key_encrypted varchar(500) DEFAULT NULL,
  is_active boolean DEFAULT true,
  estimated_days_min integer NOT NULL DEFAULT 1 CHECK (estimated_days_min >= 0),
  estimated_days_max integer NOT NULL DEFAULT 7 CHECK (estimated_days_max >= estimated_days_min),
  created_at timestamptz DEFAULT NOW()
);

-- STORE SHIPPING POLICIES TABLE
CREATE TABLE public.store_shipping_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE NOT NULL,
  offers_local_pickup boolean DEFAULT false,
  local_pickup_address text,
  local_pickup_coords geometry(Point, 4326),
  local_pickup_fee numeric(10, 2) DEFAULT 0.00 CHECK (local_pickup_fee >= 0),
  local_pickup_instructions text,
  offers_national boolean DEFAULT true,
  offers_international boolean DEFAULT false,
  free_shipping_threshold_mad numeric(10, 2) DEFAULT NULL CHECK (free_shipping_threshold_mad >= 0),
  handling_time_days integer DEFAULT 1 CHECK (handling_time_days >= 0),
  ships_from_city varchar(100) DEFAULT 'Essaouira',
  ships_from_coords geometry(Point, 4326),
  return_policy text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- STORE SHIPPING RATES TABLE
CREATE TABLE public.store_shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  zone_id uuid REFERENCES public.shipping_zones(id) ON DELETE CASCADE NOT NULL,
  carrier_id uuid REFERENCES public.carrier_configs(id) ON DELETE SET NULL,
  rate_type public.rate_type NOT NULL,
  flat_fee numeric(10, 2) CHECK (flat_fee >= 0),
  weight_tiers jsonb DEFAULT NULL,
  min_order_mad numeric(10, 2) DEFAULT 0 CHECK (min_order_mad >= 0),
  max_order_mad numeric(10, 2) DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(store_id, zone_id),
  CONSTRAINT chk_order_bounds CHECK (max_order_mad IS NULL OR max_order_mad >= min_order_mad)
);

-- PICKUP HUBS TABLE
CREATE TABLE public.pickup_hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  address text NOT NULL,
  coords geometry(Point, 4326),
  city varchar(100) DEFAULT 'Essaouira',
  contact_phone varchar(50),
  working_hours jsonb NOT NULL DEFAULT '{"weekdays": "09:00-18:00", "saturday": "09:00-13:00", "sunday": "closed"}'::jsonb,
  max_storage_days integer DEFAULT 7 CHECK (max_storage_days > 0),
  is_active boolean DEFAULT true,
  partner_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT NOW()
);

-- SHIPMENTS TABLE
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  carrier_id uuid REFERENCES public.carrier_configs(id) ON DELETE SET NULL,
  type public.delivery_type NOT NULL,
  tracking_number varchar(100),
  tracking_url varchar(500),
  shipping_label_url varchar(500),
  pickup_hub_id uuid REFERENCES public.pickup_hubs(id) ON DELETE SET NULL,
  origin_address jsonb NOT NULL,
  destination_address jsonb NOT NULL,
  weight_grams integer NOT NULL CHECK (weight_grams >= 0),
  dimensions jsonb DEFAULT '{"length_cm": 1, "width_cm": 1, "height_cm": 1}'::jsonb,
  declared_value numeric(10, 2) NOT NULL DEFAULT 0.00 CHECK (declared_value >= 0),
  customs_description text DEFAULT NULL,
  estimated_delivery date,
  shipped_at timestamptz DEFAULT NULL,
  delivered_at timestamptz DEFAULT NULL,
  status public.shipment_status NOT NULL DEFAULT 'label_created',
  tracking_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- =========================================================
-- 9. DOUBLE-BLIND REVIEWS & TRUST SCORES TABLES
-- =========================================================

-- PRODUCT REVIEWS TABLE (Buyer reviewing product/artisan)
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid NOT NULL REFERENCES public.child_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title varchar(255) NOT NULL CHECK (char_length(trim(title)) > 0),
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  images text[] DEFAULT '{}'::text[] NOT NULL,
  helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_order_product_review UNIQUE (child_order_id, product_id)
);

-- BUYER REVIEWS TABLE (Artisan reviewing buyer behavior)
CREATE TABLE public.buyer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid NOT NULL REFERENCES public.child_orders(id) ON DELETE CASCADE UNIQUE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- REVIEW REPLIES TABLE
CREATE TABLE public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.product_reviews(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- REVIEW HELPFULNESS VOTES TABLE (Upgraded from review_helpful_votes)
CREATE TABLE public.review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review_vote UNIQUE (review_id, profile_id)
);

-- REVIEW REQUESTS TABLE
CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT NOW()
);

-- TRUST SCORES TABLE (Upgraded from stores_trust_metrics)
CREATE TABLE public.trust_scores (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  avg_rating numeric(3, 2) NOT NULL DEFAULT 0.00 CHECK (avg_rating BETWEEN 0.00 AND 5.00),
  total_reviews integer NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  communication_score numeric(3, 2) NOT NULL DEFAULT 0.00 CHECK (communication_score BETWEEN 0.00 AND 5.00),
  order_completion_rate numeric(5, 2) NOT NULL DEFAULT 100.00 CHECK (order_completion_rate BETWEEN 0.00 AND 100.00),
  on_time_delivery_rate numeric(5, 2) NOT NULL DEFAULT 100.00 CHECK (on_time_delivery_rate BETWEEN 0.00 AND 100.00),
  trust_score numeric(5, 2) NOT NULL DEFAULT 100.00 CHECK (trust_score BETWEEN 0.00 AND 100.00),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- TRUST BADGES TABLE
CREATE TABLE public.trust_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  badge_type varchar(50) NOT NULL, -- e.g. 'maallem_master', 'fast_shipper', 'highly_trusted'
  awarded_at timestamptz DEFAULT NOW(),
  CONSTRAINT uq_store_badge UNIQUE (store_id, badge_type)
);

-- =========================================================
-- 10. NOTIFICATION MODULES
-- =========================================================

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type varchar(50) NOT NULL CHECK (type IN (
    'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
    'escrow_released', 'payout_requested', 'payout_processed', 'payout_rejected',
    'refund_requested', 'refund_approved', 'refund_rejected',
    'new_message', 'review_received', 'system_alert'
  )),
  title varchar(255) NOT NULL CHECK (char_length(trim(title)) > 0),
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- NOTIFICATION PREFERENCES TABLE
CREATE TABLE public.notification_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  order_updates boolean DEFAULT true,
  promotions boolean DEFAULT true,
  new_messages boolean DEFAULT true,
  updated_at timestamptz DEFAULT NOW()
);

-- =========================================================
-- 11. MARKETING MODULES
-- =========================================================

-- PROMOTED LISTINGS TABLE
CREATE TABLE public.promoted_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  budget_mad numeric(10, 2) NOT NULL CHECK (budget_mad > 0),
  spent_mad numeric(10, 2) DEFAULT 0.00 CHECK (spent_mad >= 0),
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- MARKETPLACE ANALYTICS EVENTS TABLE
CREATE TABLE public.marketplace_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  visitor_id varchar(100), -- Anonymous session/cookie identifier
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Authenticated user if available
  event_type varchar(50) NOT NULL CHECK (event_type IN (
    'page_view', 
    'product_view', 
    'store_view', 
    'add_to_cart', 
    'initiate_checkout', 
    'purchase'
  )),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 12. ADMIN, SELLER SOCIAL & EXTRA CORE TABLES
-- =========================================================

-- PROFILE VERIFICATIONS TABLE
CREATE TABLE public.profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type varchar NOT NULL,
  document_url varchar NOT NULL,
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action varchar NOT NULL,
  target_type varchar NOT NULL,
  target_id varchar NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address varchar,
  created_at timestamptz DEFAULT NOW()
);

-- MODERATION REPORTS TABLE
CREATE TABLE public.moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type varchar(50) NOT NULL CHECK (target_type IN ('product', 'store', 'review', 'profile')),
  target_id uuid NOT NULL,
  reason varchar(100) NOT NULL,
  description text NOT NULL,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- PLATFORM CONFIGURATIONS TABLE
CREATE TABLE public.platform_configurations (
  key varchar(100) PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT NOW()
);

-- ADMIN USERS TABLE
CREATE TABLE public.admin_users (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_level varchar(50) NOT NULL DEFAULT 'moderator' CHECK (access_level IN ('moderator', 'admin', 'superuser')),
  created_at timestamptz DEFAULT NOW()
);

-- PROFILE STATS TABLE
CREATE TABLE public.profile_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  suffix text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- SPECIALTIES TABLE
CREATE TABLE public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  icon text,
  label text NOT NULL,
  is_active boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

-- SERVICES TABLE
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  icon text,
  title text NOT NULL,
  description text,
  duration text,
  price text,
  price_usd numeric,
  price_mad numeric(10, 2),
  is_available boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- POSTS TABLE
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  content text,
  category text CHECK (category IN ('artisan', 'music', 'surf', 'food', 'culture', 'other')),
  location text,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- POST IMAGES TABLE
CREATE TABLE public.post_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  alt text,
  sort_order integer DEFAULT 0
);

-- POST TAGS TABLE
CREATE TABLE public.post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL
);

-- LIKES TABLE
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id)
);

-- BOOKMARKS TABLE
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT unique_user_post_bookmark UNIQUE (user_id, post_id)
);

-- FOLLOWS TABLE
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id)
);

-- PORTFOLIO ITEMS TABLE
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  image_url text,
  price_mad numeric(10, 2),
  price_usd numeric,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- AI CONVERSATIONS TABLE
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- CONVERSATIONS TABLE (Upgraded from chat_threads)
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  child_order_id uuid REFERENCES public.child_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- CHAT MESSAGES TABLE
CREATE TABLE public.chat_messages (
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  --
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- GUIDE BOOKINGS TABLE
CREATE TABLE public.guide_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  guide_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  date date NOT NULL,
  time time DEFAULT NULL,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- STORE METRICS SNAPSHOT TABLE
CREATE TABLE public.store_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date date NOT NULL,
  views integer DEFAULT 0,
  orders integer DEFAULT 0,
  revenue numeric(12, 2) DEFAULT 0.00,
  avg_response_time_minutes integer DEFAULT 0,
  cancellation_rate numeric(5, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT NOW(),
  CONSTRAINT store_metrics_store_date_unique UNIQUE (store_id, date)
);

-- STORE TIERS TABLE
CREATE TABLE public.store_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar UNIQUE NOT NULL,
  max_products integer NOT NULL,
  commission_rate numeric(5, 2) NOT NULL,
  featured_slots integer NOT NULL DEFAULT 0,
  price_mad numeric(12, 2) NOT NULL DEFAULT 0.00,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Complete Commission rules linkage
ALTER TABLE public.commission_rules
  ADD CONSTRAINT fk_commission_rules_tier FOREIGN KEY (store_tier_id) REFERENCES public.store_tiers(id) ON DELETE SET NULL;

-- STORE SUBSCRIPTIONS TABLE
CREATE TABLE public.store_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.store_tiers(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL DEFAULT NOW(),
  ends_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ONBOARDING STEPS TABLE
CREATE TABLE public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  profile_added boolean DEFAULT false,
  payout_connected boolean DEFAULT false,
  first_product_created boolean DEFAULT false,
  shipping_policy_set boolean DEFAULT false,
  store_description_added boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- =========================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================


-- =========================================================
-- 2. CUSTOM FUNCTIONS
-- =========================================================

-- Function to extract clerk_id from request JWT sub claim
CREATE OR REPLACE FUNCTION public.get_clerk_id()
RETURNS text AS $$
  SELECT nullif(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE sql STABLE;

-- Function to resolve profile UUID based on Clerk ID claim
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE clerk_id = public.get_clerk_id();
$$ LANGUAGE sql STABLE;

-- Helper function to check if the current user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE clerk_id = public.get_clerk_id()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- View count increment RPC
CREATE OR REPLACE FUNCTION public.increment_view_count(p_post_id uuid)
RETURNS void AS $$
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = p_post_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Toggle like RPC
CREATE OR REPLACE FUNCTION public.toggle_like(p_user_id uuid, p_post_id uuid)
RETURNS boolean AS $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM public.likes WHERE user_id = p_user_id AND post_id = p_post_id;
  IF existing_id IS NOT NULL THEN
    DELETE FROM public.likes WHERE id = existing_id;
    RETURN false;
  ELSE
    INSERT INTO public.likes (user_id, post_id) VALUES (p_user_id, p_post_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle bookmark RPC
CREATE OR REPLACE FUNCTION public.toggle_bookmark(p_user_id uuid, p_post_id uuid)
RETURNS boolean AS $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM public.bookmarks WHERE user_id = p_user_id AND post_id = p_post_id;
  IF existing_id IS NOT NULL THEN
    DELETE FROM public.bookmarks WHERE id = existing_id;
    RETURN false;
  ELSE
    INSERT INTO public.bookmarks (user_id, post_id) VALUES (p_user_id, p_post_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle follow RPC
CREATE OR REPLACE FUNCTION public.toggle_follow(p_follower_id uuid, p_following_id uuid)
RETURNS boolean AS $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM public.follows WHERE follower_id = p_follower_id AND following_id = p_following_id;
  IF existing_id IS NOT NULL THEN
    DELETE FROM public.follows WHERE id = existing_id;
    RETURN false;
  ELSE
    INSERT INTO public.follows (follower_id, following_id) VALUES (p_follower_id, p_following_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check username availability RPC
CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
$$ LANGUAGE sql STABLE;

-- Soft delete stored procedure for user profiles and storefronts
CREATE OR REPLACE FUNCTION public.soft_delete_profile(p_profile_id uuid)
RETURNS void AS $$
BEGIN
  IF (SELECT clerk_id FROM public.profiles WHERE id = p_profile_id) = public.get_clerk_id() 
     OR public.is_admin_user() 
     OR current_setting('role', true) = 'service_role' THEN
     
     -- 1. Soft delete the Profile row
     UPDATE public.profiles SET deleted_at = NOW() WHERE id = p_profile_id;
     
     -- 2. Soft delete all Stores owned by the profile
     UPDATE public.stores SET deleted_at = NOW() WHERE owner_id = p_profile_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: You do not have permissions to delete this profile.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================
-- VIEWS DEFINITIONS
-- =========================================================

-- posts_with_counts view
CREATE OR REPLACE VIEW public.posts_with_counts AS
SELECT
  p.*,
  pr.username,
  pr.full_name,
  pr.avatar_url,
  pr.verified,
  pr.location AS author_location,
  pr.craft_category,
  pr.whatsapp AS author_whatsapp,
  COUNT(DISTINCT l.id) AS likes_count,
  COUNT(DISTINCT b.id) AS bookmarks_count,
  ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL) AS tags,
  (SELECT url FROM public.post_images pi WHERE pi.post_id = p.id ORDER BY pi.sort_order LIMIT 1) AS cover_image
FROM public.posts p
LEFT JOIN public.profiles pr ON pr.id = p.author_id
LEFT JOIN public.likes l ON l.post_id = p.id
LEFT JOIN public.bookmarks b ON b.post_id = p.id
LEFT JOIN public.post_tags pt ON pt.post_id = p.id
WHERE p.is_published = true
GROUP BY p.id, pr.id;

-- full_profiles view
CREATE OR REPLACE VIEW public.full_profiles AS
SELECT
  p.*,
  COALESCE((SELECT AVG(rating) FROM public.product_reviews r WHERE r.buyer_id = p.id), 0) AS avg_rating,
  (SELECT COUNT(*) FROM public.product_reviews r WHERE r.buyer_id = p.id) AS review_count,
  (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id) AS followers_count,
  (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id) AS following_count,
  (SELECT COUNT(*) FROM public.posts po WHERE po.author_id = p.id AND po.is_published = true) AS posts_count
FROM public.profiles p;

-- stores_trust_metrics view
CREATE OR REPLACE VIEW public.stores_trust_metrics AS
SELECT 
  ts.store_id,
  ts.avg_rating,
  ts.total_reviews,
  ts.communication_score,
  ts.order_completion_rate,
  ts.on_time_delivery_rate,
  ts.trust_score,
  COALESCE(
    (SELECT JSON_AGG(tb.badge_type) FROM public.trust_badges tb WHERE tb.store_id = ts.store_id),
    '[]'::json
  ) AS badges,
  ts.updated_at
FROM public.trust_scores ts;


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
-- ── REVIEW HELPFULNESS POLICIES ──
CREATE POLICY "review_helpful_votes_select" ON public.review_helpful_votes FOR SELECT USING (true);
CREATE POLICY "review_helpful_votes_insert" ON public.review_helpful_votes FOR INSERT WITH CHECK (profile_id = public.get_my_profile_id());
CREATE POLICY "review_helpful_votes_delete" ON public.review_helpful_votes FOR DELETE USING (profile_id = public.get_my_profile_id());
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoted_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_read" ON public.guide_bookings FOR SELECT USING (tourist_id = public.get_my_profile_id() OR guide_id = public.get_my_profile_id());
CREATE POLICY "bookings_insert" ON public.guide_bookings FOR INSERT WITH CHECK (tourist_id = public.get_my_profile_id());
CREATE POLICY "bookings_update" ON public.guide_bookings FOR UPDATE USING (guide_id = public.get_my_profile_id() OR tourist_id = public.get_my_profile_id());

ALTER TABLE public.store_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- ── PROFILES POLICIES ──
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "profiles_insert_webhook" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_owner" ON public.profiles FOR UPDATE USING (clerk_id = public.get_clerk_id() AND deleted_at IS NULL);

-- ── STORES POLICIES ──
CREATE POLICY "stores_select_public" ON public.stores FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "stores_insert_artisan" ON public.stores FOR INSERT WITH CHECK (owner_id = public.get_my_profile_id());
CREATE POLICY "stores_owner_modify" ON public.stores FOR UPDATE USING (owner_id = public.get_my_profile_id() AND deleted_at IS NULL);
CREATE POLICY "stores_owner_delete" ON public.stores FOR DELETE USING (owner_id = public.get_my_profile_id() AND deleted_at IS NULL);

-- ── PRODUCTS POLICIES ──
CREATE POLICY "products_select_public" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_owner_insert" ON public.products FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));
CREATE POLICY "products_owner_update" ON public.products FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));
CREATE POLICY "products_owner_delete" ON public.products FOR DELETE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));

-- ── PRODUCT VARIANTS POLICIES ──
CREATE POLICY "variants_select_public" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "variants_owner_modify" ON public.product_variants FOR ALL USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id())));

-- ── CARTS & CART ITEMS POLICIES (Consolidated and Clerk Safe) ──
CREATE POLICY "carts_select_buyer" ON public.carts FOR SELECT USING (buyer_id = public.get_my_profile_id() OR guest_token IS NOT NULL);
CREATE POLICY "carts_insert_public" ON public.carts FOR INSERT WITH CHECK (true);
CREATE POLICY "carts_update_buyer" ON public.carts FOR UPDATE USING (buyer_id = public.get_my_profile_id() OR guest_token IS NOT NULL);

CREATE POLICY "cart_items_buyer_access" ON public.cart_items FOR ALL USING (cart_id IN (SELECT id FROM public.carts WHERE buyer_id = public.get_my_profile_id() OR guest_token IS NOT NULL));

-- ── INVENTORY LOCKS POLICY (Strict service role only) ──
CREATE POLICY "locks_service_role_only" ON public.inventory_locks FOR ALL TO service_role USING (true);

-- ── CHECKOUT SESSIONS POLICIES ──
CREATE POLICY "checkout_select_buyer" ON public.checkout_sessions FOR SELECT USING (buyer_id = public.get_my_profile_id());
CREATE POLICY "checkout_modify_buyer" ON public.checkout_sessions FOR ALL USING (buyer_id = public.get_my_profile_id() OR buyer_id IS NULL);

-- ── PARENT & CHILD ORDERS POLICIES ──
CREATE POLICY "parent_orders_select_buyer" ON public.parent_orders FOR SELECT USING (buyer_id = public.get_my_profile_id() OR public.is_admin_user());
CREATE POLICY "child_orders_select_buyer" ON public.child_orders FOR SELECT USING (parent_id IN (SELECT id FROM public.parent_orders WHERE buyer_id = public.get_my_profile_id()) OR public.is_admin_user());
CREATE POLICY "child_orders_select_seller" ON public.child_orders FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));
CREATE POLICY "child_orders_update_seller" ON public.child_orders FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));

-- ── ORDER ITEMS & HISTORY POLICIES ──
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (child_order_id IN (SELECT id FROM public.child_orders WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()) OR parent_id IN (SELECT id FROM public.parent_orders WHERE buyer_id = public.get_my_profile_id())) OR public.is_admin_user());
CREATE POLICY "order_history_select" ON public.order_history FOR SELECT USING (child_order_id IN (SELECT id FROM public.child_orders WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()) OR parent_id IN (SELECT id FROM public.parent_orders WHERE buyer_id = public.get_my_profile_id())) OR public.is_admin_user());

-- ── MESSAGING POLICIES (Clerk Safe) ──
CREATE POLICY "chat_threads_select" ON public.chat_threads FOR SELECT USING (buyer_id = public.get_my_profile_id() OR seller_id = public.get_my_profile_id());
CREATE POLICY "chat_threads_insert" ON public.chat_threads FOR INSERT WITH CHECK (buyer_id = public.get_my_profile_id() OR seller_id = public.get_my_profile_id());
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (thread_id IN (SELECT id FROM public.chat_threads WHERE buyer_id = public.get_my_profile_id() OR seller_id = public.get_my_profile_id()));
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (sender_id = public.get_my_profile_id() AND thread_id IN (SELECT id FROM public.chat_threads WHERE buyer_id = public.get_my_profile_id() OR seller_id = public.get_my_profile_id()));
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE USING (thread_id IN (SELECT id FROM public.chat_threads WHERE buyer_id = public.get_my_profile_id() OR seller_id = public.get_my_profile_id()));

-- ── REVIEWS POLICIES (Double-Blind Protected) ──
CREATE POLICY "product_reviews_select" ON public.product_reviews FOR SELECT USING (is_published = true OR buyer_id = public.get_my_profile_id());
CREATE POLICY "product_reviews_insert" ON public.product_reviews FOR INSERT WITH CHECK (buyer_id = public.get_my_profile_id());
CREATE POLICY "buyer_reviews_select" ON public.buyer_reviews FOR SELECT USING (is_published = true OR buyer_id = public.get_my_profile_id() OR seller_id = public.get_my_profile_id());
CREATE POLICY "buyer_reviews_insert" ON public.buyer_reviews FOR INSERT WITH CHECK (seller_id = public.get_my_profile_id());

-- ── TRUST METRICS & BADGES (Public Read Only) ──
CREATE POLICY "trust_scores_select" ON public.trust_scores FOR SELECT USING (true);
CREATE POLICY "trust_badges_select" ON public.trust_badges FOR SELECT USING (true);

-- ── MARKETPLACE ANALYTICS EVENTS POLICIES ──
CREATE POLICY "analytics_insert_public" ON public.marketplace_analytics_events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "analytics_select_owner" ON public.marketplace_analytics_events FOR SELECT USING (
  store_id IN (
    SELECT id FROM public.stores 
    WHERE owner_id = public.get_my_profile_id()
  )
);
CREATE POLICY "analytics_select_admin" ON public.marketplace_analytics_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
  )
);

-- ── NOTIFICATIONS POLICIES ──
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (profile_id = public.get_my_profile_id());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (profile_id = public.get_my_profile_id());

-- ── SHIPPINGS, HUBS, POLICIES & RATES ──
CREATE POLICY "shipping_zones_select" ON public.shipping_zones FOR SELECT USING (true);
CREATE POLICY "carrier_configs_select" ON public.carrier_configs FOR SELECT USING (true);
CREATE POLICY "shipping_policies_select" ON public.store_shipping_policies FOR SELECT USING (true);
CREATE POLICY "shipping_rates_select" ON public.store_shipping_rates FOR SELECT USING (true);
CREATE POLICY "pickup_hubs_select" ON public.pickup_hubs FOR SELECT USING (true);

CREATE POLICY "shipping_policies_write" ON public.store_shipping_policies FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));
CREATE POLICY "shipping_rates_write" ON public.store_shipping_rates FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()));

CREATE POLICY "shipments_select" ON public.shipments FOR SELECT USING (child_order_id IN (SELECT id FROM public.child_orders WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id()) OR parent_id IN (SELECT id FROM public.parent_orders WHERE buyer_id = public.get_my_profile_id())) OR public.is_admin_user());
CREATE POLICY "shipments_write" ON public.shipments FOR ALL USING (child_order_id IN (SELECT id FROM public.child_orders WHERE store_id IN (SELECT id FROM public.stores WHERE owner_id = public.get_my_profile_id())) OR public.is_admin_user());

-- =========================================================
-- 14. TRIGGERS GROUPED BY TABLE
-- =========================================================

-- ── TABLE: profiles ──
-- Trigger to audit-log and protect sensitive profile modifications
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_columns()
RETURNS trigger AS $$
BEGIN
  IF current_setting('role', true) IN ('authenticated', 'anon') THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      NEW.role = OLD.role;
    END IF;
    IF OLD.verified IS DISTINCT FROM NEW.verified THEN
      NEW.verified = OLD.verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_protect_sensitive_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_columns();

-- Trigger to write audit log entries on sensitive updates
CREATE OR REPLACE FUNCTION public.log_sensitive_profile_actions()
RETURNS trigger AS $$
DECLARE
  v_actor_id uuid;
BEGIN
  SELECT id INTO v_actor_id FROM public.profiles WHERE clerk_id = public.get_clerk_id();
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (v_actor_id, 'UPDATE_ROLE', 'profile', NEW.id::text, jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
  END IF;
  IF OLD.verified IS DISTINCT FROM NEW.verified THEN
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (v_actor_id, 'UPDATE_VERIFIED', 'profile', NEW.id::text, jsonb_build_object('old_verified', OLD.verified, 'new_verified', NEW.verified));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_sensitive_profile_actions
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_profile_actions();

-- ── TABLE: stores ──
-- Trigger to auto-create onboarding steps checklist and generate store slugs
CREATE OR REPLACE FUNCTION public.handle_new_store_onboarding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.onboarding_steps (store_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_new_store_onboarding
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store_onboarding();

-- Store slug generation
CREATE OR REPLACE FUNCTION public.generate_store_slug()
RETURNS trigger AS $$
DECLARE
  base_slug text;
  final_slug text;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.name <> OLD.name OR NEW.slug IS NULL THEN
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '[\s_]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug || '-' || substring(md5(random()::text) from 1 for 4);
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_store_slug
  BEFORE INSERT OR UPDATE OF name ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.generate_store_slug();

-- ── TABLE: onboarding_steps ──
-- Complete onboarding checklist trigger checking steps to activate store
CREATE OR REPLACE FUNCTION public.check_onboarding_completion()
RETURNS trigger AS $$
BEGIN
  IF NEW.profile_added = true 
     AND NEW.payout_connected = true 
     AND NEW.first_product_created = true 
     AND NEW.shipping_policy_set = true 
     AND NEW.store_description_added = true THEN
     
     UPDATE public.stores
     SET onboarding_completed = true, is_active = true, updated_at = NOW()
     WHERE id = NEW.store_id;
  ELSE
     UPDATE public.stores
     SET onboarding_completed = false, is_active = false, updated_at = NOW()
     WHERE id = NEW.store_id AND (onboarding_completed = true OR is_active = true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_onboarding_completion
  AFTER UPDATE ON public.onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.check_onboarding_completion();

-- ── TABLE: products ──
-- Alphanumeric safe unique product slug generator
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS trigger AS $$
DECLARE
  base_slug text;
  final_slug text;
  v_count integer := 0;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.name <> OLD.name OR NEW.slug IS NULL THEN
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '[\s_]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN
      base_slug := 'artisanal-item';
    END IF;
    final_slug := base_slug || '-' || substring(md5(random()::text) from 1 for 6);
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.generate_product_slug();

-- ── TABLE: product_inventory ──
-- Set products status to sold_out when available stock reaches zero
CREATE OR REPLACE FUNCTION public.handle_inventory_stock_changes()
RETURNS trigger AS $$
DECLARE
  total_available integer;
  p_status public.product_status;
BEGIN
  SELECT coalesce(sum(available), 0) INTO total_available
  FROM public.product_inventory
  WHERE product_id = NEW.product_id;

  SELECT status INTO p_status FROM public.products WHERE id = NEW.product_id;

  IF total_available <= 0 AND p_status = 'active' THEN
    UPDATE public.products SET status = 'sold_out', stock = 0 WHERE id = NEW.product_id;
  ELSIF total_available > 0 AND p_status = 'sold_out' THEN
    UPDATE public.products SET status = 'active', stock = total_available WHERE id = NEW.product_id;
  ELSE
    UPDATE public.products SET stock = total_available WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_inventory_stock_changes
  AFTER INSERT OR UPDATE ON public.product_inventory
  FOR EACH ROW EXECUTE FUNCTION public.handle_inventory_stock_changes();

-- ── TABLE: cart_items ──
-- Auto-touch cart updated_at on items changes
CREATE OR REPLACE FUNCTION public.fn_touch_cart_updated_at()
RETURNS trigger AS $$
DECLARE
  v_cart_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_cart_id := OLD.cart_id;
  ELSE
    v_cart_id := NEW.cart_id;
  END IF;

  UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_touch_cart_updated_at
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_touch_cart_updated_at();

-- ── TABLE: carts ──
-- Auto-set 30-day sliding expiry date on carts insertion/updates
CREATE OR REPLACE FUNCTION public.fn_set_cart_expiry()
RETURNS trigger AS $$
BEGIN
  NEW.expires_at := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_cart_expiry
  BEFORE INSERT OR UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_cart_expiry();

-- ── TABLE: checkout_sessions ──
-- Trigger to automatically release reserved inventory locks when checkout session transitions to abandoned
CREATE OR REPLACE FUNCTION public.fn_checkout_abandoned_release_locks()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'abandoned' AND OLD.status <> 'abandoned' THEN
    PERFORM public.release_stock(NEW.id::varchar);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_checkout_abandoned_release_locks
  AFTER UPDATE OF status ON public.checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_checkout_abandoned_release_locks();

-- ── TABLE: child_orders ──
-- Enforce OMS state machine transitions
CREATE OR REPLACE FUNCTION public.validate_child_order_transition()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

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
  FOR EACH ROW EXECUTE FUNCTION public.validate_child_order_transition();

-- Handle state transition side-effects (history entries, escrow releases, stock cancellations)
CREATE OR REPLACE FUNCTION public.restore_order_stock(p_child_order_id uuid)
RETURNS boolean AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN SELECT product_id, variant_id, quantity FROM public.order_items WHERE child_order_id = p_child_order_id
  LOOP
    UPDATE public.product_inventory
    SET quantity = quantity + v_item.quantity, last_updated = NOW()
    WHERE product_id = v_item.product_id
      AND (variant_id = v_item.variant_id OR (variant_id IS NULL AND v_item.variant_id IS NULL));
  END LOOP;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_child_order_status_changes()
RETURNS trigger AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO public.order_history (child_order_id, from_status, to_status, actor_role, note)
    VALUES (NEW.id, OLD.status, NEW.status, 'system', 'System transitioned order status from ' || OLD.status || ' to ' || NEW.status || '.');

    IF NEW.status = 'completed' THEN
      UPDATE public.escrow_ledgers
      SET status = 'released', released_at = NOW(), release_trigger = 'buyer_confirmed'
      WHERE child_order_id = NEW.id AND status = 'holding';
    END IF;

    IF NEW.status = 'refunded' THEN
      UPDATE public.escrow_ledgers
      SET status = 'refunded', released_at = NOW(), release_trigger = 'dispute_resolved'
      WHERE child_order_id = NEW.id AND status IN ('holding', 'disputed');
    END IF;

    IF NEW.status = 'cancelled' THEN
      PERFORM public.restore_order_stock(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_child_order_status_changes
  AFTER UPDATE OF status ON public.child_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_order_status_changes();

-- Trigger for initial history logging
CREATE OR REPLACE FUNCTION public.handle_child_order_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.order_history (child_order_id, from_status, to_status, actor_role, note)
  VALUES (NEW.id, 'none', NEW.status, 'system', 'Order created in ' || NEW.status || ' status.');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_child_order_insert
  AFTER INSERT ON public.child_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_child_order_insert();

-- ── TABLE: order_items ──
-- Populate offline product snapshot details during order checkout item insertion
CREATE OR REPLACE FUNCTION public.populate_item_product_snapshot()
RETURNS trigger AS $$
DECLARE
  v_product_name varchar;
  v_product_image varchar;
  v_store_name varchar;
  v_variant_name varchar;
  v_variant_sku varchar;
  v_snapshot jsonb;
BEGIN
  SELECT p.name, COALESCE(p.images[1], ''), s.name
  INTO v_product_name, v_product_image, v_store_name
  FROM public.products p
  JOIN public.stores s ON s.id = p.store_id
  WHERE p.id = NEW.product_id;

  IF NEW.variant_id IS NOT NULL THEN
    SELECT name, sku INTO v_variant_name, v_variant_sku FROM public.product_variants WHERE id = NEW.variant_id;
  END IF;

  v_snapshot = jsonb_build_object(
    'name', COALESCE(v_product_name, 'Deleted Product'),
    'image', COALESCE(v_product_image, ''),
    'price', NEW.unit_price,
    'store_name', COALESCE(v_store_name, 'Unknown Store'),
    'variant_details', CASE WHEN NEW.variant_id IS NOT NULL THEN jsonb_build_object('name', COALESCE(v_variant_name, 'Unknown Variant'), 'sku', COALESCE(v_variant_sku, '')) ELSE NULL END
  );

  NEW.product_snapshot = v_snapshot;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_populate_item_product_snapshot
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.populate_item_product_snapshot();

-- ── TABLE: order_disputes ──
-- Double-blind dispute triggers freezing escrow
CREATE OR REPLACE FUNCTION public.handle_dispute_opened()
RETURNS trigger AS $$
BEGIN
  UPDATE public.escrow_ledgers
  SET status = 'disputed', dispute_opened_at = NOW(), hold_reason = 'Escrow frozen due to active order dispute: ' || NEW.description
  WHERE child_order_id = NEW.child_order_id;
  
  INSERT INTO public.order_history (child_order_id, from_status, to_status, actor_id, actor_role, note)
  VALUES (NEW.child_order_id, (SELECT status FROM public.child_orders WHERE id = NEW.child_order_id), (SELECT status FROM public.child_orders WHERE id = NEW.child_order_id), NEW.opened_by, 'buyer', 'Dispute opened by buyer. Reason: ' || NEW.reason);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_dispute_opened
  AFTER INSERT ON public.order_disputes
  FOR EACH ROW EXECUTE FUNCTION public.handle_dispute_opened();

-- Dispute resolution trigger releasing or refunding escrow
CREATE OR REPLACE FUNCTION public.handle_dispute_resolved()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
    INSERT INTO public.order_history (child_order_id, from_status, to_status, actor_id, actor_role, note)
    VALUES (NEW.child_order_id, (SELECT status FROM public.child_orders WHERE id = NEW.child_order_id), CASE WHEN NEW.resolution = 'refund_buyer' THEN 'refunded' ELSE 'completed' END, NEW.resolved_by, 'admin', 'Dispute resolved by Admin. Action: ' || NEW.resolution || '. Notes: ' || COALESCE(NEW.resolution_notes, ''));

    IF NEW.resolution = 'refund_buyer' THEN
      UPDATE public.escrow_ledgers SET status = 'refunded', released_at = NOW(), release_trigger = 'dispute_resolved' WHERE child_order_id = NEW.child_order_id;
      UPDATE public.child_orders SET status = 'refunded' WHERE id = NEW.child_order_id;
    ELSIF NEW.resolution IN ('release_seller', 'partial_refund') THEN
      UPDATE public.escrow_ledgers SET status = 'released', released_at = NOW(), release_trigger = 'dispute_resolved' WHERE child_order_id = NEW.child_order_id;
      UPDATE public.child_orders SET status = 'completed' WHERE id = NEW.child_order_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_dispute_resolved
  AFTER UPDATE OF status ON public.order_disputes
  FOR EACH ROW EXECUTE FUNCTION public.handle_dispute_resolved();

-- ── TABLE: product_reviews ──
-- Sync review ratings triggers
CREATE OR REPLACE FUNCTION public.trg_fn_on_product_review_insert()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.child_orders co JOIN public.order_items oi ON oi.child_order_id = co.id WHERE co.id = NEW.child_order_id AND co.status IN ('delivered', 'completed') AND oi.product_id = NEW.product_id) THEN
    RAISE EXCEPTION 'Invalid review: This product was not purchased in this order, or the order is not yet delivered/completed.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.child_orders co JOIN public.parent_orders po ON po.id = co.parent_id WHERE co.id = NEW.child_order_id AND po.buyer_id = NEW.buyer_id) THEN
    RAISE EXCEPTION 'Invalid review: The reviewer is not the buyer who placed this order.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_product_review_insert
  BEFORE INSERT ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_on_product_review_insert();

CREATE OR REPLACE FUNCTION public.trg_fn_sync_published_reviews_metrics()
RETURNS trigger AS $$
DECLARE
  v_product_id uuid;
  v_store_id uuid;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  SELECT store_id INTO v_store_id FROM public.products WHERE id = v_product_id;

  UPDATE public.products
  SET rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.product_reviews WHERE product_id = v_product_id AND is_published = true), 0.00),
      total_reviews = COALESCE((SELECT COUNT(*) FROM public.product_reviews WHERE product_id = v_product_id AND is_published = true), 0)
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

-- ── TABLE: buyer_reviews ──
CREATE OR REPLACE FUNCTION public.trg_fn_on_buyer_review_insert()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.child_orders co WHERE co.id = NEW.child_order_id AND co.status IN ('delivered', 'completed')) THEN
    RAISE EXCEPTION 'Invalid review: The order is not yet delivered or completed.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.child_orders co JOIN public.stores s ON s.id = co.store_id WHERE co.id = NEW.child_order_id AND s.owner_id = NEW.seller_id) THEN
    RAISE EXCEPTION 'Invalid review: Only the store owner who fulfilled this order can review the buyer.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_buyer_review_insert
  BEFORE INSERT ON public.buyer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_on_buyer_review_insert();

-- Double-blind publisher trigger
CREATE OR REPLACE FUNCTION public.trg_fn_after_review_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM public.check_and_publish_reviews(NEW.child_order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_product_review_insert
  AFTER INSERT ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_after_review_insert();

CREATE TRIGGER trg_after_buyer_review_insert
  AFTER INSERT ON public.buyer_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_after_review_insert();

-- ── TABLE: shipments ──
-- Shipment insertion tracking propagation trigger
CREATE OR REPLACE FUNCTION public.handle_shipment_insert()
RETURNS trigger AS $$
DECLARE
  v_carrier_name varchar(100);
BEGIN
  IF NEW.carrier_id IS NOT NULL THEN
    SELECT name INTO v_carrier_name FROM public.carrier_configs WHERE id = NEW.carrier_id;
  END IF;

  UPDATE public.child_orders
  SET tracking_number = NEW.tracking_number,
      carrier = COALESCE(v_carrier_name, 'Medina Express Delivery'),
      shipping_label_url = NEW.shipping_label_url,
      estimated_delivery = NEW.estimated_delivery,
      shipped_at = COALESCE(NEW.shipped_at, NOW()),
      status = 'shipped',
      updated_at = NOW()
  WHERE id = NEW.child_order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_shipment_insert
  AFTER INSERT ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_shipment_insert();

-- Shipment delivery transitions trigger
CREATE OR REPLACE FUNCTION public.handle_shipment_delivery()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    UPDATE public.child_orders SET status = 'delivered', delivered_at = COALESCE(NEW.delivered_at, NOW()), updated_at = NOW() WHERE id = NEW.child_order_id;
  END IF;
  IF NEW.status = 'out_for_delivery' AND OLD.status IS DISTINCT FROM 'out_for_delivery' THEN
    UPDATE public.child_orders SET status = 'out_for_delivery', updated_at = NOW() WHERE id = NEW.child_order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_shipment_delivery
  AFTER UPDATE OF status ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.handle_shipment_delivery();

-- =========================================================
-- 15. INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_parent_orders_buyer ON public.parent_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_store ON public.child_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_child_orders_status ON public.child_orders(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_published ON public.product_reviews(product_id, is_published);
CREATE INDEX IF NOT EXISTS idx_chat_threads_buyer_seller ON public.chat_threads(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at ASC);

-- Full text search document compiler on products
ALTER TABLE public.products ADD COLUMN fts_document tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) ||
  to_tsvector('french', coalesce(name_fr, '') || ' ' || coalesce(description_fr, '')) ||
  to_tsvector('simple', coalesce(name_ar, '') || ' ' || coalesce(description_ar, ''))
) STORED;

CREATE INDEX IF NOT EXISTS idx_analytics_events_store_date ON public.marketplace_analytics_events(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_date ON public.marketplace_analytics_events(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date ON public.marketplace_analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING GIN(fts_document);

-- =========================================================
-- 16. DETAILED TRANSACTION-LEVEL SYSTEM AUTOMATIONS
-- =========================================================

-- Escrow Ledger hold-balance syncer trigger
CREATE OR REPLACE FUNCTION public.handle_escrow_held()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'holding' THEN
    INSERT INTO public.seller_balances (store_id, pending_mad, available_mad, total_earned_mad, total_withdrawn_mad, last_updated)
    VALUES (NEW.store_id, NEW.gross_amount, 0.00, 0.00, 0.00, NOW())
    ON CONFLICT (store_id) DO UPDATE
    SET pending_mad = public.seller_balances.pending_mad + NEW.gross_amount, last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_escrow_held
  AFTER INSERT ON public.escrow_ledgers
  FOR EACH ROW EXECUTE FUNCTION public.handle_escrow_held();

-- Escrow Ledger releases/refund balance syncer trigger
CREATE OR REPLACE FUNCTION public.handle_escrow_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'holding' AND NEW.status = 'released' THEN
    UPDATE public.seller_balances
    SET pending_mad = GREATEST(0.00, pending_mad - OLD.gross_amount),
        available_mad = available_mad + NEW.net_amount,
        total_earned_mad = total_earned_mad + NEW.net_amount,
        last_updated = NOW()
    WHERE store_id = NEW.store_id;
  ELSIF OLD.status = 'holding' AND NEW.status = 'refunded' THEN
    UPDATE public.seller_balances
    SET pending_mad = GREATEST(0.00, pending_mad - OLD.gross_amount), last_updated = NOW()
    WHERE store_id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_escrow_update
  AFTER UPDATE ON public.escrow_ledgers
  FOR EACH ROW EXECUTE FUNCTION public.handle_escrow_update();

-- Auto-deduct balances on payout request completion trigger
CREATE OR REPLACE FUNCTION public.handle_payout_completed()
RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'completed' AND NEW.status = 'completed' THEN
    UPDATE public.seller_balances
    SET available_mad = GREATEST(-100000.00, available_mad - NEW.amount),
        total_withdrawn_mad = total_withdrawn_mad + NEW.amount,
        last_updated = NOW()
    WHERE store_id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_payout_completed
  AFTER UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_payout_completed();

-- Double-blind validation and publication evaluator
CREATE OR REPLACE FUNCTION public.check_and_publish_reviews(p_child_order_id uuid)
RETURNS void AS $$
DECLARE
  v_buyer_has_reviewed boolean;
  v_seller_has_reviewed boolean;
  v_delivery_date timestamptz;
  v_window_expired boolean := false;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.product_reviews WHERE child_order_id = p_child_order_id) INTO v_buyer_has_reviewed;
  SELECT EXISTS(SELECT 1 FROM public.buyer_reviews WHERE child_order_id = p_child_order_id) INTO v_seller_has_reviewed;

  SELECT delivered_at INTO v_delivery_date FROM public.child_orders WHERE id = p_child_order_id;
  IF v_delivery_date IS NOT NULL AND (v_delivery_date + INTERVAL '14 days' <= NOW()) THEN
    v_window_expired := true;
  END IF;

  IF (v_buyer_has_reviewed AND v_seller_has_reviewed) OR v_window_expired THEN
    UPDATE public.product_reviews SET is_published = true, published_at = COALESCE(published_at, NOW()) WHERE child_order_id = p_child_order_id AND is_published = false;
    UPDATE public.buyer_reviews SET is_published = true, published_at = COALESCE(published_at, NOW()) WHERE child_order_id = p_child_order_id AND is_published = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Double-blind sweep expired scheduler worker
CREATE OR REPLACE FUNCTION public.sweep_expired_double_blind_reviews()
RETURNS integer AS $$
DECLARE
  r RECORD;
  v_count integer := 0;
BEGIN
  FOR r IN 
    SELECT DISTINCT co.id 
    FROM public.child_orders co
    LEFT JOIN public.product_reviews pr ON pr.child_order_id = co.id AND pr.is_published = false
    LEFT JOIN public.buyer_reviews br ON br.child_order_id = co.id AND br.is_published = false
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

-- Trust score metrics and badges recalculator
CREATE OR REPLACE FUNCTION public.recalculate_store_trust_metrics(p_store_id uuid)
RETURNS void AS $$
DECLARE
  v_avg_rating numeric(3, 2) := 0.00;
  v_total_reviews integer := 0;
  v_completion_rate numeric(5, 2) := 100.00;
  v_on_time_rate numeric(5, 2) := 100.00;
  v_trust_score numeric(5, 2) := 100.00;
  v_completed_count integer := 0;
  v_cancelled_seller integer := 0;
  v_delivered_count integer := 0;
  v_on_time_count integer := 0;
BEGIN
  SELECT COALESCE(ROUND(AVG(pr.rating)::numeric, 2), 0.00), COUNT(pr.id)
  INTO v_avg_rating, v_total_reviews
  FROM public.product_reviews pr
  JOIN public.products p ON p.id = pr.product_id
  WHERE p.store_id = p_store_id AND pr.is_published = true;

  SELECT COUNT(*) INTO v_completed_count FROM public.child_orders WHERE store_id = p_store_id AND status IN ('completed', 'delivered');
  SELECT COUNT(*) INTO v_cancelled_seller FROM public.child_orders WHERE store_id = p_store_id AND status = 'cancelled';

  IF (v_completed_count + v_cancelled_seller) > 0 THEN
    v_completion_rate := ROUND((v_completed_count::numeric / (v_completed_count + v_cancelled_seller)::numeric) * 100.00, 2);
  ELSE
    v_completion_rate := 100.00;
  END IF;

  SELECT COUNT(*) INTO v_delivered_count FROM public.child_orders WHERE store_id = p_store_id AND status IN ('completed', 'delivered') AND delivered_at IS NOT NULL;
  SELECT COUNT(*) INTO v_on_time_count FROM public.child_orders WHERE store_id = p_store_id AND status IN ('completed', 'delivered') AND delivered_at IS NOT NULL AND estimated_delivery IS NOT NULL AND delivered_at::date <= estimated_delivery;

  IF v_delivered_count > 0 THEN
    v_on_time_rate := ROUND((v_on_time_count::numeric / v_delivered_count::numeric) * 100.00, 2);
  ELSE
    v_on_time_rate := 100.00;
  END IF;

  v_trust_score := ROUND((v_avg_rating * 20.0 * 0.40) + (v_completion_rate * 0.30) + (v_on_time_rate * 0.30), 2);

  INSERT INTO public.trust_scores (store_id, avg_rating, total_reviews, order_completion_rate, on_time_delivery_rate, trust_score, updated_at)
  VALUES (p_store_id, v_avg_rating, v_total_reviews, v_completion_rate, v_on_time_rate, v_trust_score, NOW())
  ON CONFLICT (store_id) DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    total_reviews = EXCLUDED.total_reviews,
    order_completion_rate = EXCLUDED.order_completion_rate,
    on_time_delivery_rate = EXCLUDED.on_time_delivery_rate,
    trust_score = EXCLUDED.trust_score,
    updated_at = NOW();

  UPDATE public.stores SET rating = v_avg_rating, total_reviews = v_total_reviews WHERE id = p_store_id;

  -- Sync trust badges
  DELETE FROM public.trust_badges WHERE store_id = p_store_id;
  IF v_avg_rating >= 4.80 AND v_total_reviews >= 10 THEN
    INSERT INTO public.trust_badges (store_id, badge_type) VALUES (p_store_id, 'maallem_master') ON CONFLICT DO NOTHING;
  END IF;
  IF v_on_time_rate >= 95.00 AND v_delivered_count >= 5 THEN
    INSERT INTO public.trust_badges (store_id, badge_type) VALUES (p_store_id, 'fast_shipper') ON CONFLICT DO NOTHING;
  END IF;
  IF v_trust_score >= 95.00 AND v_total_reviews >= 3 THEN
    INSERT INTO public.trust_badges (store_id, badge_type) VALUES (p_store_id, 'highly_trusted') ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trg_fn_sync_order_completion_trust_metrics()
RETURNS trigger AS $$
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


-- ── ADVANCED STORE ANALYTICS SUMMARY FUNCTION ──
CREATE OR REPLACE FUNCTION public.get_store_analytics_summary(
  p_store_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  date date,
  views bigint,
  orders bigint,
  revenue numeric(12, 2),
  cancellation_rate numeric(5, 2),
  conversion_rate numeric(5, 2)
) AS $$
BEGIN
  -- Validate store ownership or admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = p_store_id AND owner_id = public.get_my_profile_id()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE clerk_id = public.get_clerk_id() AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permissions to read analytics for this store.';
  END IF;

  RETURN QUERY
  SELECT 
    m.date,
    COALESCE(SUM(m.views), 0)::bigint as views,
    COALESCE(SUM(m.orders), 0)::bigint as orders,
    COALESCE(SUM(m.revenue), 0.00)::numeric(12, 2) as revenue,
    COALESCE(AVG(m.cancellation_rate), 0.00)::numeric(5, 2) as cancellation_rate,
    (CASE 
      WHEN SUM(m.views) > 0 THEN (SUM(m.orders)::numeric / SUM(m.views)::numeric) * 100.0
      ELSE 0.00 
     END)::numeric(5, 2) as conversion_rate
  FROM public.store_metrics m
  WHERE m.store_id = p_store_id AND m.date BETWEEN p_start_date AND p_end_date
  GROUP BY m.date
  ORDER BY m.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── SYSTEM-WIDE ADMIN LEDGER SUMMARY FUNCTION ──
CREATE OR REPLACE FUNCTION public.get_admin_ledger_summary(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_volume numeric(15, 2),
  total_platform_fees numeric(15, 2),
  total_shipping_costs numeric(15, 2),
  total_seller_earnings numeric(15, 2),
  escrow_holding numeric(15, 2),
  escrow_released numeric(15, 2),
  escrow_refunded numeric(15, 2),
  escrow_disputed numeric(15, 2)
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
    COALESCE(SUM(co.subtotal), 0.00)::numeric(15, 2) as total_volume,
    COALESCE(SUM(co.platform_fee), 0.00)::numeric(15, 2) as total_platform_fees,
    COALESCE(SUM(co.shipping_cost), 0.00)::numeric(15, 2) as total_shipping_costs,
    COALESCE(SUM(co.seller_earnings), 0.00)::numeric(15, 2) as total_seller_earnings,
    COALESCE(SUM(CASE WHEN el.status = 'holding' THEN el.gross_amount ELSE 0.00 END), 0.00)::numeric(15, 2) as escrow_holding,
    COALESCE(SUM(CASE WHEN el.status = 'released' THEN el.gross_amount ELSE 0.00 END), 0.00)::numeric(15, 2) as escrow_released,
    COALESCE(SUM(CASE WHEN el.status = 'refunded' THEN el.gross_amount ELSE 0.00 END), 0.00)::numeric(15, 2) as escrow_refunded,
    COALESCE(SUM(CASE WHEN el.status = 'disputed' THEN el.gross_amount ELSE 0.00 END), 0.00)::numeric(15, 2) as escrow_disputed
  FROM public.child_orders co
  LEFT JOIN public.escrow_ledgers el ON el.child_order_id = co.id
  WHERE co.created_at::date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics page view daily metrics trigger
CREATE OR REPLACE FUNCTION public.sync_view_to_store_metrics()
RETURNS trigger AS $$
BEGIN
  IF NEW.store_id IS NOT NULL AND NEW.event_type IN ('product_view', 'store_view') THEN
    INSERT INTO public.store_metrics (store_id, date, views, orders, revenue, avg_response_time_minutes, cancellation_rate)
    VALUES (NEW.store_id, NEW.created_at::date, 1, 0, 0.00, 0, 0.00)
    ON CONFLICT (store_id, date) DO UPDATE SET views = public.store_metrics.views + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_view_analytics
  AFTER INSERT ON public.marketplace_analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_view_to_store_metrics();

-- Analytics order daily metrics sync trigger
CREATE OR REPLACE FUNCTION public.sync_order_to_store_metrics()
RETURNS trigger AS $$
DECLARE
  v_date date;
  v_store_id uuid;
  v_total_orders integer;
  v_total_cancelled integer;
  v_total_revenue numeric(12, 2);
  v_cancellation_rate numeric(5, 2);
  v_divisor integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
    v_date := OLD.created_at::date;
  ELSE
    v_store_id := NEW.store_id;
    v_date := NEW.created_at::date;
  END IF;

  IF v_store_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(subtotal), 0.00)
  INTO v_total_orders, v_total_revenue
  FROM public.child_orders
  WHERE store_id = v_store_id AND created_at::date = v_date AND status != 'cancelled';

  SELECT COUNT(*) INTO v_total_cancelled
  FROM public.child_orders
  WHERE store_id = v_store_id AND created_at::date = v_date AND status = 'cancelled';

  v_divisor := v_total_orders + v_total_cancelled;
  IF v_divisor > 0 THEN
    v_cancellation_rate := (v_total_cancelled::numeric / v_divisor::numeric) * 100.0;
  ELSE
    v_cancellation_rate := 0.00;
  END IF;

  INSERT INTO public.store_metrics (store_id, date, views, orders, revenue, avg_response_time_minutes, cancellation_rate)
  VALUES (v_store_id, v_date, 0, v_total_orders, v_total_revenue, 0, v_cancellation_rate)
  ON CONFLICT (store_id, date) DO UPDATE SET
    orders = v_total_orders,
    revenue = v_total_revenue,
    cancellation_rate = v_cancellation_rate;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_order_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.child_orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_to_store_metrics();

-- ── TRANSACTION-SAFE PROCEDURES ──
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_qty integer,
  p_checkout_id varchar,
  p_ttl_minutes integer DEFAULT 10
)
RETURNS boolean AS $$
DECLARE
  v_available integer;
  v_reserved integer;
  v_quantity integer;
  v_cleaned_variant_id uuid;
BEGIN
  v_cleaned_variant_id := COALESCE(p_variant_id, '00000000-0000-0000-0000-000000000000'::uuid);
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product % does not exist', p_product_id;
  END IF;
  IF p_variant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.product_variants WHERE id = p_variant_id) THEN
    RAISE EXCEPTION 'Variant % does not exist', p_variant_id;
  END IF;

  INSERT INTO public.product_inventory (product_id, variant_id, quantity, reserved)
  VALUES (p_product_id, p_variant_id, 0, 0)
  ON CONFLICT (product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  IF p_variant_id IS NULL THEN
    SELECT quantity, reserved, available INTO v_quantity, v_reserved, v_available
    FROM public.product_inventory WHERE product_id = p_product_id AND variant_id IS NULL FOR UPDATE;
  ELSE
    SELECT quantity, reserved, available INTO v_quantity, v_reserved, v_available
    FROM public.product_inventory WHERE product_id = p_product_id AND variant_id = p_variant_id FOR UPDATE;
  END IF;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Inventory not seeded';
  END IF;

  IF v_available < p_qty THEN
    RAISE EXCEPTION 'Insufficient stock. Requested %, available %', p_qty, v_available;
  END IF;

  INSERT INTO public.inventory_locks (product_id, variant_id, quantity, checkout_id, expires_at)
  VALUES (p_product_id, p_variant_id, p_qty, p_checkout_id, NOW() + (p_ttl_minutes || ' minutes')::interval);

  IF p_variant_id IS NULL THEN
    UPDATE public.product_inventory SET reserved = reserved + p_qty, last_updated = NOW() WHERE product_id = p_product_id AND variant_id IS NULL;
  ELSE
    UPDATE public.product_inventory SET reserved = reserved + p_qty, last_updated = NOW() WHERE product_id = p_product_id AND variant_id = p_variant_id;
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_stock(p_checkout_id varchar)
RETURNS boolean AS $$
DECLARE
  v_lock RECORD;
  v_released_any boolean := false;
BEGIN
  FOR v_lock IN SELECT * FROM public.inventory_locks WHERE checkout_id = p_checkout_id AND released = false FOR UPDATE
  LOOP
    IF v_lock.variant_id IS NULL THEN
      UPDATE public.product_inventory SET reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW() WHERE product_id = v_lock.product_id AND variant_id IS NULL;
    ELSE
      UPDATE public.product_inventory SET reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW() WHERE product_id = v_lock.product_id AND variant_id = v_lock.variant_id;
    END IF;
    UPDATE public.inventory_locks SET released = true WHERE id = v_lock.id;
    v_released_any := true;
  END LOOP;
  RETURN v_released_any;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.confirm_stock_deduction(p_checkout_id varchar)
RETURNS boolean AS $$
DECLARE
  v_lock RECORD;
  v_deducted_any boolean := false;
BEGIN
  FOR v_lock IN SELECT * FROM public.inventory_locks WHERE checkout_id = p_checkout_id AND released = false FOR UPDATE
  LOOP
    IF v_lock.variant_id IS NULL THEN
      UPDATE public.product_inventory SET quantity = GREATEST(0, quantity - v_lock.quantity), reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW() WHERE product_id = v_lock.product_id AND variant_id IS NULL;
    ELSE
      UPDATE public.product_inventory SET quantity = GREATEST(0, quantity - v_lock.quantity), reserved = GREATEST(0, reserved - v_lock.quantity), last_updated = NOW() WHERE product_id = v_lock.product_id AND variant_id = v_lock.variant_id;
    END IF;
    UPDATE public.inventory_locks SET released = true WHERE id = v_lock.id;
    v_deducted_any := true;
  END LOOP;
  RETURN v_deducted_any;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_expired_locks()
RETURNS integer AS $$
DECLARE
  v_lock RECORD;
  v_released_count integer := 0;
BEGIN
  FOR v_lock IN SELECT DISTINCT checkout_id FROM public.inventory_locks WHERE expires_at < NOW() AND released = false
  LOOP
    IF public.release_stock(v_lock.checkout_id) THEN
      v_released_count := v_released_count + 1;
    END IF;
  END LOOP;
  RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add a default shipping policy when a storefront is created
CREATE OR REPLACE FUNCTION public.handle_store_created_shipping_policy()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.store_shipping_policies (
    store_id, offers_local_pickup, local_pickup_address, local_pickup_coords, local_pickup_fee,
    offers_national, offers_international, free_shipping_threshold_mad, handling_time_days,
    ships_from_city, ships_from_coords
  ) VALUES (
    NEW.id, false, 'Essaouira Medina Partner Pickup Hub', ST_SetSRID(ST_Point(-9.7595, 31.5085), 4326), 0.00,
    true, false, NULL, 1, 'Essaouira', ST_SetSRID(ST_Point(-9.7595, 31.5085), 4326)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_store_created_shipping_policy
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_store_created_shipping_policy();

-- =========================================================
-- 17. STORAGE BUCKETS INITIALIZATION
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('avatars', 'avatars', true, 5242880),
  ('covers', 'covers', true, 10485760),
  ('posts', 'posts', true, 20971520),
  ('portfolio', 'portfolio', true, 20971520),
  ('products', 'products', true, 20971520),
  ('html', 'html', false, 1048576)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;

CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars','covers','posts','portfolio','products'));

CREATE POLICY "storage_auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'covers', 'posts', 'portfolio', 'products'));

CREATE POLICY "storage_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars', 'covers', 'posts', 'portfolio', 'products'));

-- =========================================================
-- 18. SEED DATA
-- =========================================================

-- Sample Store tiers
INSERT INTO public.store_tiers (name, max_products, commission_rate, featured_slots, price_mad, features)
VALUES 
  ('Bronze', 10, 0.10, 0, 0.00, '{"custom_analytics": false, "dedicated_support": false}'),
  ('Silver', 50, 0.08, 5, 150.00, '{"custom_analytics": true, "dedicated_support": false}'),
  ('Gold', 200, 0.05, 15, 400.00, '{"custom_analytics": true, "dedicated_support": true}')
ON CONFLICT (name) DO NOTHING;

-- Sample Categories (Hierarchical tree seed)
INSERT INTO public.categories (name, name_ar, name_fr, slug, icon_url, sort_order)
VALUES
  ('Rugs & Tapestries', 'زرابي ومنسوجات', 'Tapis & Tapisseries', 'rugs-tapestries', 'rug', 1),
  ('Wood Carvings', 'نحت خشبي', 'Sculptures sur Bois', 'wood-carvings', 'hammer', 2),
  ('Oils & Cosmetics', 'زيوت ومستحضرات تجميل', 'Huiles & Cosmétiques', 'oils-cosmetics', 'droplet', 3),
  ('Excursions & Guided Tours', 'جولات استكشافية سياحية', 'Excursions & Visites Guidées', 'guided-excursions', 'map-pin', 4),
  ('Surf & Water Sports Lessons', 'حصص ركوب أمواج ورياضات مائية', 'Leçons de Surf & Sports Nautiques', 'surf-water-lessons', 'wind', 5),
  ('Culinary Arts & Cooking Classes', 'ورشات طبخ وفنون طهي', 'Cours de Cuisine & Arts Culinaires', 'cooking-classes', 'utensils', 6)
ON CONFLICT (slug) DO NOTHING;

-- Grant explicit permissions on all existing tables, sequences and functions in schema public to Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Complete ✓
