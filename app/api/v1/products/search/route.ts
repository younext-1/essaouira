import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchProducts } from '@/lib/db/products'
import type { ProductFilters } from '@/lib/database.types'

const querySchema = z.object({
  q: z.string().default(''),
  category: z.string().optional(),
  type: z.enum(['physical', 'experience']).optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  location: z.string().optional(),
  store_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
})

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/products/search
 * Executes a full-text Arabic/French/English search against fts_document GIN indexes.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const parseResult = querySchema.safeParse(queryParams)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid search parameters query.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { 
      q,
      category, 
      type, 
      price_min, 
      price_max, 
      rating, 
      location, 
      store_id, 
      page, 
      limit 
    } = parseResult.data

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Empty query passed. Returned empty search results array.',
        pagination: { page, limit, total: 0, totalPages: 0 }
      })
    }

    const filters: ProductFilters = {
      status: 'active'
    }

    if (category) filters.category = category
    if (type) filters.type = type
    if (price_min !== undefined) filters.price_min = price_min
    if (price_max !== undefined) filters.price_max = price_max
    if (rating !== undefined) filters.rating = rating
    if (location) filters.location = location
    if (store_id) filters.store_id = store_id

    const result = await searchProducts(q, filters, page, limit)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Full-text search for query '${q}' executed successfully.`,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/products/search API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred during product search.'
      },
      { status: 500 }
    )
  }
}
