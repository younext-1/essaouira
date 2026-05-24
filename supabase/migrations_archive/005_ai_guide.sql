-- =============================================
-- Migration 005: AI Conversations unique constraint
-- Required for upsert({ onConflict: 'user_id' }) in the AI Guide API
-- =============================================

-- Add unique constraint on user_id so each user has one conversation row
alter table public.ai_conversations
  drop constraint if exists ai_conversations_user_id_key;

alter table public.ai_conversations
  add constraint ai_conversations_user_id_key unique (user_id);

-- Add price_mad column to services if not already present
-- (original schema used price_usd; the app expects price_mad)
alter table public.services
  add column if not exists price_mad numeric;

-- Add onboarding_done, craft_category, languages, full_name_ar, title_ar, bio_ar,
-- craft_category, is_open_now, work_start_time, work_end_time, work_days,
-- clerk_id, role, custom_html, custom_html_enabled, custom_html_filename
-- to profiles if missing (added by 002/004 but guard here)
alter table public.profiles
  add column if not exists clerk_id text unique,
  add column if not exists role text default 'tourist',
  add column if not exists full_name_ar text,
  add column if not exists title text,
  add column if not exists title_ar text,
  add column if not exists bio text,
  add column if not exists bio_ar text,
  add column if not exists craft_category text,
  add column if not exists languages text[] default '{ar}',
  add column if not exists is_open_now boolean default false,
  add column if not exists work_start_time text,
  add column if not exists work_end_time text,
  add column if not exists work_days text[],
  add column if not exists onboarding_done boolean default false,
  add column if not exists custom_html text,
  add column if not exists custom_html_enabled boolean default false,
  add column if not exists custom_html_filename text;

-- Index for clerk_id lookups (used in AI guide API)
create index if not exists idx_profiles_clerk_id on public.profiles(clerk_id);
