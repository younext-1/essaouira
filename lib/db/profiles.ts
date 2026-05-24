import { createClient } from '@/lib/supabase/server'
import type { Profile, ProfileStat, Specialty, Service, PortfolioItem, Review } from '@/lib/database.types'

export interface FullProfile extends Profile {
  stats: ProfileStat[]
  specialties: Specialty[]
  services: Service[]
  portfolio: PortfolioItem[]
  reviews: Review[]
}

export async function getProfile(username: string): Promise<FullProfile | null> {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !profile) return null

  const [stats, specialties, services, portfolio, reviews] = await Promise.all([
    supabase
      .from('profile_stats')
      .select('*')
      .eq('profile_id', profile.id)
      .order('sort_order'),
    supabase
      .from('specialties')
      .select('*')
      .eq('profile_id', profile.id)
      .order('sort_order'),
    supabase
      .from('services')
      .select('*')
      .eq('profile_id', profile.id)
      .order('sort_order'),
    supabase
      .from('portfolio_items')
      .select('*')
      .eq('profile_id', profile.id)
      .order('sort_order'),
    supabase
      .from('product_reviews')
      .select('*, products(name, thumbnail_url)')
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false }),
  ])

  return {
    ...profile,
    stats: stats.data ?? [],
    specialties: specialties.data ?? [],
    services: services.data ?? [],
    portfolio: portfolio.data ?? [],
    reviews: reviews.data ?? [],
  } as FullProfile
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Profile
}

export async function updateProfile(id: string, data: Partial<Profile>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id)
    return false // unfollowed
  } else {
    await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    })
    return true // followed
  }
}

export async function getFollowCounts(profileId: string) {
  const supabase = await createClient()

  const [followers, following] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileId),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profileId),
  ])

  return {
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  return !!data
}

export async function getFeaturedProfiles(limit = 6): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_artisan', true)
    .not('avatar_url', 'is', null)
    .limit(limit)

  if (error) throw error
  return (data as Profile[]) ?? []
}
