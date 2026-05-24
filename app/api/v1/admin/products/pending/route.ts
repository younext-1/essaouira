import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
})

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/admin/products/pending
 * Retrieves the catalog moderation queue containing all listings with status = 'draft'.
 * Restricted to administrators and moderators.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit } = querySchema.parse(Object.fromEntries(searchParams.entries()))

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = createPublicSupabaseClient()

    // Query both total counts and actual records concurrently
    const countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')

    const query = supabase
      .from('products')
      .select('*, store:stores(name, slug, category, location, rating), category:categories(name, name_ar, name_fr, slug)')
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .range(from, to)

    const [countRes, dataRes] = await Promise.all([countQuery, query])

    if (countRes.error) throw countRes.error
    if (dataRes.error) throw dataRes.error

    const total = countRes.count ?? 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: dataRes.data ?? [],
      message: 'Moderation queue (pending drafts) retrieved successfully.',
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/admin/products/pending error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching moderation queue.'
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
