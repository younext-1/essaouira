import { createClient } from '@/lib/supabase/server'
import type { PostWithCounts } from '@/lib/database.types'

export async function getPosts(category?: string): Promise<PostWithCounts[]> {
  const supabase = await createClient()
  let query = supabase
    .from('posts_with_counts')
    .select('*')
    .order('created_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as PostWithCounts[]) ?? []
}

export async function getFeaturedPosts(): Promise<PostWithCounts[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts_with_counts')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return (data as PostWithCounts[]) ?? []
}

export async function getPost(id: string) {
  const supabase = await createClient()
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  const { data: images } = await supabase
    .from('post_images')
    .select('*')
    .eq('post_id', id)
    .order('sort_order')

  const { data: tags } = await supabase
    .from('post_tags')
    .select('tag')
    .eq('post_id', id)

  return {
    ...post,
    images: images ?? [],
    tags: tags?.map((t: { tag: string }) => t.tag) ?? [],
  }
}

export async function getPostImages(postId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_images')
    .select('url, alt')
    .eq('post_id', postId)
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id)
    return false // unliked
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId })
    return true // liked
  }
}

export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId })
    return true
  }
}

export async function getUserLikedPostIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)

  return data?.map((l: { post_id: string }) => l.post_id) ?? []
}

export async function getUserBookmarkedPostIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', userId)

  return data?.map((b: { post_id: string }) => b.post_id) ?? []
}

/**
 * FIX 7: Range-based offset pagination for blog posts.
 */
export async function getPostsPaginated(
  page = 1,
  limit = 10,
  category?: string
): Promise<{ data: PostWithCounts[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let countQuery = supabase
    .from('posts_with_counts')
    .select('*', { count: 'exact', head: true })

  let query = supabase
    .from('posts_with_counts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (category && category !== 'all' && category !== 'All' && category !== 'الكل') {
    countQuery = countQuery.eq('category', category)
    query = query.eq('category', category)
  }

  const [countRes, dataRes] = await Promise.all([countQuery, query])

  if (countRes.error) throw countRes.error
  if (dataRes.error) throw dataRes.error

  const total = countRes.count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: (dataRes.data as PostWithCounts[]) ?? [],
    total,
    page,
    totalPages,
  }
}
