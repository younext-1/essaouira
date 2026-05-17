import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/lib/database.types'

export async function getProducts(category?: string): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })

  if (category && category !== 'الكل') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as Product[]) ?? []
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Product
}

export async function createProduct(data: {
  seller_id: string
  title: string
  description?: string
  price_mad: number
  price_usd?: number
  category?: string
  image_url?: string
}) {
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return product as Product
}

export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Product[]) ?? []
}
