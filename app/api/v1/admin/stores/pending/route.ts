import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getPendingStores } from '@/lib/db/stores'

/**
 * GET /api/v1/admin/stores/pending
 * Retrieves a list of stores that have finished onboarding and are waiting for admin approval.
 * Restricted to administrators and moderators.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const pendingStores = await getPendingStores()

    return NextResponse.json({
      success: true,
      data: pendingStores,
      message: 'Pending storefronts awaiting administrative verification retrieved successfully.',
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/admin/stores/pending API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching pending storefronts.',
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
