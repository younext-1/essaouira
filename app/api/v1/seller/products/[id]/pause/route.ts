import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductBySlug, updateProduct } from '@/lib/db/products'

/**
 * POST /api/v1/seller/products/[id]/pause
 * Pauses a product listing, temporarily hiding it from the public (status = 'paused').
 */
export const POST = withAuth(async (request, context, profile) => {
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

    // 3. Enforce product ownership
    if (product.store_id !== store.id) {
      return NextResponse.json(
        { success: false, data: null, message: 'Forbidden. You do not own this product.' },
        { status: 403 }
      )
    }

    // 4. Update status to paused
    const updated = await updateProduct(product.id, store.id, { status: 'paused' })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Product '${product.name}' has been successfully paused.`
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/seller/products/[id]/pause error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while pausing the product.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
