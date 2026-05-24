import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, getStoreBySlug, getStoreDashboard } from '@/lib/db/stores'

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
 * GET /api/v1/stores/[id_or_slug]/dashboard
 * Retrieves comprehensive owner dashboard metrics summary, subscription, and counts.
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

    const store = await resolveStore(idOrSlug)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // Verify ownership or administrative privilege
    const isAuthorized =
      store.owner_id === profile.id ||
      profile.role === 'admin' ||
      profile.role === 'moderator'

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden: You are not authorized to view this store dashboard.' },
        { status: 403 }
      )
    }

    // Retrieve metrics, subscription tier details, and products count
    const dashboardData = await getStoreDashboard(store.id)

    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Store owner dashboard analytics retrieved successfully.',
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/stores/[id_or_slug]/dashboard API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching dashboard analytics.',
      },
      { status: 500 }
    )
  }
})
