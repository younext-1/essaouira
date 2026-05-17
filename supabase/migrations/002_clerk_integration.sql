-- =============================================
-- Migration 002: Clerk Integration
-- =============================================
-- This migration adapts the profiles table and RLS
-- to work with Clerk as the auth provider.

-- 1. Add Clerk-specific columns
alter table public.profiles
  add column if not exists clerk_id text unique,
  add column if not exists email text,
  add column if not exists role text default 'tourist'
    check (role in ('tourist', 'artisan', 'admin'));

-- 2. Create index for fast clerk_id lookups
create index if not exists idx_profiles_clerk_id on public.profiles(clerk_id);

-- 3. Function to extract clerk_id from JWT sub claim
create or replace function public.get_clerk_id()
returns text as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )
$$ language sql stable;

-- 4. Drop the old auth.users trigger (Clerk manages users now)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 5. Drop old auth.uid()-based policies and recreate with clerk_id
-- PROFILES
drop policy if exists "Profiles are publicly viewable" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_owner_write" on public.profiles for update
  using (clerk_id = get_clerk_id());
create policy "profiles_insert" on public.profiles for insert
  with check (true); -- webhook uses service role, so this is permissive

-- POSTS
drop policy if exists "Posts are publicly viewable" on public.posts;
drop policy if exists "Users can create posts" on public.posts;
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Users can delete own posts" on public.posts;

create policy "posts_public_read" on public.posts for select using (true);
create policy "posts_owner_insert" on public.posts for insert
  with check (
    author_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "posts_owner_update" on public.posts for update
  using (
    author_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "posts_owner_delete" on public.posts for delete
  using (
    author_id in (select id from profiles where clerk_id = get_clerk_id())
  );

-- LIKES
drop policy if exists "Likes are publicly viewable" on public.likes;
drop policy if exists "Users can like" on public.likes;
drop policy if exists "Users can unlike" on public.likes;

create policy "likes_public_read" on public.likes for select using (true);
create policy "likes_insert" on public.likes for insert
  with check (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "likes_delete" on public.likes for delete
  using (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );

-- BOOKMARKS
drop policy if exists "Users can view own bookmarks" on public.bookmarks;
drop policy if exists "Users can bookmark" on public.bookmarks;
drop policy if exists "Users can unbookmark" on public.bookmarks;

create policy "bookmarks_owner_read" on public.bookmarks for select
  using (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "bookmarks_insert" on public.bookmarks for insert
  with check (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "bookmarks_delete" on public.bookmarks for delete
  using (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );

-- FOLLOWS
drop policy if exists "Follows are publicly viewable" on public.follows;
drop policy if exists "Users can follow" on public.follows;
drop policy if exists "Users can unfollow" on public.follows;

create policy "follows_public_read" on public.follows for select using (true);
create policy "follows_insert" on public.follows for insert
  with check (
    follower_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "follows_delete" on public.follows for delete
  using (
    follower_id in (select id from profiles where clerk_id = get_clerk_id())
  );

-- AI CONVERSATIONS
drop policy if exists "Users can view own conversations" on public.ai_conversations;
drop policy if exists "Users can create conversations" on public.ai_conversations;
drop policy if exists "Users can update own conversations" on public.ai_conversations;

create policy "ai_conv_owner_read" on public.ai_conversations for select
  using (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "ai_conv_insert" on public.ai_conversations for insert
  with check (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "ai_conv_update" on public.ai_conversations for update
  using (
    user_id in (select id from profiles where clerk_id = get_clerk_id())
  );

-- GUIDE BOOKINGS
drop policy if exists "Users can view own bookings" on public.guide_bookings;
drop policy if exists "Users can create bookings" on public.guide_bookings;
drop policy if exists "Guides can update booking status" on public.guide_bookings;

create policy "bookings_read" on public.guide_bookings for select
  using (
    tourist_id in (select id from profiles where clerk_id = get_clerk_id())
    or guide_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "bookings_insert" on public.guide_bookings for insert
  with check (
    tourist_id in (select id from profiles where clerk_id = get_clerk_id())
  );
create policy "bookings_update" on public.guide_bookings for update
  using (
    guide_id in (select id from profiles where clerk_id = get_clerk_id())
  );

-- Keep existing public read policies for static tables
-- (profile_stats, specialties, services, portfolio_items, products, reviews)
-- These are already correct (select using true).
