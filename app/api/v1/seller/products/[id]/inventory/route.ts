import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getStoreByOwner } from '@/lib/db/stores'
import { getProductBySlug } from '@/lib/db/products'
import { createPublicSupabaseClient } from '@/lib/supabase/server'

// Validation schema for direct stock updates
const inventoryUpdateSchema = z.object({
  variant_id: z.string().uuid().nullable().default(null),
  quantity: z.number().int().min(0, 'Quantity must be non-negative')
})

/**
 * PATCH /api/v1/seller/products/[id]/inventory
 * Performs a direct inventory quantity adjustment. Reactive triggers sync products.status automatically.
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

    // 4. Parse request body
    const body = await request.json()
    const parseResult = inventoryUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid inventory request body parameters.',
          errors: parseResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { variant_id, quantity } = parseResult.data
    const supabase = createPublicSupabaseClient()

    // 5. Update or insert the product inventory metrics record
    const { data: inventory, error } = await supabase
      .from('product_inventory')
      .upsert({
        product_id: product.id,
        variant_id: variant_id,
        quantity: quantity,
        reserved: 0 // Resetting reservation or keeping it is handled by PostgreSQL
      }, { onConflict: 'product_id,variant_id' })
      .select()
      .single()

    if (error) throw error

    // Fetch the updated product to see its updated stock and status
    const updatedProduct = await getProductBySlug(product.id)

    return NextResponse.json({
      success: true,
      data: {
        inventory,
        product: {
          stock: updatedProduct?.stock,
          status: updatedProduct?.status
        }
      },
      message: 'Direct product inventory quantity updated successfully.'
    })
  } catch (err: any) {
    console.error('🔴 PATCH /api/v1/seller/products/[id]/inventory error:', err)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An unexpected error occurred while updating product inventory.'
      },
      { status: 500 }
    )
  }
}, ['artisan', 'admin'])
