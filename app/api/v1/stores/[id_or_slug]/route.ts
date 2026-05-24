import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { withAuth } from '@/lib/auth/middleware'
import { getStore, getStoreBySlug, updateStoreSettings, softDeleteStore } from '@/lib/db/stores'
import { getProfileByClerkId } from '@/lib/db/users'
import { getProductsByStore } from '@/lib/db/products'

// Settings Update Zod Schema
const updateStoreSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
  working_hours: z.record(z.string(), z.string()).optional(),
})

/**
 * Utility helper to determine if parameter string is a valid UUID.
 */
function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Helper to fetch a store by ID or slug.
 */
async function resolveStore(idOrSlug: string) {
  if (isUuid(idOrSlug)) {
    return await getStore(idOrSlug)
  }
  return await getStoreBySlug(idOrSlug)
}

/**
 * GET /api/v1/stores/[id_or_slug]
 * Public endpoint to fetch store details with a product list preview.
 * If the store is inactive (under onboarding), only the owner or admins can fetch it.
 */
export async function GET(request: Request, context: any) {
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
        { success: false, data: null, message: 'Store not found or has been deleted.' },
        { status: 404 }
      )
    }

    // Secure inactive stores
    if (!store.is_active) {
      const { userId: clerkId } = await auth()
      let isAuthorized = false

      if (clerkId) {
        const profile = await getProfileByClerkId(clerkId)
        if (profile) {
          isAuthorized = profile.id === store.owner_id || profile.role === 'admin' || profile.role === 'moderator'
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            message: 'Forbidden: This store is currently undergoing onboarding setup and is not yet public.',
          },
          { status: 403 }
        )
      }
    }

    // Fetch product list preview (first 12 products)
    const products = await getProductsByStore(store.id)
    const productsPreview = products.slice(0, 12)

    return NextResponse.json({
      success: true,
      data: {
        store,
        products: productsPreview,
      },
      message: 'Store details and product list preview fetched successfully.',
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/stores/[id_or_slug] error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected failure occurred while fetching store details.',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/stores/[id_or_slug]
 * Restricted to the store owner. Updates store parameters.
 */
export const PATCH = withAuth(async (request, context, profile) => {
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

    // Verify ownership
    if (store.owner_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden: You are not authorized to update this store.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate update fields
    const parsed = updateStoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed: Invalid update properties.',
          errors: parsed.error.format(),
        },
        { status: 400 }
      )
    }

    // Execute update
    const updatedStore = await updateStoreSettings(store.id, parsed.data)

    return NextResponse.json({
      success: true,
      data: updatedStore,
      message: 'Store settings updated successfully.',
    })
  } catch (err: any) {
    console.error('🔴 PATCH /api/v1/stores/[id_or_slug] error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while updating store settings.',
      },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/v1/stores/[id_or_slug]
 * Restricted to the store owner. Performs a soft-delete on the store storefront.
 */
export const DELETE = withAuth(async (request, context, profile) => {
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

    // Verify ownership
    if (store.owner_id !== profile.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden: You are not authorized to delete this store.' },
        { status: 403 }
      )
    }

    // Execute soft delete
    await softDeleteStore(store.id)

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Store storefront soft-deleted successfully.',
    })
  } catch (err: any) {
    console.error('🔴 DELETE /api/v1/stores/[id_or_slug] error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while deleting your store.',
      },
      { status: 500 }
    )
  }
})
