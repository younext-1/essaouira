import { NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/db/products'

/**
 * GET /api/v1/products/[id_or_slug]
 * Returns full product details (including variants, inventory, and experience structures).
 */
export async function GET(
  request: Request,
  context: { params: any }
) {
  try {
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params
    const idOrSlug = resolvedParams?.id_or_slug

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product ID or slug parameter is required.' },
        { status: 400 }
      )
    }

    const product = await getProductBySlug(idOrSlug)

    if (!product) {
      return NextResponse.json(
        { success: false, data: null, message: 'Product listing not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product details retrieved successfully.'
    })
  } catch (err: any) {
    console.error(`🔴 GET /api/v1/products/[id_or_slug] error for ${context.params?.id_or_slug}:`, err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while fetching product details.'
      },
      { status: 500 }
    )
  }
}
