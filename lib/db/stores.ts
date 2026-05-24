import { createClient } from '@/lib/supabase/server'
import type { Store, StoreMetric, StoreSubscription, StoreTier, OnboardingStep } from '@/lib/database.types'
import { writeAuditLog } from '@/lib/db/users'

/**
 * Fetches all active, non-deleted stores.
 */
export async function getStores(): Promise<Store[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Store[]) ?? []
}

/**
 * Fetches a single store by its unique UUID.
 */
export async function getStore(id: string): Promise<Store | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return null
  return data as Store
}

/**
 * Fetches a single store by its slug.
 */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return null
  return data as Store
}

/**
 * Fetches a single store owned by a specific profile ID.
 */
export async function getStoreByOwner(ownerId: string): Promise<Store | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return null
  return data as Store
}

/**
 * Paginated active stores listing utilizing offset range queries.
 */
export async function getStoresPaginated(
  page = 1,
  limit = 12
): Promise<{ data: Store[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const countQuery = supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('deleted_at', null)

  const query = supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  const [countRes, dataRes] = await Promise.all([countQuery, query])

  if (countRes.error) throw countRes.error
  if (dataRes.error) throw dataRes.error

  const total = countRes.count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: (dataRes.data as Store[]) ?? [],
    total,
    page,
    totalPages,
  }
}

/**
 * Lists paginated stores filtered by a specific category.
 */
export async function getStoresByCategory(
  category: string,
  page = 1,
  limit = 12
): Promise<{ data: Store[]; total: number; page: number; totalPages: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let countQuery = supabase
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('deleted_at', null)

  let query = supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (category && category !== 'all' && category !== 'All') {
    countQuery = countQuery.eq('category', category)
    query = query.eq('category', category)
  }

  const [countRes, dataRes] = await Promise.all([countQuery, query])

  if (countRes.error) throw countRes.error
  if (dataRes.error) throw dataRes.error

  const total = countRes.count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: (dataRes.data as Store[]) ?? [],
    total,
    page,
    totalPages,
  }
}

/**
 * Creates a new artisan store and checks if owner is a verified artisan.
 */
export async function createStore(data: {
  owner_id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  banner_url?: string | null
  avatar_url?: string | null
  category?: string | null
  location?: string | null
  phone?: string | null
  whatsapp?: string | null
  working_hours?: Record<string, string>
}): Promise<Store> {
  const supabase = await createClient()

  // Verify that the user profile is verified and is an artisan
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, verified')
    .eq('id', data.owner_id)
    .single()

  if (profileErr || !profile) {
    throw new Error('Owner profile not found.')
  }

  if (profile.role !== 'artisan' || !profile.verified) {
    throw new Error('Only verified artisans can create a storefront.')
  }

  // Insert store record (trigger will automatically create onboarding step)
  const { data: store, error } = await supabase
    .from('stores')
    .insert({
      ...data,
      is_active: false, // starts inactive until onboarding completes
      is_verified: false,
      onboarding_completed: false,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('You already own an active store. Limit is one store per artisan.')
    }
    throw error
  }

  // Auto-subscribe the new store to the 'Bronze' tier by default
  try {
    const { data: tier } = await supabase
      .from('store_tiers')
      .select('id')
      .eq('name', 'Bronze')
      .maybeSingle()

    if (tier) {
      await supabase.from('store_subscriptions').insert({
        store_id: store.id,
        tier_id: tier.id,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        is_active: true,
      })
    }
  } catch (subErr) {
    console.error('Failed to create default subscription tier for store:', subErr)
  }

  return store as Store
}

/**
 * Updates store settings. Restricted to owner.
 */
export async function updateStoreSettings(
  storeId: string,
  fields: {
    name?: string
    description?: string | null
    logo_url?: string | null
    banner_url?: string | null
    avatar_url?: string | null
    category?: string | null
    location?: string | null
    phone?: string | null
    whatsapp?: string | null
    working_hours?: Record<string, string>
  }
): Promise<Store> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data as Store
}

/**
 * Soft deletes a store. Restricted to owner.
 */
export async function softDeleteStore(storeId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('stores')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', storeId)

  if (error) throw error
}

/**
 * Retrieves store dashboard metrics summary and subscription tier metadata.
 */
export async function getStoreDashboard(storeId: string): Promise<any> {
  const supabase = await createClient()

  // 1. Fetch store info
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .is('deleted_at', null)
    .single()

  if (storeErr || !store) throw new Error('Store not found.')

  // 2. Fetch subscription tier
  const { data: subscription } = await supabase
    .from('store_subscriptions')
    .select('*, tier:store_tiers(*)')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .maybeSingle()

  // 3. Fetch latest metrics snapshot
  const { data: latestMetric } = await supabase
    .from('store_metrics')
    .select('*')
    .eq('store_id', storeId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 4. Fetch total products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  return {
    store,
    subscription: subscription || null,
    metrics: latestMetric || {
      views: 0,
      orders: 0,
      revenue: 0,
      avg_response_time_minutes: 0,
      cancellation_rate: 0,
    },
    productsCount: productsCount ?? 0,
  }
}

/**
 * Fetches store daily metrics history for charts.
 */
export async function getStoreMetrics(storeId: string, days = 7): Promise<StoreMetric[]> {
  const supabase = await createClient()
  const dateCutoff = new Date()
  dateCutoff.setDate(dateCutoff.getDate() - days)

  const { data, error } = await supabase
    .from('store_metrics')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', dateCutoff.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) throw error
  return (data as StoreMetric[]) ?? []
}

/**
 * Fetches the onboarding checklist status for a store.
 */
export async function getOnboardingStatus(storeId: string): Promise<OnboardingStep> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('onboarding_steps')
    .select('*')
    .eq('store_id', storeId)
    .single()

  if (error) throw error
  return data as OnboardingStep
}

/**
 * Updates a specific onboarding checklist step.
 */
export async function updateOnboardingStep(
  storeId: string,
  step: 'profile_added' | 'payout_connected' | 'first_product_created' | 'shipping_policy_set' | 'store_description_added',
  value = true
): Promise<OnboardingStep> {
  const supabase = await createClient()

  // Perform onboarding update
  const { data, error } = await supabase
    .from('onboarding_steps')
    .update({
      [step]: value,
      updated_at: new Date().toISOString(),
    })
    .eq('store_id', storeId)
    .select()
    .single()

  if (error) throw error
  return data as OnboardingStep
}

/**
 * Admin: list pending stores awaiting review.
 */
export async function getPendingStores(): Promise<Store[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('onboarding_completed', true)
    .eq('is_verified', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as Store[]) ?? []
}

/**
 * Admin: Approve storefront and set verified/active.
 */
export async function approveStore(
  storeId: string,
  actorId: string,
  ipAddress?: string
): Promise<Store> {
  const supabase = await createClient()

  const { data: store, error } = await supabase
    .from('stores')
    .update({
      is_verified: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error

  // Log administrative audit action
  await writeAuditLog({
    actor_id: actorId,
    action: 'ADMIN_APPROVE_STORE',
    target_type: 'store',
    target_id: storeId,
    metadata: { store_name: store.name },
    ip_address: ipAddress || null,
  })

  return store as Store
}

/**
 * Admin: Suspend store account.
 */
export async function suspendStore(
  storeId: string,
  reason: string,
  actorId: string,
  ipAddress?: string
): Promise<Store> {
  const supabase = await createClient()

  const { data: store, error } = await supabase
    .from('stores')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error

  // Log administrative audit action
  await writeAuditLog({
    actor_id: actorId,
    action: 'ADMIN_SUSPEND_STORE',
    target_type: 'store',
    target_id: storeId,
    metadata: { store_name: store.name, reason },
    ip_address: ipAddress || null,
  })

  return store as Store
}
