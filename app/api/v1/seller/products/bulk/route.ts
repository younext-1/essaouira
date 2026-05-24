import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { createProduct } from '@/lib/db/products'

// Schema for bulk insertion validation
const bulkSchema = z.array(
  z.object({
    category_id: z.string().uuid().nullable().optional(),
    name: z.string().min(1, 'Name is required'),
    name_ar: z.string().nullable().optional(),
    name_fr: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    description_ar: z.string().nullable().optional(),
    description_fr: z.string().nullable().optional(),
    price: z.number().min(0, 'Price must be positive'),
    compare_at_price: z.number().min(0).nullable().optional(),
    images: z.array(z.string()).default([]),
    thumbnail_url: z.string().nullable().optional(),
    type: z.enum(['physical', 'experience']),
    status: z.enum(['draft', 'active', 'paused', 'sold_out', 'archived']).default('draft'),
    stock: z.number().int().min(0).default(0),
    weight_grams: z.number().int().min(0).nullable().optional(),
    dimensions: z.object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0)
    }).nullable().optional(),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.any()).default({}),
    is_featured: z.boolean().default(false),
  })
).min(1, 'Array must contain at least one product.')

/**
 * POST /api/v1/seller/products/bulk
 * Standard transactional-like insertion of a batch array of products under the active store.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found. An active store is required for bulk imports.' },
        { status: 404 }
      )
    }

    if (!store.is_active) {
      return NextResponse.json(
        { success: false, data: null, message: 'Listing rejected. Your store is currently inactive.' },
        { status: 403 }
      )
    }

    // 2. Parse and validate array payload
    const body = await request.json()
    const parseResult = bulkSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Bulk parsing validation failure.',
          errors: parseResult.error.issues.map((err: any) => `Index ${err.path.join('.')}: ${err.message}`)
        },
        { status: 400 }
      )
    }

    const productsToInsert = parseResult.data
    const createdProducts = []

    // 3. Sequentially insert products to isolate single listing failures
    for (const item of productsToInsert) {
      const product = await createProduct(store.id, {
        ...item,
        experience_details: null // Experience slot creation in bulk is delegated to specific slot schedules
      })
      createdProducts.push(product)
    }

    return NextResponse.json({
      success: true,
      data: createdProducts,
      message: `Successfully imported and seeded ${createdProducts.length} listings into your catalog.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/products/bulk API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during batch product insertion.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
