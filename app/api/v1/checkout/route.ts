import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { getProfileByClerkId } from '@/lib/db/users'
import { getCartByBuyer, getCartWithItems } from '@/lib/db/cart'
import { initializeCheckout } from '@/lib/checkout/checkout-manager'

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  line1: z.string().min(3, 'Address line 1 must be at least 3 characters.'),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, 'City must be at least 2 characters.'),
  state: z.string().min(2, 'State must be at least 2 characters.'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters.'),
  country: z.string().min(2, 'Country must be at least 2 characters.'),
  phone: z.string().min(5, 'Phone number must be at least 5 characters.')
})

const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional().nullable()
})

/**
 * POST /api/v1/checkout
 * Initializes a secure checkout session for the authenticated buyer.
 * 1. Checks and locks inventory stock concurrently for 10 minutes (TTL).
 * 2. Partitions cart items by store.
 * 3. Estimates shipping per store.
 * 4. Applies and validates cart coupon code.
 * 5. Returns the initialized checkout session details.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { success: false, data: null, message: 'Unauthorized. You must be signed in to checkout.' },
        { status: 401 }
      )
    }

    // 2. Fetch authenticated user's DB profile
    const profile = await getProfileByClerkId(clerkId)
    if (!profile) {
      return NextResponse.json(
        { success: false, data: null, message: 'Profile not found for authenticated user.' },
        { status: 404 }
      )
    }

    // 3. Validate request body
    const body = await request.json().catch(() => ({}))
    const parsed = checkoutSchema.safeParse(body)
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

    const { shippingAddress, billingAddress } = parsed.data

    // 4. Resolve user's active cart
    const cart = await getCartByBuyer(profile.id)
    if (!cart) {
      return NextResponse.json(
        { success: false, data: null, message: 'No active cart found for this user.' },
        { status: 400 }
      )
    }

    // 5. Check if cart is empty
    const cartDetails = await getCartWithItems(cart.id)
    if (!cartDetails || cartDetails.items.length === 0) {
      return NextResponse.json(
        { success: false, data: null, message: 'Your cart is empty. Add items to checkout.' },
        { status: 400 }
      )
    }

    // 6. Initialize Checkout Session (locks inventory atomically)
    const session = await initializeCheckout(
      cart.id,
      profile.id,
      shippingAddress,
      billingAddress || null
    )

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Checkout session initialized successfully. Inventory stock has been locked for 10 minutes.'
    })
  } catch (err: any) {
    console.error('🔴 POST /api/v1/checkout error:', err)
    return NextResponse.json(
      { success: false, data: null, message: err.message || 'Failed to initialize checkout.' },
      { status: 500 }
    )
  }
}
