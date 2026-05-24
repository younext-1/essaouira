-- 1. Ensure public.profiles table has clerk_id text column and all standard fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'tourist',
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_tourist BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_artisan BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;

-- 2. Ensure uuid-ossp extension is enabled for UUID helper functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Ensure profiles primary key id is auto-generated using gen_random_uuid()
ALTER TABLE public.profiles 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
