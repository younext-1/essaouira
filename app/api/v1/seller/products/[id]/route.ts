import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductBySlug, updateProduct } from '@/lib/db/products'

// Schema for updating product
const updateProductSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).optional(),
  name_ar: z.string().nullable().optional(),
  name_fr: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  description_fr: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  compare_at_price: z.number().min(0).nullable().optional(),
  images: z.array(z.string()).optional(),
  thumbnail_url: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'paused', 'sold_out', 'archived']).optional(),
  stock: z.number().int().min(0).optional(),
  weight_grams: z.number().int().min(0).nullable().optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  is_featured: z.boolean().optional(),
  experience_details: z.object({
    duration_hours: z.number().min(0.1).optional(),
    max_participants: z.number().int().min(1).optional(),
    meeting_point: z.string().min(1).optional(),
    meeting_point_coords: z.any().optional(),
    languages: z.array(z.string()).optional(),
    includes: z.array(z.string()).optional(),
    excludes: z.array(z.string()).optional(),
    cancellation_policy: z.string().nullable().optional(),
    min_age: z.number().int().min(0).nullable().optional()
  }).nullable().optional()
})

/**
 * GET /api/v1/seller/products/[id]
 * Fetch a single product detail with store verification.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const productId = resolvedParams?.id

    if (!productId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Fetch product details
    const product = await getProductBySlug(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found.' },
        { status: 404 }
      )
    }

    // 3. Enforce product belongs to active storefront
    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this product.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product details retrieved successfully.'
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/seller/products/[id] API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching product details.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])

/**
 * PATCH /api/v1/seller/products/[id]
 * Updates product attributes. Enforces store ownership limits.
 */
export const PATCH = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const productId = resolvedParams?.id

    if (!productId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Verify product exists and belongs to active storefront
    const product = await getProductBySlug(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found.' },
        { status: 404 }
      )
    }

    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this product.' },
        { status: 403 }
      )
    }

    // 3. Parse and validate attributes
    const body = await request.json()
    const parseResult = updateProductSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed for product update.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    // 4. Trigger database update
    const updated = await updateProduct(product.id, store.id, parseResult.data)

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Product '${updated.name}' updated successfully.`
    })
  } catch (err: any) {
    console.error('🔴 PATCH /api/v1/seller/products/[id] API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during product update.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])

/**
 * DELETE /api/v1/seller/products/[id]
 * Enforces secure soft deletion (status = 'archived') to protect history.
 */
export const DELETE = withAuth(async (request, context, profile) => {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const productId = resolvedParams?.id

    if (!productId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID parameter is required.' },
        { status: 400 }
      )
    }

    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found.' },
        { status: 404 }
      )
    }

    // 2. Verify product exists and belongs to active storefront
    const product = await getProductBySlug(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product not found.' },
        { status: 404 }
      )
    }

    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this product.' },
        { status: 403 }
      )
    }

    // 3. Mark the product listing as archived
    const updated = await updateProduct(product.id, store.id, { status: 'archived' })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Product '${product.name}' was successfully archived.`
    })
  } catch (err: any) {
    console.error('🔴 DELETE /api/v1/seller/products/[id] API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while deleting the product.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
