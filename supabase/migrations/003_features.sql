-- =============================================
-- Migration 003: Feature additions
-- =============================================

-- 1. Add is_published to posts
alter table public.posts 
  add column if not exists is_published boolean default true;

-- 2. Add custom HTML columns to profiles
alter table public.profiles
  add column if not exists custom_html text,
  add column if not exists custom_html_enabled boolean default false,
  add column if not exists custom_html_filename text;

-- 3. Increment view count function
create or replace function public.increment_view_count(p_post_id uuid)
returns void as $$
  update public.posts set view_count = view_count + 1 where id = p_post_id;
$$ language sql security definer;

-- 4. Updated posts_with_counts view (only published, includes username)
create or replace view public.posts_with_counts as
select
  p.id, p.author_id, p.title, p.content, p.category, p.location,
  p.is_featured, p.view_count, p.created_at, p.updated_at,
  pr.username, pr.full_name, pr.avatar_url, pr.verified,
  pr.location as author_location,
  pr.whatsapp as author_whatsapp,
  (select count(*) from public.likes l where l.post_id = p.id) as likes_count,
  (select count(*) from public.bookmarks b where b.post_id = p.id) as bookmarks_count,
  (select array_agg(pt.tag) from public.post_tags pt where pt.post_id = p.id) as tags,
  (select pi.url from public.post_images pi where pi.post_id = p.id order by pi.sort_order limit 1) as cover_image
from public.posts p
join public.profiles pr on p.author_id = pr.id
where p.is_published = true;

-- 5. Full profiles view with aggregated stats
create or replace view public.full_profiles as
select
  p.*,
  coalesce(avg(r.stars), 0) as avg_rating,
  count(distinct r.id) as review_count,
  count(distinct f.follower_id) as followers_count,
  count(distinct f2.following_id) as following_count,
  count(distinct po.id) as posts_count
from public.profiles p
left join public.reviews r on r.profile_id = p.id
left join public.follows f on f.following_id = p.id
left join public.follows f2 on f2.follower_id = p.id
left join public.posts po on po.author_id = p.id and po.is_published = true
group by p.id;
