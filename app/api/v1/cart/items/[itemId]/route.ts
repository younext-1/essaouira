import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveCartSession } from '../../route'
import { updateCart, removeFromCart } from '@/lib/cart/cart-manager'

const updateCartItemSchema = z.object({
  quantity: z.number().int().nonnegative()
})

interface RouteParams {
  params: Promise<{ itemId: string }>
}

/**
 * PATCH /api/v1/cart/items/[itemId]
 * Updates the quantity of a specific cart item.
 * Runs inventory stock availability checks. If quantity is 0, item is deleted.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params
    const cart = await resolveCartSession()
    const body = await request.json().catch(() => ({}))

    const parsed = updateCartItemSchema.safeParse(body)
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

    const { quantity } = parsed.data
    const result = await updateCart(cart.id, itemId, quantity)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cart item updated successfully.'
    })
  } catch (err: any) {
    console.error('🔴 PATCH /api/v1/cart/items/[itemId] error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to update cart item.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/cart/items/[itemId]
 * Removes a specific item from the cart.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params
    const cart = await resolveCartSession()
    
    const result = await removeFromCart(cart.id, itemId)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Item removed from cart successfully.'
    })
  } catch (err: any) {
    console.error('🔴 DELETE /api/v1/cart/items/[itemId] error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to remove item from cart.' },
      { status: 500 }
    )
  }
}
