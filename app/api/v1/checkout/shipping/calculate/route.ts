import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCartWithItems } from '@/lib/db/cart'
import { calculateStoreShipping } from '@/lib/shipping/calculator'
import type { FullCartItem } from '@/lib/cart-checkout.types'
import { createClient } from '@/lib/supabase/server'

const addressSchema = z.object({
  fullName: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required for shipping calculations.'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, 'Country is required for shipping calculations.'),
  phone: z.string().optional()
})

const shippingCalcSchema = z.object({
  cartId: z.string().uuid().optional().nullable(),
  destinationAddress: addressSchema
})

/**
 * POST /api/v1/checkout/shipping/calculate
 * Estimates shipping cost per-store based on item weights, count, and destination zones.
 * Destination zones: Local (Essaouira Medina), National (Morocco), International (World).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = shippingCalcSchema.safeParse(body)

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

    const { cartId, destinationAddress } = parsed.data

    // 1. Resolve cart ID (accept passed UUID or resolve via session)
    let finalCartId: string
    if (!cartId) {
      // Import and call resolveCartSession if cartId was not explicitly passed
      const { resolveCartSession } = await import('@/app/api/v1/cart/route')
      const cart = await resolveCartSession()
      finalCartId = cart.id
    } else {
      finalCartId = cartId
    }

    // 2. Fetch Cart Details
    const cartDetails = await getCartWithItems(finalCartId)
    if (!cartDetails || cartDetails.items.length === 0) {
      return NextResponse.json(
        { success: false, data: null, message: 'Cart not found or empty.' },
        { status: 400 }
      )
    }

    const { items } = cartDetails
    const supabase = await createClient()

    // 3. Group items by store_id
    const storeGroups: Record<string, { storeName: string; items: FullCartItem[] }> = {}
    for (const item of items) {
      const storeId = item.store_id
      if (!storeGroups[storeId]) {
        const { data: store } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .maybeSingle()

        storeGroups[storeId] = {
          storeName: store?.name || 'Artisan Partner Store',
          items: []
        }
      }
      storeGroups[storeId].items.push(item)
    }

    // 4. Calculate shipping per store partition
    const storeEstimates: { storeId: string; storeName: string; shippingCost: number; itemCount: number }[] = []
    let grandShippingTotal = 0

    for (const [storeId, group] of Object.entries(storeGroups)) {
      const shippingInfo = await calculateStoreShipping(storeId, group.items, destinationAddress)
      const shippingCost = Number(shippingInfo.fee)
      const itemCount = group.items.reduce((sum, item) => sum + item.quantity, 0)
      
      grandShippingTotal += shippingCost
      storeEstimates.push({
        storeId,
        storeName: group.storeName,
        shippingCost: Math.round(shippingCost * 100) / 100,
        itemCount
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        stores: storeEstimates,
        shippingTotal: Math.round(grandShippingTotal * 100) / 100
      },
      message: 'Shipping calculations estimated successfully.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/checkout/shipping/calculate error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to estimate shipping costs.' },
      { status: 500 }
    )
  }
}
