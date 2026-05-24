import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, approveStore } from '@/lib/db/stores'

/**
 * POST /api/v1/admin/stores/[id]/approve
 * Approves an artisan store to go active and verified.
 * Restricted to administrators and moderators.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const storeId = resolvedParams?.id

    if (!storeId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store ID parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Verify store exists
    const store = await getStore(storeId)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Fetch IP address for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'

    // 3. Approve the store storefront
    const approvedStore = await approveStore(storeId, profile.id, ipAddress)

    return NextResponse.json({
      success: true,
      data: approvedStore,
      message: `Store '${approvedStore.name}' has been successfully approved and verified.`,
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/stores/[id]/approve API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during store approval.',
      },
      { status: 500 }
    )
  }
}, ['admin', 'moderator'])
