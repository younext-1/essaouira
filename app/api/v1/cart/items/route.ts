import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveCartSession } from '../route'
import { addToCart } from '@/lib/cart/cart-manager'

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive()
})

/**
 * POST /api/v1/cart/items
 * Adds a product (or product variant) to the resolved active cart.
 * Automatically checks catalog status and inventory limits.
 */
export async function POST(request: Request) {
  try {
    const cart = await resolveCartSession()
    const body = await request.json().catch(() => ({}))
    
    const parsed = addToCartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { productId, variantId, quantity } = parsed.data
    const result = await addToCart(cart.id, productId, variantId || null, quantity)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Item added to cart successfully.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/cart/items error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to add item to cart.' },
      { status: 500 }
    )
  }
}
