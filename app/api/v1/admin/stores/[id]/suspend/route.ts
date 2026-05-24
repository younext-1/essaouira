import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, suspendStore } from '@/lib/db/stores'

const suspendStoreSchema = z.object({
  reason: z.string()
    .min(5, { message: 'Reason must be at least 5 characters.' })
    .max(500, { message: 'Reason cannot exceed 500 characters.' }),
})

/**
 * POST /api/v1/admin/stores/[id]/suspend
 * Suspends an active storefront.
 * Restricted to administrators only.
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

    const body = await request.json()

    // 2. Validate request body
    const parsedBody = suspendStoreSchema.safeParse(body)
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: A valid suspension reason is required.',
          errors: parsedBody.error.format(),
        },
        { status: 400 }
      )
    }

    // 3. Fetch IP address for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'

    // 4. Suspend the store storefront
    const suspendedStore = await suspendStore(storeId, parsedBody.data.reason, profile.id, ipAddress)

    return NextResponse.json({
      success: true,
      data: suspendedStore,
      message: `Store '${suspendedStore.name}' has been suspended. Reason: '${parsedBody.data.reason}'`,
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/admin/stores/[id]/suspend API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during store suspension.',
      },
      { status: 500 }
    )
  }
}, ['admin'])
