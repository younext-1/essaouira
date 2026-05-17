-- =============================================
-- Mogador Connect: Complete Database Schema
-- =============================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  cover_url text,
  title text,
  location text,
  bio text,
  verified boolean default false,
  profile_md text,
  is_artisan boolean default false,
  is_tourist boolean default true,
  website text,
  whatsapp text,
  instagram text,
  facebook text,
  tiktok text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, is_artisan, is_tourist)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce((new.raw_user_meta_data->>'is_artisan')::boolean, false),
    coalesce((new.raw_user_meta_data->>'is_tourist')::boolean, true)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- PROFILE STATS
-- =============================================
create table if not exists public.profile_stats (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  label text not null,
  value text not null,
  suffix text default '',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- SPECIALTIES
-- =============================================
create table if not exists public.specialties (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  icon text,
  label text not null,
  is_active boolean default false,
  sort_order integer default 0
);

-- =============================================
-- SERVICES
-- =============================================
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  icon text,
  title text not null,
  description text,
  duration text,
  price text,
  price_usd numeric,
  is_available boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- POSTS
-- =============================================
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  content text,
  category text check (category in ('artisan', 'music', 'surf', 'food', 'culture', 'other')),
  location text,
  is_featured boolean default false,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.post_images (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  url text not null,
  alt text,
  sort_order integer default 0
);

create table if not exists public.post_tags (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  tag text not null
);

-- =============================================
-- LIKES / BOOKMARKS / FOLLOWS
-- =============================================
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- =============================================
-- PORTFOLIO ITEMS
-- =============================================
create table if not exists public.portfolio_items (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  image_url text,
  price_mad numeric,
  price_usd numeric,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- PRODUCTS (Marketplace)
-- =============================================
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price_mad numeric not null,
  price_usd numeric,
  category text,
  image_url text,
  in_stock boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- REVIEWS
-- =============================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  author_name text,
  flag text,
  text text not null,
  stars integer check (stars >= 1 and stars <= 5) default 5,
  created_at timestamptz default now()
);

-- =============================================
-- AI CONVERSATIONS
-- =============================================
create table if not exists public.ai_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- GUIDE BOOKINGS
-- =============================================
create table if not exists public.guide_bookings (
  id uuid default uuid_generate_v4() primary key,
  tourist_id uuid references public.profiles(id) on delete cascade not null,
  guide_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  date date not null,
  time time,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz default now()
);

-- =============================================
-- VIEW: Posts with counts
-- =============================================
create or replace view public.posts_with_counts as
select
  p.id, p.author_id, p.title, p.content, p.category, p.location,
  p.is_featured, p.view_count, p.created_at, p.updated_at,
  pr.username, pr.full_name, pr.avatar_url, pr.verified,
  pr.location as author_location,
  (select count(*) from public.likes l where l.post_id = p.id) as likes_count,
  (select count(*) from public.bookmarks b where b.post_id = p.id) as bookmarks_count,
  (select array_agg(pt.tag) from public.post_tags pt where pt.post_id = p.id) as tags,
  (select pi.url from public.post_images pi where pi.post_id = p.id order by pi.sort_order limit 1) as cover_image
from public.posts p
join public.profiles pr on p.author_id = pr.id;

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_category on public.posts(category);
create index if not exists idx_posts_featured on public.posts(is_featured);
create index if not exists idx_likes_post on public.likes(post_id);
create index if not exists idx_likes_user on public.likes(user_id);
create index if not exists idx_bookmarks_post on public.bookmarks(post_id);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_seller on public.products(seller_id);

-- =============================================
-- RLS POLICIES
-- =============================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.post_tags enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;
alter table public.profile_stats enable row level security;
alter table public.specialties enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.guide_bookings enable row level security;

-- Profiles: public read, owner update
create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts: public read, author write
create policy "Posts are publicly viewable" on public.posts for select using (true);
create policy "Users can create posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Users can update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = author_id);

-- Post images/tags: public read
create policy "Post images are publicly viewable" on public.post_images for select using (true);
create policy "Post tags are publicly viewable" on public.post_tags for select using (true);
create policy "Post images insert" on public.post_images for insert with check (true);
create policy "Post tags insert" on public.post_tags for insert with check (true);

-- Likes: public read, user write own
create policy "Likes are publicly viewable" on public.likes for select using (true);
create policy "Users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- Bookmarks: user read/write own
create policy "Users can view own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users can bookmark" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can unbookmark" on public.bookmarks for delete using (auth.uid() = user_id);

-- Follows: public read, user write own
create policy "Follows are publicly viewable" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Profile stats/specialties/services/portfolio: public read
create policy "Stats are publicly viewable" on public.profile_stats for select using (true);
create policy "Specialties are publicly viewable" on public.specialties for select using (true);
create policy "Services are publicly viewable" on public.services for select using (true);
create policy "Portfolio items are publicly viewable" on public.portfolio_items for select using (true);

-- Products: public read, seller write
create policy "Products are publicly viewable" on public.products for select using (true);
create policy "Sellers can create products" on public.products for insert with check (auth.uid() = seller_id);
create policy "Sellers can update products" on public.products for update using (auth.uid() = seller_id);

-- Reviews: public read, authenticated write
create policy "Reviews are publicly viewable" on public.reviews for select using (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() is not null);

-- AI Conversations: user read/write own
create policy "Users can view own conversations" on public.ai_conversations for select using (auth.uid() = user_id);
create policy "Users can create conversations" on public.ai_conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own conversations" on public.ai_conversations for update using (auth.uid() = user_id);

-- Guide Bookings: involved parties read, tourist create
create policy "Users can view own bookings" on public.guide_bookings for select using (auth.uid() = tourist_id or auth.uid() = guide_id);
create policy "Users can create bookings" on public.guide_bookings for insert with check (auth.uid() = tourist_id);
create policy "Guides can update booking status" on public.guide_bookings for update using (auth.uid() = guide_id);

-- =============================================
-- REALTIME
-- =============================================
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.posts;
