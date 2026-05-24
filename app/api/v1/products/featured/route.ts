import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFeaturedProducts } from '@/lib/db/products'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(8)
})

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/products/featured
 * Returns the list of featured products.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = querySchema.parse({ limit: searchParams.get('limit') || undefined }).limit

    const products = await getFeaturedProducts(limit)

    return NextResponse.json({
      success: true,
      data: products,
      message: 'Featured products retrieved successfully.'
    })
  } catch (err: any) {
    console.error('🔴 GET /api/v1/products/featured API error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching featured products.'
      },
      { status: 500 }
    )
  }
}
