-- ══════════════════════════════════════════════════
-- 004_production.sql — Final production schema
-- Run this in Supabase SQL Editor
-- This is IDEMPOTENT — safe to run multiple times
-- ══════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Ensure all columns exist on profiles ──────────
do $$ begin
  -- Add missing columns (safe: does nothing if they exist)
  begin alter table public.profiles add column if not exists onboarding_done boolean default false; exception when others then null; end;
  begin alter table public.profiles add column if not exists craft_category text; exception when others then null; end;
  begin alter table public.profiles add column if not exists custom_html text; exception when others then null; end;
  begin alter table public.profiles add column if not exists custom_html_enabled boolean default false; exception when others then null; end;
  begin alter table public.profiles add column if not exists custom_html_filename text; exception when others then null; end;
  begin alter table public.profiles add column if not exists is_open_now boolean default true; exception when others then null; end;
  begin alter table public.profiles add column if not exists work_start_time time default '09:00'; exception when others then null; end;
  begin alter table public.profiles add column if not exists work_end_time time default '18:00'; exception when others then null; end;
  begin alter table public.profiles add column if not exists work_days text[] default array['mon','tue','wed','thu','fri','sat']; exception when others then null; end;
  begin alter table public.profiles add column if not exists is_published boolean default true; exception when others then null; end;
  begin alter table public.profiles add column if not exists is_tourist boolean default true; exception when others then null; end;
end $$;

-- ── Ensure posts has is_published ──────────
do $$ begin
  begin alter table public.posts add column if not exists is_published boolean default true; exception when others then null; end;
end $$;

-- ══════════════════════════════════════════════════
-- VIEWS (drop + recreate for safety)
-- ══════════════════════════════════════════════════

create or replace view public.posts_with_counts as
select
  p.*,
  pr.username,
  pr.full_name,
  pr.avatar_url,
  pr.verified,
  pr.location as author_location,
  pr.craft_category,
  pr.whatsapp as author_whatsapp,
  count(distinct l.id)  as likes_count,
  count(distinct b.id)  as bookmarks_count,
  array_agg(distinct pt.tag)
    filter (where pt.tag is not null) as tags,
  (select url from post_images pi
   where pi.post_id = p.id
   order by pi.sort_order limit 1) as cover_image
from posts p
left join profiles pr on pr.id = p.author_id
left join likes l on l.post_id = p.id
left join bookmarks b on b.post_id = p.id
left join post_tags pt on pt.post_id = p.id
where p.is_published = true
group by p.id, pr.id;

create or replace view public.full_profiles as
select
  p.*,
  coalesce(avg(r.stars), 0)        as avg_rating,
  count(distinct r.id)             as review_count,
  count(distinct f.follower_id)    as followers_count,
  count(distinct f2.following_id)  as following_count,
  count(distinct po.id)            as posts_count
from profiles p
left join reviews r  on r.profile_id = p.id
left join follows f  on f.following_id = p.id
left join follows f2 on f2.follower_id = p.id
left join posts po   on po.author_id = p.id
                     and po.is_published = true
group by p.id;

-- ══════════════════════════════════════════════════
-- FUNCTIONS
-- ══════════════════════════════════════════════════

-- Auto-update timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers (drop first to avoid duplicate errors)
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

drop trigger if exists posts_updated_at on posts;
create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- Increment view count
create or replace function increment_view_count(post_id uuid)
returns void as $$
  update posts set view_count = view_count + 1
  where id = post_id;
$$ language sql security definer;

-- Toggle like
create or replace function toggle_like(
  p_user_id uuid,
  p_post_id uuid
) returns boolean as $$
declare
  existing_id uuid;
begin
  select id into existing_id
  from likes
  where user_id = p_user_id and post_id = p_post_id;

  if existing_id is not null then
    delete from likes where id = existing_id;
    return false;
  else
    insert into likes (user_id, post_id) values (p_user_id, p_post_id);
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Toggle bookmark
create or replace function toggle_bookmark(
  p_user_id uuid,
  p_post_id uuid
) returns boolean as $$
declare
  existing_id uuid;
begin
  select id into existing_id
  from bookmarks
  where user_id = p_user_id and post_id = p_post_id;

  if existing_id is not null then
    delete from bookmarks where id = existing_id;
    return false;
  else
    insert into bookmarks (user_id, post_id)
    values (p_user_id, p_post_id);
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Toggle follow
create or replace function toggle_follow(
  p_follower_id uuid,
  p_following_id uuid
) returns boolean as $$
declare
  existing_id uuid;
begin
  select id into existing_id
  from follows
  where follower_id = p_follower_id
    and following_id = p_following_id;

  if existing_id is not null then
    delete from follows where id = existing_id;
    return false;
  else
    insert into follows (follower_id, following_id)
    values (p_follower_id, p_following_id);
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Check username availability
create or replace function is_username_available(p_username text)
returns boolean as $$
  select not exists (
    select 1 from profiles where username = p_username
  );
$$ language sql stable;

-- ══════════════════════════════════════════════════
-- RLS HELPER FUNCTIONS
-- ══════════════════════════════════════════════════

create or replace function get_clerk_id()
returns text as $$
  select nullif(
    current_setting('request.jwt.claims', true)::json->>'sub', ''
  );
$$ language sql stable;

create or replace function get_my_profile_id()
returns uuid as $$
  select id from profiles where clerk_id = get_clerk_id();
$$ language sql stable;

-- ══════════════════════════════════════════════════
-- RLS POLICIES (drop + recreate for idempotency)
-- ══════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.profiles       enable row level security;
alter table public.profile_stats  enable row level security;
alter table public.specialties    enable row level security;
alter table public.services       enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.posts          enable row level security;
alter table public.post_images    enable row level security;
alter table public.post_tags      enable row level security;
alter table public.likes          enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.follows        enable row level security;
alter table public.products       enable row level security;
alter table public.reviews        enable row level security;
alter table public.ai_conversations enable row level security;

-- Drop existing policies (safe if they don't exist)
do $$ begin
  -- Profiles
  drop policy if exists "profiles_public_read" on profiles;
  drop policy if exists "profiles_owner_all" on profiles;
  -- Stats
  drop policy if exists "stats_public_read" on profile_stats;
  drop policy if exists "stats_owner_all" on profile_stats;
  -- Specialties
  drop policy if exists "specialties_public_read" on specialties;
  drop policy if exists "specialties_owner_all" on specialties;
  -- Services
  drop policy if exists "services_public_read" on services;
  drop policy if exists "services_owner_all" on services;
  -- Portfolio
  drop policy if exists "portfolio_public_read" on portfolio_items;
  drop policy if exists "portfolio_owner_all" on portfolio_items;
  -- Posts
  drop policy if exists "posts_published_read" on posts;
  drop policy if exists "posts_owner_all" on posts;
  -- Post images
  drop policy if exists "post_images_public_read" on post_images;
  drop policy if exists "post_images_owner_all" on post_images;
  -- Post tags
  drop policy if exists "post_tags_public_read" on post_tags;
  drop policy if exists "post_tags_owner_all" on post_tags;
  -- Likes
  drop policy if exists "likes_public_read" on likes;
  drop policy if exists "likes_owner_all" on likes;
  -- Bookmarks
  drop policy if exists "bookmarks_owner_all" on bookmarks;
  -- Follows
  drop policy if exists "follows_public_read" on follows;
  drop policy if exists "follows_owner_all" on follows;
  -- Products
  drop policy if exists "products_public_read" on products;
  drop policy if exists "products_owner_all" on products;
  -- Reviews
  drop policy if exists "reviews_public_read" on reviews;
  drop policy if exists "reviews_auth_insert" on reviews;
  -- AI
  drop policy if exists "ai_conv_owner" on ai_conversations;
end $$;

-- Create policies
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_owner_all" on profiles for all using (clerk_id = get_clerk_id());

create policy "stats_public_read" on profile_stats for select using (true);
create policy "stats_owner_all" on profile_stats for all using (profile_id = get_my_profile_id());

create policy "specialties_public_read" on specialties for select using (true);
create policy "specialties_owner_all" on specialties for all using (profile_id = get_my_profile_id());

create policy "services_public_read" on services for select using (true);
create policy "services_owner_all" on services for all using (profile_id = get_my_profile_id());

create policy "portfolio_public_read" on portfolio_items for select using (true);
create policy "portfolio_owner_all" on portfolio_items for all using (profile_id = get_my_profile_id());

create policy "posts_published_read" on posts for select using (is_published = true);
create policy "posts_owner_all" on posts for all using (author_id = get_my_profile_id());

create policy "post_images_public_read" on post_images for select using (true);
create policy "post_images_owner_all" on post_images for all using (
  post_id in (select id from posts where author_id = get_my_profile_id())
);

create policy "post_tags_public_read" on post_tags for select using (true);
create policy "post_tags_owner_all" on post_tags for all using (
  post_id in (select id from posts where author_id = get_my_profile_id())
);

create policy "likes_public_read" on likes for select using (true);
create policy "likes_owner_all" on likes for all using (user_id = get_my_profile_id());

create policy "bookmarks_owner_all" on bookmarks for all using (user_id = get_my_profile_id());

create policy "follows_public_read" on follows for select using (true);
create policy "follows_owner_all" on follows for all using (follower_id = get_my_profile_id());

create policy "products_public_read" on products for select using (true);
create policy "products_owner_all" on products for all using (seller_id = get_my_profile_id());

create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_auth_insert" on reviews for insert with check (reviewer_id = get_my_profile_id());

create policy "ai_conv_owner" on ai_conversations for all using (user_id = get_my_profile_id());

-- ══════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ══════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars',   'avatars',   true, 5242880),
  ('covers',    'covers',    true, 10485760),
  ('posts',     'posts',     true, 20971520),
  ('portfolio', 'portfolio', true, 20971520),
  ('products',  'products',  true, 20971520),
  ('html',      'html',      false, 1048576)
on conflict (id) do nothing;

-- Storage policies (drop + recreate)
do $$ begin
  drop policy if exists "storage_public_read" on storage.objects;
  drop policy if exists "storage_auth_upload" on storage.objects;
  drop policy if exists "storage_owner_delete" on storage.objects;
end $$;

create policy "storage_public_read" on storage.objects for select
  using (bucket_id in ('avatars','covers','posts','portfolio','products'));

create policy "storage_auth_upload" on storage.objects for insert
  with check (true);  -- Allow all uploads (auth checked at app level)

create policy "storage_owner_delete" on storage.objects for delete
  using (true);  -- Allow cleanup (auth checked at app level)

-- ══════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════
create index if not exists idx_posts_author     on posts(author_id);
create index if not exists idx_posts_category   on posts(category);
create index if not exists idx_posts_created    on posts(created_at desc);
create index if not exists idx_posts_published  on posts(is_published);
create index if not exists idx_likes_post       on likes(post_id);
create index if not exists idx_likes_user       on likes(user_id);
create index if not exists idx_bookmarks_user   on bookmarks(user_id);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_profiles_clerk   on profiles(clerk_id);
create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_profiles_role    on profiles(role);
create index if not exists idx_products_seller  on products(seller_id);
create index if not exists idx_reviews_profile  on reviews(profile_id);

-- ══════════════════════════════════════════════════
-- DONE ✓
-- ══════════════════════════════════════════════════
