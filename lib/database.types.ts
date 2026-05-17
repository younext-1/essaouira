// Hand-written types matching the Supabase SQL schema.
// Replace with `supabase gen types` output for production.

export interface Profile {
  id: string
  clerk_id: string | null
  email: string | null
  role: 'tourist' | 'artisan' | 'admin' | null
  username: string
  full_name: string | null
  avatar_url: string | null
  cover_url: string | null
  title: string | null
  location: string | null
  bio: string | null
  verified: boolean
  profile_md: string | null
  is_artisan: boolean
  is_tourist: boolean
  website: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  created_at: string
  updated_at: string
}

export interface ProfileStat {
  id: string
  profile_id: string
  label: string
  value: string
  suffix: string
  sort_order: number
  created_at: string
}

export interface Specialty {
  id: string
  profile_id: string
  icon: string | null
  label: string
  is_active: boolean
  sort_order: number
}

export interface Service {
  id: string
  profile_id: string
  icon: string | null
  title: string
  description: string | null
  duration: string | null
  price: string | null
  price_usd: number | null
  is_available: boolean
  sort_order: number
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string | null
  content: string | null
  category: 'artisan' | 'music' | 'surf' | 'food' | 'culture' | 'other' | null
  location: string | null
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface PostImage {
  id: string
  post_id: string
  url: string
  alt: string | null
  sort_order: number
}

export interface PostTag {
  id: string
  post_id: string
  tag: string
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface PortfolioItem {
  id: string
  profile_id: string
  title: string
  image_url: string | null
  price_mad: number | null
  price_usd: number | null
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string | null
  price_mad: number
  price_usd: number | null
  category: string | null
  image_url: string | null
  in_stock: boolean
  created_at: string
}

export interface Review {
  id: string
  profile_id: string
  reviewer_id: string | null
  author_name: string | null
  flag: string | null
  text: string
  stars: number
  created_at: string
}

export interface AiConversation {
  id: string
  user_id: string
  messages: { role: 'user' | 'ai'; content: string }[]
  created_at: string
  updated_at: string
}

export interface GuideBooking {
  id: string
  tourist_id: string
  guide_id: string
  service_id: string | null
  date: string
  time: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
}

// View type: posts_with_counts
export interface PostWithCounts {
  id: string
  author_id: string
  title: string | null
  content: string | null
  category: string | null
  location: string | null
  is_featured: boolean
  view_count: number
  created_at: string
  updated_at: string
  username: string
  full_name: string | null
  avatar_url: string | null
  verified: boolean
  author_location: string | null
  likes_count: number
  bookmarks_count: number
  tags: string[] | null
  cover_image: string | null
}
