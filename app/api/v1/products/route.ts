import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProducts } from '@/lib/db/products'
import type { ProductFilters } from '@/lib/database.types'

// Setup query schemas validation using Zod
const querySchema = z.object({
  category: z.string().optional(),
  type: z.enum(['physical', 'experience']).optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  location: z.string().optional(),
  tags: z.string().optional(),
  store_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
})

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/products
 * Retrieves active products catalog with paginated multi-filtering.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query params using Zod
    const queryParams = Object.fromEntries(searchParams.entries())
    const parseResult = querySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid request filter parameter query.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { 
      category, 
      type, 
      price_min, 
      price_max, 
      rating, 
      location, 
      tags, 
      store_id, 
      page, 
      limit 
    } = parseResult.data

    // Build the dynamic ProductFilters object
    const filters: ProductFilters = {
      status: 'active' // Securely limit catalog reading to active listings
    }

    if (category) filters.category = category
    if (type) filters.type = type
    if (price_min !== undefined) filters.price_min = price_min
    if (price_max !== undefined) filters.price_max = price_max
    if (rating !== undefined) filters.rating = rating
    if (location) filters.location = location
    if (store_id) filters.store_id = store_id
    if (tags) {
      filters.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    // Call catalog query database handler
    const result = await getProducts(filters, page, limit)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Active products catalog retrieved successfully.',
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/products API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while listing products.'
      },
      { status: 500 }
    )
  }
}
