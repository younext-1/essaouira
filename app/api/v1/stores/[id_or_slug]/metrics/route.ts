import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, getStoreBySlug, getStoreMetrics } from '@/lib/db/stores'

const queryParamsSchema = z.object({
  days: z.preprocess(
    (val) => (val ? parseInt(val as string, 10) : 7),
    z.number().int().min(1).max(365).default(7)
  ),
})

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

async function resolveStore(idOrSlug: string) {
  if (isUuid(idOrSlug)) {
    return await getStore(idOrSlug)
  }
  return await getStoreBySlug(idOrSlug)
}

/**
 * GET /api/v1/stores/[id_or_slug]/metrics
 * Retrieves daily store metrics snapshots for chart visualization.
 * Query parameters: `days` (optional, default 7, max 365).
 * Restricted to the store owner or admin/moderator.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const idOrSlug = resolvedParams?.id_or_slug

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store ID or Slug parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Resolve query params (e.g., number of history days)
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const parsedParams = queryParamsSchema.safeParse({ days: daysParam })

    if (!parsedParams.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid query parameters.',
          errors: parsedParams.error.format(),
        },
        { status: 400 }
      )
    }

    const store = await resolveStore(idOrSlug)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Verify store ownership or elevated role privileges
    const isAuthorized =
      store.owner_id === profile.id ||
      profile.role === 'admin' ||
      profile.role === 'moderator'

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden: You are not authorized to view metrics for this store.' },
        { status: 403 }
      )
    }

    // 3. Fetch daily metrics history
    const days = parsedParams.data.days
    const metrics = await getStoreMetrics(store.id, days)

    return NextResponse.json({
      success: true,
      data: metrics,
      message: `Daily metrics history for the last ${days} days retrieved successfully.`,
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/stores/[id_or_slug]/metrics API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching metrics history.',
      },
      { status: 500 }
    )
  }
})
