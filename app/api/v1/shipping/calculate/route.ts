// API Route: app/api/v1/shipping/calculate/route.ts
// Calculates multi-vendor checkout shipping fees per store and total.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCartWithItems } from '@/lib/db/cart';
import { calculateCartShipping } from '@/lib/shipping/calculator';

const addressSchema = z.object({
  fullName: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required for shipping calculations.'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2, 'Country is required for shipping calculations.'),
  phone: z.string().optional()
});

const calcSchema = z.object({
  cartId: z.string().uuid('Invalid Cart ID format.'),
  destinationAddress: addressSchema
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = calcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Validation failed.',
          errors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { cartId, destinationAddress } = parsed.data;

    // 1. Fetch Cart details
    const cartDetails = await getCartWithItems(cartId);
    if (!cartDetails || cartDetails.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Cart is empty or does not exist.'
        },
        { status: 400 }
      );
    }

    // 2. Perform multi-vendor shipping calculation
    const calcResult = await calculateCartShipping(cartDetails.items, destinationAddress);

    return NextResponse.json({
      success: true,
      data: calcResult,
      message: 'Shipping calculated successfully.'
    });
  } catch (err: any) {
    console.error('🔴 POST /api/v1/shipping/calculate error:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: err.message || 'An error occurred during shipping calculations.'
      },
      { status: 500 }
    );
  }
}
