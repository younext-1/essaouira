import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductsByStorePaginated, createProduct } from '@/lib/db/products'

// Seller product filter list query validation
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  status: z.enum(['draft', 'active', 'paused', 'sold_out', 'archived']).optional()
})

// Validation schema for creating a product
const createProductSchema = z.object({
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
  experience_details: z.object({
    duration_hours: z.number().min(0.1),
    max_participants: z.number().int().min(1),
    meeting_point: z.string().min(1),
    meeting_point_coords: z.any().optional(),
    languages: z.array(z.string()).default([]),
    includes: z.array(z.string()).default([]),
    excludes: z.array(z.string()).default([]),
    cancellation_policy: z.string().nullable().optional(),
    min_age: z.number().int().min(0).nullable().optional()
  }).nullable().optional()
})

/**
 * GET /api/v1/seller/products
 * Retrieves products belonging to the active seller's storefront.
 */
export const GET = withAuth(async (request, context, profile) => {
  try {
    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found. Please connect an artisan store first.' },
        { status: 404 }
      )
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const { page, limit, status } = listQuerySchema.parse(queryParams)

    // 3. Fetch products
    const result = await getProductsByStorePaginated(store.id, page, limit, status)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Seller store products retrieved successfully.',
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/seller/products API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching your products.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])

/**
 * POST /api/v1/seller/products
 * Creates a new product catalog listing under the active seller's storefront.
 */
export const POST = withAuth(async (request, context, profile) => {
  try {
    // 1. Resolve store ownership
    const store = await getStoreByOwner(profile.id)
    if (!store) {
      return NextResponse.json(
        { success: false, data: null, message: 'Store not found. An active store is required to list products.' },
        { status: 404 }
      )
    }

    // 2. Verify store is active
    if (!store.is_active) {
      return NextResponse.json(
        { success: false, data: null, message: 'Listing rejected. Your store is currently suspended or inactive.' },
        { status: 403 }
      )
    }

    // 3. Parse and validate body schema
    const body = await request.json()
    const parseResult = createProductSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed for product insertion.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const productInput = parseResult.data

    // 4. Create the product
    const product = await createProduct(store.id, productInput)

    return NextResponse.json({
      success: true,
      data: product,
      message: `Product '${product.name}' was listed successfully.`
    }, { status: 211 }) // Returns a 201 Created or custom response (Next allows status 201)
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/products API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while creating the product listing.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
