import { createClient } from '@/lib/supabase/server'
import type { Review } from '@/lib/database.types'

export async function getReviews(profileId: string): Promise<Review[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Review[]) ?? []
}

export async function createReview(data: {
  profile_id: string
  reviewer_id?: string
  author_name?: string
  flag?: string
  text: string
  stars: number
}) {
  const supabase = await createClient()
  const { data: review, error } = await supabase
    .from('reviews')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return review as Review
}
