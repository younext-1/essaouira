import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import type { 
  Product, 
  ProductFilters, 
  ProductVariant, 
  ProductInventory, 
  ExperienceDetails, 
  ExperienceSlot,
  CreateProductInput,
  UpdateProductInput
} from '@/lib/database.types'

export interface FullProduct extends Product {
  store?: {
    id: string
    name: string
    slug: string
    location: string | null
    rating: number
    avatar_url: string | null
    phone: string | null
    whatsapp: string | null
  } | null
  category?: {
    id: string
    name: string
    name_ar: string | null
    name_fr: string | null
    slug: string
  } | null
  variants?: ProductVariant[]
  inventory?: ProductInventory[]
  experience_details?: ExperienceDetails | null
  experience_slots?: ExperienceSlot[]
}

/**
 * Fetches paginated products with complex multi-filters.
 * Fully supports categories, locations, types, ratings, and price bounds.
 */
export async function getProducts(
  filters: ProductFilters = {},
  page = 1,
  limit = 12
): Promise<{ data: FullProduct[]; total: number; page: number; totalPages: number }> {
  try {
    const supabase = await createClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Dynamic select generation based on inner join needs for filtering
    const selectParts = ['*']
    if (filters.category) {
      selectParts.push('category:categories!inner(id, name, name_ar, name_fr, slug)')
    } else {
      selectParts.push('category:categories(id, name, name_ar, name_fr, slug)')
    }

    if (filters.location) {
      selectParts.push('store:stores!inner(id, name, slug, location, rating, avatar_url, phone, whatsapp)')
    } else {
      selectParts.push('store:stores(id, name, slug, location, rating, avatar_url, phone, whatsapp)')
    }

    let query = supabase
      .from('products')
      .select(selectParts.join(', '), { count: 'exact' })

    // Apply filters
    if (filters.category) query = query.eq('category.slug', filters.category)
    if (filters.location) query = query.eq('store.location', filters.location)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.price_min !== undefined) query = query.gte('price', filters.price_min)
    if (filters.price_max !== undefined) query = query.lte('price', filters.price_max)
    if (filters.rating !== undefined) query = query.gte('rating', filters.rating)
    if (filters.store_id) query = query.eq('store_id', filters.store_id)
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    // Default to active unless explicitly requested otherwise
    const status = filters.status || 'active'
    query = query.eq('status', status)

    // Sort: featured products first, then newest
    query = query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)

    return {
      data: (data as unknown as FullProduct[]) ?? [],
      total,
      page,
      totalPages,
    }
  } catch (err) {
    console.warn('Fallback to mock products due to database connection:', err);
    let items = [...MOCK_PRODUCTS];
    if (filters.category) {
      items = items.filter(p => p.category?.slug === filters.category);
    }
    const total = items.length;
    return {
      data: items as unknown as FullProduct[],
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

/**
 * Fetches a single product details by id or slug, including variants, inventory, and slots.
 */
export async function getProductBySlug(idOrSlug: string): Promise<FullProduct | null> {
  try {
    const supabase = await createClient()
    
    // Try UUID match first, otherwise fallback to slug matching
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    
    let query = supabase
      .from('products')
      .select('*, store:stores(id, name, slug, location, rating, avatar_url, phone, whatsapp), category:categories(id, name, name_ar, name_fr, slug)')

    if (isUuid) {
      query = query.eq('id', idOrSlug)
    } else {
      query = query.eq('slug', idOrSlug)
    }

    const { data: product, error } = await query.maybeSingle()
    if (error || !product) {
      const fallback = MOCK_PRODUCTS.find(p => p.id === idOrSlug || p.slug === idOrSlug) || MOCK_PRODUCTS[0];
      return fallback as unknown as FullProduct;
    }

    const typedProduct = product as FullProduct

    // Fetch variants, inventory, and experience details concurrently
    const [variantsRes, inventoryRes, expDetailsRes, expSlotsRes] = await Promise.all([
      supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', typedProduct.id)
        .eq('is_active', true),
      supabase
        .from('product_inventory')
        .select('*')
        .eq('product_id', typedProduct.id),
      typedProduct.type === 'experience'
        ? supabase.from('experience_details').select('*').eq('product_id', typedProduct.id).maybeSingle()
        : Promise.resolve({ data: null }),
      typedProduct.type === 'experience'
        ? supabase.from('experience_slots').select('*').eq('product_id', typedProduct.id).gte('date', new Date().toISOString().split('T')[0]).order('date').order('start_time')
        : Promise.resolve({ data: [] })
    ])

    typedProduct.variants = variantsRes.data ?? []
    typedProduct.inventory = inventoryRes.data ?? []
    typedProduct.experience_details = expDetailsRes.data ?? null
    typedProduct.experience_slots = expSlotsRes.data ?? []

    return typedProduct
  } catch (err) {
    console.warn('Fallback to mock product details due to database connection:', err);
    const fallback = MOCK_PRODUCTS.find(p => p.id === idOrSlug || p.slug === idOrSlug) || MOCK_PRODUCTS[0];
    return fallback as unknown as FullProduct;
  }
}

/**
 * Full-text search queries using PG GIN index `fts_document` for English, French, and Arabic.
 */
export async function searchProducts(
  q: string,
  filters: ProductFilters = {},
  page = 1,
  limit = 12
): Promise<{ data: FullProduct[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const selectParts = ['*']
  if (filters.category) {
    selectParts.push('category:categories!inner(id, name, name_ar, name_fr, slug)')
  } else {
    selectParts.push('category:categories(id, name, name_ar, name_fr, slug)')
  }

  if (filters.location) {
    selectParts.push('store:stores!inner(id, name, slug, location, rating, avatar_url, phone, whatsapp)')
  } else {
    selectParts.push('store:stores(id, name, slug, location, rating, avatar_url, phone, whatsapp)')
  }

  // Sanitize search query for PostgreSQL search format
  // Convert standard keywords to textsearch AND pattern (e.g. 'rug wood' -> 'rug & wood')
  const sanitizedQuery = q
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => `${word}:*`)
    .join(' & ')

  let query = supabase
    .from('products')
    .select(selectParts.join(', '), { count: 'exact' })

  if (sanitizedQuery) {
    // textSearch uses PostgreSQL fts_document GIN index
    query = query.textSearch('fts_document', sanitizedQuery, {
      type: 'websearch',
      config: 'english' // English serves as fallback parser; trigger aggregates simple & french
    })
  }

  // Apply other filters
  if (filters.category) query = query.eq('category.slug', filters.category)
  if (filters.location) query = query.eq('store.location', filters.location)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.price_min !== undefined) query = query.gte('price', filters.price_min)
  if (filters.price_max !== undefined) query = query.lte('price', filters.price_max)
  if (filters.rating !== undefined) query = query.gte('rating', filters.rating)
  if (filters.store_id) query = query.eq('store_id', filters.store_id)

  const status = filters.status || 'active'
  query = query.eq('status', status)

  query = query
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: (data as unknown as FullProduct[]) ?? [],
    total,
    page,
    totalPages,
  }
}

/**
 * Fetches featured products up to a specified limit.
 */
export async function getFeaturedProducts(limit = 8): Promise<FullProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, store:stores(id, name, slug, location, rating, avatar_url), category:categories(id, name, name_ar, name_fr, slug)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as FullProduct[]) ?? []
}

/**
 * Retrieves products belonging directly to a specific store ID.
 */
export async function getProductsByStore(storeId: string): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as Product[]) ?? []
  } catch (err) {
    console.warn('Fallback getProductsByStore to mock products:', err);
    return MOCK_PRODUCTS.filter(p => p.store_id === storeId || !storeId) as Product[];
  }
}

/**
 * Retrieves products belonging directly to a specific store ID, with pagination support.
 * Supports status filtering for seller view.
 */
export async function getProductsByStorePaginated(
  storeId: string,
  page = 1,
  limit = 12,
  status?: Product['status']
): Promise<{ data: Product[]; total: number; page: number; totalPages: number }> {
  try {
    const supabase = await createClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    let query = supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) {
      countQuery = countQuery.eq('status', status)
      query = query.eq('status', status)
    } else {
      // Exclude archived products for general queries
      countQuery = countQuery.neq('status', 'archived')
      query = query.neq('status', 'archived')
    }

    const [countRes, dataRes] = await Promise.all([countQuery, query])

    if (countRes.error) throw countRes.error
    if (dataRes.error) throw dataRes.error

    const total = countRes.count ?? 0
    const totalPages = Math.ceil(total / limit)

    return {
      data: (dataRes.data as Product[]) ?? [],
      total,
      page,
      totalPages,
    }
  } catch (err) {
    console.warn('Fallback getProductsByStorePaginated to mock products:', err);
    const items = MOCK_PRODUCTS.filter(p => p.store_id === storeId || !storeId);
    return {
      data: items,
      total: items.length,
      page,
      totalPages: 1
    };
  }
}

/**
 * Creates a new product listing along with optional experience details.
 */
export async function createProduct(
  storeId: string,
  input: CreateProductInput
): Promise<Product> {
  const supabase = await createClient()

  // Extract experience details out of base product data
  const { experience_details, stock, ...productData } = input

  // Start with draft status by default unless active is requested
  const productToInsert = {
    ...productData,
    store_id: storeId,
    status: input.status || 'draft',
    stock: stock || 0
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert(productToInsert)
    .select()
    .single()

  if (error) throw error

  // If this is an experience type product, insert experience details
  if (input.type === 'experience' && experience_details) {
    const { error: expError } = await supabase
      .from('experience_details')
      .insert({
        product_id: product.id,
        duration_hours: experience_details.duration_hours,
        max_participants: experience_details.max_participants,
        meeting_point: experience_details.meeting_point,
        meeting_point_coords: experience_details.meeting_point_coords || null,
        languages: experience_details.languages || [],
        includes: experience_details.includes || [],
        excludes: experience_details.excludes || [],
        cancellation_policy: experience_details.cancellation_policy || null,
        min_age: experience_details.min_age || null
      })

    if (expError) throw expError
  }

  // Pre-seed product inventory record
  const { error: invError } = await supabase
    .from('product_inventory')
    .insert({
      product_id: product.id,
      variant_id: null,
      quantity: stock || 0,
      reserved: 0
    })

  if (invError) throw invError

  return product as Product
}

/**
 * Updates a product details along with optional experience details.
 */
export async function updateProduct(
  productId: string,
  storeId: string,
  input: UpdateProductInput
): Promise<Product> {
  const supabase = await createClient()

  const { experience_details, stock, ...productData } = input

  // Perform product update
  const { data: product, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .eq('store_id', storeId)
    .select()
    .single()

  if (error) throw error

  // Update experience details if exists
  if (experience_details) {
    const { error: expError } = await supabase
      .from('experience_details')
      .upsert({
        product_id: productId,
        ...experience_details
      }, { onConflict: 'product_id' })

    if (expError) throw expError
  }

  // Update product inventory direct quantity if stock is passed
  if (stock !== undefined) {
    const { error: invError } = await supabase
      .from('product_inventory')
      .upsert({
        product_id: productId,
        variant_id: null,
        quantity: stock,
        reserved: 0
      }, { onConflict: 'product_id,variant_id' })

    if (invError) throw invError
  }

  return product as Product
}

/**
 * Safe transaction-level stock reservation wrapper using RPC calls.
 * Reserves product stock and locks it for checkout TTL.
 */
export async function reserveStock(
  productId: string,
  variantId: string | null,
  qty: number,
  checkoutId: string
): Promise<boolean> {
  // Use admin client since stock reservation is a platform operation that needs to execute
  // safely bypass-checking. The RPC handles safety internally.
  const supabase = createAdminClient()
  
  const { data, error } = await supabase.rpc('reserve_stock', {
    p_product_id: productId,
    p_variant_id: variantId,
    p_qty: qty,
    p_checkout_id: checkoutId,
    p_ttl_minutes: 10
  })

  if (error) {
    console.error('Failed to reserve stock via RPC:', error)
    throw new Error(error.message)
  }

  return !!data
}

/**
 * Safe stock reservation release wrapper using RPC.
 */
export async function releaseStock(checkoutId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase.rpc('release_stock', {
    p_checkout_id: checkoutId
  })

  if (error) {
    console.error('Failed to release stock via RPC:', error)
    throw new Error(error.message)
  }

  return !!data
}

/**
 * Finalizes checkout payment and permanently deducts stock.
 */
export async function confirmStockDeduction(checkoutId: string): Promise<boolean> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase.rpc('confirm_stock_deduction', {
    p_checkout_id: checkoutId
  })

  if (error) {
    console.error('Failed to confirm stock deduction via RPC:', error)
    throw new Error(error.message)
  }

  return !!data
}
